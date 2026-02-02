import { Ratelimit } from "@upstash/ratelimit";
import redis from "../../utils/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { buildPrompt } from "../../utils/dropdownTypes";

// =============================================================================
// ARCHITEQT - AI ROOM DESIGNER
// Model: rocketdigitalai/interior-design-sdxl-lightning
// Speed: ~9 seconds | Cost: ~$0.011 per generation
// =============================================================================

// Create a new ratelimiter, that allows 5 requests per 24 hours
const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.fixedWindow(5, "1440 m"),
      analytics: true,
    })
  : undefined;

export async function POST(request: Request) {
  // Rate Limiter Code
  if (ratelimit) {
    const headersList = headers();
    const ipIdentifier = headersList.get("x-real-ip");

    const result = await ratelimit.limit(ipIdentifier ?? "");

    if (!result.success) {
      return new Response(
        "Limiet bereikt. Je hebt het maximum aantal generaties bereikt. Probeer morgen opnieuw.",
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": result.limit,
            "X-RateLimit-Remaining": result.remaining,
          } as any,
        }
      );
    }
  }

  const { imageUrl, theme, room } = await request.json();

  // Validatie
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Geen afbeelding opgegeven" },
      { status: 400 }
    );
  }

  if (!theme || !room) {
    return NextResponse.json(
      { error: "Kies een stijl en kamertype" },
      { status: 400 }
    );
  }

  // Bouw prompts met Nederlandse stijl presets
  const { prompt, negativePrompt } = buildPrompt(theme, room);

  console.log("🎨 Generatie gestart:", { theme, room });
  console.log("📝 Prompt:", prompt.substring(0, 100) + "...");

  try {
    // POST request to Replicate to start the image generation
    const startTime = Date.now();
    
    let startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + process.env.REPLICATE_API_KEY,
      },
      body: JSON.stringify({
        version:
          "rocketdigitalai/interior-design-sdxl-lightning:latest",
        input: {
          image: imageUrl,
          prompt: prompt,
          negative_prompt: negativePrompt,
          num_inference_steps: 8, // Lightning model: 4-10 steps
          guidance_scale: 2.0, // Lightning model: lower guidance
          controlnet_conditioning_scale: 0.8,
          seed: Math.floor(Math.random() * 1000000),
        },
      }),
    });

    let jsonStartResponse = await startResponse.json();

    // Check for API errors
    if (jsonStartResponse.error) {
      console.error("❌ Replicate API error:", jsonStartResponse.error);
      return NextResponse.json(
        { error: "Er ging iets mis bij het starten. Probeer opnieuw." },
        { status: 500 }
      );
    }

    let endpointUrl = jsonStartResponse.urls.get;

    // GET request to poll for result
    let restoredImage: string | null = null;
    let attempts = 0;
    const maxAttempts = 60; // Max 60 seconds

    while (!restoredImage && attempts < maxAttempts) {
      console.log(`⏳ Polling (${attempts + 1}/${maxAttempts})...`);
      
      let finalResponse = await fetch(endpointUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token " + process.env.REPLICATE_API_KEY,
        },
      });
      
      let jsonFinalResponse = await finalResponse.json();

      if (jsonFinalResponse.status === "succeeded") {
        restoredImage = jsonFinalResponse.output;
        const duration = Date.now() - startTime;
        console.log(`✅ Generatie voltooid in ${duration}ms`);
      } else if (jsonFinalResponse.status === "failed") {
        console.error("❌ Generatie gefaald:", jsonFinalResponse.error);
        return NextResponse.json(
          { error: "Generatie mislukt. Probeer een andere afbeelding." },
          { status: 500 }
        );
      } else {
        // Still processing
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    if (!restoredImage) {
      console.error("❌ Timeout na", maxAttempts, "seconden");
      return NextResponse.json(
        { error: "Generatie duurde te lang. Probeer opnieuw." },
        { status: 504 }
      );
    }

    return NextResponse.json({
      success: true,
      output: restoredImage,
      duration: Date.now() - startTime,
      style: theme,
      room: room,
    });

  } catch (error: any) {
    console.error("❌ Onverwachte fout:", error);
    
    return NextResponse.json(
      { 
        error: "Er ging iets mis. Probeer opnieuw of neem contact op met support.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
