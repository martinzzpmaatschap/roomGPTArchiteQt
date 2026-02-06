// =============================================================================
// ARCHITEQT - AI Room Designer API Route
// Model: adirik/interior-design (Realistic Vision V3.0 + ControlNet)
// Quality: Photorealistic | Runs: 1.9M+ | Cost: ~$0.006/generation
// Last Updated: 2026-02-06
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
      limiter: Ratelimit.slidingWindow(100, "24 h"),
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
// =============================================================================
function fixBytescaleUrl(url: string): string {
  if (!url) return url;
  
  if (url.includes('upcdn.io') && url.includes('/thumbnail/')) {
    const fixedUrl = url.replace('/thumbnail/', '/raw/');
    console.log("🔧 [ArchiteQt] Fixed Bytescale URL:");
    console.log("   Original:", url);
    console.log("   Fixed:", fixedUrl);
    return fixedUrl;
  }
  
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
// HELPER: Extract URL from Replicate output
// Replicate SDK v1.0+ returns FileOutput objects instead of raw URL strings
// =============================================================================
function extractOutputUrl(output: unknown): string {
  console.log("📦 [ArchiteQt] Extracting URL from output...");
  console.log("   Raw output type:", typeof output);

  // Case 1: Direct string URL (old SDK format or direct API)
  if (typeof output === 'string') {
    console.log("   ✅ Direct string URL detected");
    return output;
  }

  // Case 2: FileOutput object with .url property (SDK v1.0+)
  if (output && typeof output === 'object' && !Array.isArray(output)) {
    const fileOutput = output as Record<string, unknown>;
    
    if (typeof fileOutput.url === 'string') {
      console.log("   ✅ FileOutput object with .url property");
      return fileOutput.url;
    }
    
    if (typeof fileOutput.image === 'string') {
      console.log("   ✅ Object with .image property");
      return fileOutput.image;
    }
    
    if (typeof fileOutput.output === 'string') {
      console.log("   ✅ Object with .output property");
      return fileOutput.output;
    }

    // Log the actual object structure for debugging
    console.log("   📦 Object keys:", Object.keys(fileOutput));
  }

  // Case 3: Array of outputs
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    console.log("   📦 Array output, processing first element");
    
    if (typeof first === 'string') {
      console.log("   ✅ Array of strings");
      return first;
    }
    
    if (first && typeof first === 'object') {
      const firstObj = first as Record<string, unknown>;
      if (typeof firstObj.url === 'string') {
        console.log("   ✅ Array of FileOutput objects");
        return firstObj.url;
      }
    }
  }

  console.error("   ❌ Could not extract URL. Raw output:", JSON.stringify(output));
  throw new Error("Kon geen geldige afbeelding URL extraheren uit de AI response");
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
    console.log("   Model: adirik/interior-design (Realistic Vision V3.0)");
    console.log("   Stijl:", theme);
    console.log("   Kamer:", room);
    console.log("   Image URL:", imageUrl);
    console.log("   Prompt (preview):", prompt.substring(0, 80) + "...");

    // -------------------------------------------------------------------------
    // Replicate API Call - adirik/interior-design
    // Uses Realistic Vision V3.0 + Segmentation + MLSD ControlNets
    // -------------------------------------------------------------------------
    const startTime = Date.now();

    const prediction = await replicate.predictions.create({
      // adirik/interior-design - Photorealistic interior design
      // 1.9M+ runs, proven quality
      version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705571e0c7a0d20f",
      input: {
        image: imageUrl,
        prompt: prompt,
        negative_prompt: negativePrompt,
        // Optimized parameters for best quality
        num_inference_steps: 30,      // More steps = better quality (was 6)
        guidance_scale: 7.5,          // Standard for Realistic Vision
        prompt_strength: 0.8,         // Balance between original and new design
        // seed: omitted for random variation
      },
    });

    console.log("🎨 [ArchiteQt] Prediction created:", prediction.id);

    // -------------------------------------------------------------------------
    // Poll for completion (with timeout)
    // -------------------------------------------------------------------------
    let result = prediction;
    const maxWaitTime = 120000; // 120 seconds max
    const pollInterval = 2000;
    const startPoll = Date.now();

    while (result.status !== "succeeded" && result.status !== "failed") {
      if (Date.now() - startPoll > maxWaitTime) {
        throw new Error("Timeout: Generatie duurde te lang");
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      result = await replicate.predictions.get(prediction.id);
      console.log("🔄 [ArchiteQt] Status:", result.status);
    }

    // -------------------------------------------------------------------------
    // Handle Failed Predictions
    // -------------------------------------------------------------------------
    if (result.status === "failed") {
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
    console.log("✅ [ArchiteQt] Generatie voltooid in", duration, "ms");

    // -------------------------------------------------------------------------
    // FIX: Extract URL from FileOutput object (SDK v1.0+)
    // -------------------------------------------------------------------------
    const outputUrl = extractOutputUrl(result.output);
    console.log("📍 [ArchiteQt] Final output URL:", outputUrl);

    if (!outputUrl) {
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
        model: "adirik/interior-design",
        version: "realistic-vision-v3.0",
      },
    });

  } catch (error: unknown) {
    // -------------------------------------------------------------------------
    // Error Handling
    // -------------------------------------------------------------------------
    console.error("❌ [ArchiteQt] Generatie fout:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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

    return NextResponse.json(
      { 
        error: "Generatie mislukt", 
        message: "Er ging iets mis bij het genereren van je nieuwe interieur. Probeer het opnieuw." 
      },
      { status: 500 }
    );
  }
}
