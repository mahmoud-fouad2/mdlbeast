import ArabicReshaper from 'arabic-reshaper';

/**
 * Process Arabic text for PDF rendering.
 *
 * pdf-lib does not implement complex text shaping for Arabic. We use arabic-reshaper to
 * convert Arabic letters to presentation forms so they render connected.
 *
 * IMPORTANT: Do not reorder or reverse here. RTL layout is handled at draw-time.
 */
export function processArabicText(text: string): string {
  if (!text) return '';

  try {
    const convert = (ArabicReshaper as any).convertArabic || (ArabicReshaper as any).reshape || ((s: string) => s);
    const reshaped = convert(String(text).normalize('NFC'));
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
