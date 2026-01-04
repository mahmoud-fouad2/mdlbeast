import ArabicReshaper from 'arabic-reshaper';

/**
 * Process Arabic text for PDF rendering.
 * 
 * pdf-lib automatically handles BiDi text reordering, so we only need to:
 * 1. Reshape Arabic letters (connect isolated forms into proper glyphs)
 * 2. Return the reshaped text WITHOUT reordering
 * 
 * pdf-lib will handle the RTL display correctly.
 * 
 * IMPORTANT: Do NOT use bidi-js or any reordering here - pdf-lib does it automatically!
 * Previous versions caused double-reversal by reordering before pdf-lib's internal handling.
 */
export function processArabicText(text: string): string {
  if (!text) return '';

  try {
    // Only reshape Arabic letters - DO NOT reorder!
    // pdf-lib handles BiDi text direction automatically
    const convert = (ArabicReshaper as any).convertArabic || (ArabicReshaper as any).reshape || ((s: string) => s);
    const reshaped = convert(String(text));
    console.debug('processArabicText:', { input: text, output: reshaped });
    return reshaped;
  } catch (error) {
    console.error('Error processing Arabic text:', error);
    return text;
  }
}

// Export function to get glyph positions (kept for potential future use)
export function getGlyphPositions(text: string, font: any, fontSize: number, baseX: number, baseY: number): Array<{char: string, x: number, y: number}> {
  const processed = processArabicText(text);
  const positions: Array<{char: string, x: number, y: number}> = [];
  let currentX = baseX;
  
  for (let i = 0; i < processed.length; i++) {
    const char = processed[i];
    positions.push({ char, x: currentX, y: baseY });
    
    try {
      const charWidth = font.widthOfTextAtSize(char, fontSize);
      currentX += charWidth;
    } catch (e) {
      currentX += fontSize * 0.5;
    }
  }
  
  return positions;
}
