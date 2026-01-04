import ArabicReshaper from 'arabic-reshaper';

/**
 * Process Arabic text for PDF rendering.
 *
 * We reshape Arabic letters into presentation forms so they render connected.
 *
 * Note: In practice, applying manual BiDi reordering here caused reversed/jumbled output
 * in PDF rendering. So we only reshape and leave direction handling to the PDF renderer.
 */
export function processArabicText(text: string): string {
  if (!text) return '';

  try {
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
