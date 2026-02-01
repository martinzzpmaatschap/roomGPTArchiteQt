// =============================================================================
// ARCHITEQT - Nederlandse Interior Design Presets
// Version: 1.0.0
// Last Updated: 2026-02-01
// =============================================================================

export interface StylePreset {
  id: string;
  name: string;
  prompt: string;
  negativePrompt: string;
}

export interface RoomType {
  id: string;
  name: string;
  nameEN: string; // Voor API compatibility
}

// =============================================================================
// 12 NEDERLANDSE INTERIOR DESIGN STIJLEN
// =============================================================================

export const stylePresets: StylePreset[] = [
  {
    id: "scandinavisch",
    name: "Scandinavisch Modern",
    prompt:
      "scandinavian modern interior design, light oak wood floors, crisp white walls, minimal furniture, abundant natural light, hygge cozy atmosphere, clean lines, neutral colors with soft pastel accents, large windows, simple elegant decor, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "cluttered, dark, ornate, heavy furniture, busy patterns, excessive decoration, low quality, blurry, distorted, watermark, text",
  },
  {
    id: "grachtenpand",
    name: "Amsterdamse Grachtenpand",
    prompt:
      "classic amsterdam canal house interior, high ornate ceilings with stucco details, tall windows with white frames, herringbone parquet wood floors, elegant period furniture, crystal chandelier, fireplace mantle, sophisticated dutch heritage style, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "modern minimalist, low ceiling, industrial, contemporary furniture, cheap materials, low quality, blurry, distorted",
  },
  {
    id: "industrieel",
    name: "Industrieel Loft",
    prompt:
      "industrial loft interior design, exposed red brick walls, black metal beams and pipes, polished concrete floors, large factory windows, vintage industrial furniture, edison bulb lighting, raw authentic materials, urban warehouse aesthetic, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "cozy traditional, ornate classical, soft pastel colors, romantic style, carpeted floors, low quality, blurry",
  },
  {
    id: "landelijk",
    name: "Landelijk Klassiek",
    prompt:
      "dutch country house interior, exposed wooden ceiling beams, warm earth tones, comfortable linen upholstered furniture, stone fireplace, natural materials, rustic farmhouse charm, cozy inviting atmosphere, antique wooden furniture, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "modern minimalist, industrial, urban contemporary, cold sterile, metal furniture, low quality, blurry",
  },
  {
    id: "minimalistisch",
    name: "Minimalistisch",
    prompt:
      "minimalist interior design, pure white walls, simple functional furniture, hidden storage solutions, monochromatic color palette, zen peaceful atmosphere, uncluttered open space, clean geometric lines, natural light focus, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "cluttered, colorful, ornate, busy patterns, excessive decoration, traditional heavy furniture, low quality, blurry",
  },
  {
    id: "bohemian",
    name: "Bohemian",
    prompt:
      "bohemian eclectic interior, layered colorful textiles, abundant green plants, vintage persian rugs, mix of global patterns, moroccan poufs, macrame wall hangings, warm ambient lighting, artistic creative atmosphere, collected treasures, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "minimal sterile, corporate office, cold modern, monochromatic, empty walls, low quality, blurry",
  },
  {
    id: "art-deco",
    name: "Art Deco",
    prompt:
      "art deco interior design, bold geometric patterns, luxurious velvet furniture, polished brass and gold accents, black lacquer surfaces, marble details, dramatic statement lighting, glamorous 1920s inspired elegance, rich jewel tones, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "rustic farmhouse, minimal modern, casual relaxed, natural organic materials, cheap finishes, low quality, blurry",
  },
  {
    id: "japandi",
    name: "Japandi",
    prompt:
      "japandi interior design, japanese scandinavian fusion, natural light wood, muted earth tone palette, low profile furniture, shoji screen elements, wabi-sabi imperfect beauty aesthetic, peaceful serene atmosphere, organic textures, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "colorful vibrant, ornate decorative, western traditional, cluttered busy, heavy dark furniture, low quality, blurry",
  },
  {
    id: "modern-luxe",
    name: "Modern Luxe",
    prompt:
      "modern luxury interior design, high-end designer furniture, calacatta marble surfaces, polished brass hardware, sophisticated neutral palette, statement contemporary art, elegant ambient lighting, premium materials and finishes, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "cheap budget materials, dated style, cluttered messy, rustic farmhouse, plastic furniture, low quality, blurry",
  },
  {
    id: "coastal",
    name: "Kust & Strand",
    prompt:
      "coastal beach house interior, light blue and white color palette, natural rattan and wicker furniture, weathered wood accents, nautical subtle details, sheer flowing curtains, bright airy atmosphere, relaxed seaside living, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "dark heavy colors, urban industrial, formal traditional, landlocked mountain cabin, heavy drapes, low quality, blurry",
  },
  {
    id: "mid-century",
    name: "Mid-Century Modern",
    prompt:
      "mid-century modern interior, 1950s 1960s iconic furniture design, organic curved shapes, warm walnut wood tones, mustard and teal accent colors, statement lighting fixtures, clean functional aesthetic, retro sophistication, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "contemporary trendy, ornate traditional, industrial raw, rustic country, ultra-modern, low quality, blurry",
  },
  {
    id: "eclectisch",
    name: "Eclectisch",
    prompt:
      "eclectic interior design, curated mix of styles and eras, bold statement colors, unique collected furniture pieces, personality-filled creative space, artful arrangement, conversation starter decor, sophisticated maximalism, professional interior photography, 8k, high quality, detailed",
    negativePrompt:
      "minimal boring, uniform matching sets, corporate sterile, bland generic, cookie-cutter design, low quality, blurry",
  },
];

