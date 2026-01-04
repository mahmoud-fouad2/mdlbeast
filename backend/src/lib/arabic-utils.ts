/**
 * Process Arabic text for PDF rendering.
 *
 * NotoSansArabic relies on OpenType shaping (GSUB/GPOS) to connect letters.
 * Converting to Arabic Presentation Forms (via arabic-reshaper) can *break* that and
 * lead to visible gaps between letters.
 *
 * So we keep the original Arabic text and only add lightweight direction marks
 * to stabilize punctuation (e.g. ':') in RTL context.
 */
export function processArabicText(text: string): string {
  if (!text) return '';

  try {
    const s = String(text).normalize('NFC');
    const hasArabic = /[\u0600-\u06FF]/.test(s);
    if (!hasArabic) return s;

    // ALM (Arabic Letter Mark) helps keep neutral punctuation in the right place.
    const ALM = '\u061C';
    const stabilized = `${ALM}${s.replace(/:/g, `${ALM}:${ALM}`)}${ALM}`;

    console.debug('processArabicText:', { input: text, output: stabilized });
    return stabilized;
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
