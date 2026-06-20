/** Controlled server-side prompt builder for Gemini try-on. */

export function buildTryOnPrompt(garments) {
  const garmentLines = garments.map((g, i) => {
    const ordinal = i + 2;
    const named = g.name ? ` "${g.name}"` : '';
    const colour = g.colour ? ` in ${g.colour}` : '';
    const meta = [g.category, g.label].filter(Boolean).join(', ');
    return `Image ${ordinal} is the reference for the ${meta}${named}${colour}. Use it only for that uniform piece.`;
  });

  return [
    'You are creating a photorealistic studio yacht-crew uniform visualisation.',
    'Image 1 is the model and must remain unchanged except for clothing.',
    'Use the following product reference images only for the specified uniform pieces.',
    ...garmentLines,
    'Preserve exact garment silhouette, colour, collar, seams, buttons, cuffs, hems, pockets, material, embroidery placement, footwear, and hardware.',
    'Dress the model naturally according to the model\'s true pose and body proportions.',
    'Generate natural fabric drape, wrinkles, contact shadows, occlusion, and realistic fitted tailoring.',
    'Maintain the exact face, hair, skin tone, body proportions, pose, camera framing, lighting, and neutral studio background from Image 1.',
    'Do not add logos, badges, pockets, belts, jewellery, accessories, patterns, stripes, or garments that are not present in the supplied references.',
    'Do not show the original base attire beneath the uniform.',
    'Output one clean full-body professional yacht-uniform lookbook image.',
  ].join(' ');
}