// =============================================================================
// 8 NEDERLANDSE KAMERTYPES
// =============================================================================

export const roomTypes: RoomType[] = [
  { id: "woonkamer", name: "Woonkamer", nameEN: "Living Room" },
  { id: "slaapkamer", name: "Slaapkamer", nameEN: "Bedroom" },
  { id: "keuken", name: "Keuken", nameEN: "Kitchen" },
  { id: "badkamer", name: "Badkamer", nameEN: "Bathroom" },
  { id: "eetkamer", name: "Eetkamer", nameEN: "Dining Room" },
  { id: "kantoor", name: "Thuiskantoor", nameEN: "Home Office" },
  { id: "kinderkamer", name: "Kinderkamer", nameEN: "Kids Room" },
  { id: "hal", name: "Hal / Entree", nameEN: "Hallway" },
];

// =============================================================================
// EXPORTS VOOR UI (backwards compatibility)
// =============================================================================

// Type aliases voor oude code (lowercase)
export type themeType = string;
export type roomType = string;

// String arrays voor dropdowns (oude UI code verwacht deze)
export const themes: string[] = stylePresets.map((t) => t.name);
export const rooms: string[] = roomTypes.map((r) => r.name);

// =============================================================================
// HELPER FUNCTIES
// =============================================================================

/**
 * Vind een stijl op naam (voor backwards compatibility)
 */
export function getStyleByName(name: string): StylePreset | undefined {
  return stylePresets.find((t) => t.name === name);
}

/**
 * Vind een stijl op ID
 */
export function getStyleById(id: string): StylePreset | undefined {
  return stylePresets.find((t) => t.id === id);
}

/**
 * Vind een kamer op naam (voor backwards compatibility)
 */
export function getRoomByName(name: string): RoomType | undefined {
  return roomTypes.find((r) => r.name === name);
}

/**
 * Bouw een complete prompt voor de AI
 */
export function buildPrompt(
  themeName: string,
  roomName: string,
  customAddition?: string
): { prompt: string; negativePrompt: string } {
  const style = getStyleByName(themeName);
  const room = getRoomByName(roomName);

  if (!style) {
    // Fallback als stijl niet gevonden (zou niet moeten gebeuren)
    return {
      prompt: `${themeName} style ${roomName}, interior design, professional photography, 8k, high quality`,
      negativePrompt:
        "low quality, blurry, distorted, watermark, text",
    };
  }

  const roomContext = room ? `, ${room.nameEN.toLowerCase()} interior` : "";
  const custom = customAddition ? `, ${customAddition}` : "";

  return {
    prompt: `${style.prompt}${roomContext}${custom}`,
    negativePrompt: style.negativePrompt,
  };
}
