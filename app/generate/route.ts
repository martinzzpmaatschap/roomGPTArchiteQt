// =============================================================================
// ARCHITEQT - AI Room Designer API Route
// Model: rocketdigitalai/interior-design-sdxl-lightning
// Speed: ~9 seconds | Cost: ~$0.011/generation
// Last Updated: 2026-02-06
// FIX: Convert Bytescale thumbnail URLs to raw URLs for Replicate compatibility
// =============================================================================

import Replicate from "replicate";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { buildPrompt } from "../../utils/dropdownTypes";

// =============================================================================
// UPSTASH REDIS SETUP (Rate Limiting)
// =============================================================================
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(100, "24 h"), // Temp: 100 voor testing
      analytics: true,
      prefix: "architeqt-roomdesigner",
    })
  : null;

// =============================================================================
// REPLICATE CLIENT
// =============================================================================
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// =============================================================================
// HELPER: Fix Bytescale URL for Replicate compatibility
// Replicate cannot fetch /thumbnail/ URLs - they return transformation metadata
// instead of actual image data. We need to use /raw/ URLs instead.
// =============================================================================
function fixBytescaleUrl(url: string): string {
  if (!url) return url;
  
  // Check if this is a Bytescale URL with /thumbnail/ path
  if (url.includes('upcdn.io') && url.includes('/thumbnail/')) {
    const fixedUrl = url.replace('/thumbnail/', '/raw/');
    console.log("🔧 [ArchiteQt] Fixed Bytescale URL:");
    console.log("   Original:", url);
    console.log("   Fixed:", fixedUrl);
    return fixedUrl;
  }
  
  // Also handle /image/ transformation URLs (just in case)
  if (url.includes('upcdn.io') && url.includes('/image/')) {
    const fixedUrl = url.replace('/image/', '/raw/');
    console.log("🔧 [ArchiteQt] Fixed Bytescale image URL:");
    console.log("   Original:", url);
    console.log("   Fixed:", fixedUrl);
    return fixedUrl;
  }
  
  return url;
}

