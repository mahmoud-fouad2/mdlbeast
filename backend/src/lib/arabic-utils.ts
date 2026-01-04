import ArabicReshaper from 'arabic-reshaper';

/**
 * Process Arabic text for PDF rendering.
 * 
 * pdf-lib automatically handles BiDi text reordering, so we only need to:
 * 1. Reshape Arabic letters (connect isolated forms into proper glyphs)
 * 2. Return the reshaped text WITHOUT reordering
 * 
 * pdf-lib will handle the RTL display correctly.
 */
export function processArabicText(text: string): string {
  if (!text) return '';

  try {
    // Only reshape - DO NOT reorder!
    // pdf-lib handles BiDi automatically, so reordering here causes double-reversal
    const convert = (ArabicReshaper as any).convertArabic || (ArabicReshaper as any).reshape || ((s: string) => s);
    return convert(String(text));
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