// =============================================================================
// POST HANDLER
// =============================================================================
export async function POST(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // Rate Limiting Check
    // -------------------------------------------------------------------------
    if (ratelimit) {
      const ip = request.headers.get("x-forwarded-for") ?? 
                 request.headers.get("x-real-ip") ?? 
                 "127.0.0.1";
      
      const { success, limit, remaining, reset } = await ratelimit.limit(ip);

      if (!success) {
        const resetDate = new Date(reset);
        return NextResponse.json(
          {
            error: "Limiet bereikt",
            message: `Je hebt het maximum van ${limit} generaties per 24 uur bereikt. Probeer weer na ${resetDate.toLocaleTimeString("nl-NL")}.`,
            limit,
            remaining: 0,
            resetAt: reset,
          },
          { 
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": reset.toString(),
            }
          }
        );
      }
    }

    // -------------------------------------------------------------------------
    // Parse Request Body
    // -------------------------------------------------------------------------
    const body = await request.json();
    const { imageUrl: rawImageUrl, theme, room } = body;

    // -------------------------------------------------------------------------
    // Input Validation
    // -------------------------------------------------------------------------
    if (!rawImageUrl) {
      return NextResponse.json(
        { error: "Geen afbeelding opgegeven. Upload eerst een foto van je kamer." },
        { status: 400 }
      );
    }

    if (!theme) {
      return NextResponse.json(
        { error: "Kies een stijl voor je nieuwe interieur." },
        { status: 400 }
      );
    }

    if (!room) {
      return NextResponse.json(
        { error: "Selecteer het type kamer." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // FIX: Convert Bytescale thumbnail URL to raw URL
    // -------------------------------------------------------------------------
    const imageUrl = fixBytescaleUrl(rawImageUrl);

    // -------------------------------------------------------------------------
    // Build Prompts using Helper Function
    // -------------------------------------------------------------------------
    const { prompt, negativePrompt } = buildPrompt(theme, room);

    console.log("🎨 [ArchiteQt] Generatie gestart");
    console.log("   Stijl:", theme);
    console.log("   Kamer:", room);
    console.log("   Image URL:", imageUrl);
    console.log("   Prompt (preview):", prompt.substring(0, 80) + "...");

    // -------------------------------------------------------------------------
    // Replicate API Call - Use predictions.create with polling
    // -------------------------------------------------------------------------
    const startTime = Date.now();

    // Create prediction (don't wait for download)
    const prediction = await replicate.predictions.create({
      version: "5d8da4e5c98fea03dcfbe3ec89e40cf0f4a0074a8930fa02aa0ee2aaf98c3d11",
      input: {
        image: imageUrl,
        prompt: prompt,
        negative_prompt: negativePrompt,
        num_inference_steps: 6,
        guidance_scale: 7.5,
        depth_strength: 0.8,
      },
    });

    console.log("🎨 [ArchiteQt] Prediction created:", prediction.id);

    // Poll for completion (with timeout)
    let result = prediction;
    const maxWaitTime = 45000; // 45 seconds max
    const pollInterval = 2000; // Check every 2 seconds
    const startPoll = Date.now();

    while (result.status !== "succeeded" && result.status !== "failed") {
      if (Date.now() - startPoll > maxWaitTime) {
        throw new Error("Timeout: Generatie duurde te lang");
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      result = await replicate.predictions.get(prediction.id);
      console.log("🔄 [ArchiteQt] Status:", result.status);
    }

    if (result.status === "failed") {
      // Extract error message safely
      let errorMsg = "Generatie mislukt";
      if (result.error) {
        if (typeof result.error === 'string') {
          errorMsg = result.error;
        } else if (typeof result.error === 'object') {
          const errorObj = result.error as Record<string, unknown>;
          errorMsg = (errorObj.message as string) || 
                     (errorObj.detail as string) || 
                     JSON.stringify(result.error);
        }
      }
      throw new Error(errorMsg);
    }

    const duration = Date.now() - startTime;

    // Get the output URL directly (don't download)
    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;

    console.log("✅ [ArchiteQt] Generatie voltooid in", duration, "ms");
    console.log("📍 [DEBUG] Output URL:", outputUrl);

    if (!outputUrl || typeof outputUrl !== 'string') {
      throw new Error("Geen output URL ontvangen");
    }

    // -------------------------------------------------------------------------
    // Return Success Response
    // -------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      output: outputUrl,
      metadata: {
        duration: duration,
        style: theme,
        room: room,
        model: "interior-design-sdxl-lightning",
      },
    });

  } catch (error: unknown) {
    // -------------------------------------------------------------------------
    // Error Handling
    // -------------------------------------------------------------------------
    console.error("❌ [ArchiteQt] Generatie fout:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Specifieke error responses
    if (errorMessage.includes("rate limit") || errorMessage.includes("Rate limit")) {
      return NextResponse.json(
        { 
          error: "API limiet bereikt", 
          message: "De AI service is tijdelijk overbelast. Probeer het over enkele minuten opnieuw." 
        },
        { status: 429 }
      );
    }

    if (errorMessage.includes("Invalid API token") || errorMessage.includes("Unauthorized")) {
      console.error("🔑 [ArchiteQt] KRITIEK: Ongeldige API token!");
      return NextResponse.json(
        { 
          error: "Configuratiefout", 
          message: "Er is een probleem met de service configuratie. Neem contact op met support." 
        },
        { status: 500 }
      );
    }

    if (errorMessage.includes("NSFW") || errorMessage.includes("safety")) {
      return NextResponse.json(
        { 
          error: "Afbeelding geweigerd", 
          message: "De afbeelding kon niet worden verwerkt. Probeer een andere foto." 
        },
        { status: 400 }
      );
    }

    if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
      return NextResponse.json(
        { 
          error: "Timeout", 
          message: "De generatie duurde te lang. Probeer het opnieuw met een kleinere afbeelding." 
        },
        { status: 504 }
      );
    }

    // Handle Bytescale/input image errors specifically
    if (errorMessage.includes("input_media_unsupported") || 
        errorMessage.includes("invalid, corrupt") ||
        errorMessage.includes("Bad Request for url")) {
      return NextResponse.json(
        { 
          error: "Afbeelding niet ondersteund", 
          message: "De geüploade afbeelding kon niet worden verwerkt. Probeer een andere foto (JPG of PNG)." 
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      { 
        error: "Generatie mislukt", 
        message: "Er ging iets mis bij het genereren van je nieuwe interieur. Probeer het opnieuw." 
      },
      { status: 500 }
    );
  }
}
