import ArabicReshaper from 'arabic-reshaper';

let _bidi: any | null = null;

function getBidi(): any {
  if (_bidi) return _bidi;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bidiFactory = require('bidi-js');
  const factoryFn = (bidiFactory && (bidiFactory.default || bidiFactory)) as any;
  _bidi = typeof factoryFn === 'function' ? factoryFn() : null;
  return _bidi;
}

/**
 * Process Arabic text for PDF rendering.
 *
 * pdf-lib does not implement complex text shaping for Arabic. We use arabic-reshaper to
 * convert Arabic letters to presentation forms so they render connected.
 *
 * We also apply the Unicode BiDi algorithm to produce a visual-ready string.
 * The stamp drawing code then renders that visual string RTL.
 */
export function processArabicText(text: string): string {
  if (!text) return '';

  try {
    const convert = (ArabicReshaper as any).convertArabic || (ArabicReshaper as any).reshape || ((s: string) => s);
    const cleaned = String(text)
      .normalize('NFC')
      // remove common bidi controls / isolates that can render as odd glyphs
      .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const reshaped = convert(cleaned);

    const bidi = getBidi();
    if (!bidi || typeof bidi.getEmbeddingLevels !== 'function' || typeof bidi.getReorderedString !== 'function') {
      console.warn('processArabicText: bidi-js unavailable; returning reshaped only');
      console.debug('processArabicText:', { input: text, reshaped, output: reshaped });
      return reshaped;
    }

    const embedding = bidi.getEmbeddingLevels(reshaped, 'rtl');

    // Apply mirroring (e.g., parentheses) before reordering.
    let mirroredText = reshaped;
    try {
      if (typeof bidi.getMirroredCharactersMap === 'function') {
        const map: Map<number, string> = bidi.getMirroredCharactersMap(reshaped, embedding);
        if (map && map.size) {
          const arr = Array.from(reshaped);
          for (const [idx, rep] of map.entries()) {
            if (idx >= 0 && idx < arr.length) arr[idx] = rep;
          }
          mirroredText = arr.join('');
        }
      }
    } catch {
      // ignore
    }

    const visual = bidi.getReorderedString(mirroredText, embedding);
    console.debug('processArabicText:', { input: text, reshaped, output: visual });
    return visual;
  } catch (error) {
    console.error('Error processing Arabic text:', error);
    return text;
  }
}

/**
 * Process Arabic text for PDF rendering (shaping only, no BiDi reorder).
 * - Keeps logical order
 * - Applies Arabic shaping so letters are connected
 * Use this when you plan to handle direction manually (e.g., reverse at draw time).
 */
export function processArabicTextShaped(text: string): string {
  if (!text) return ''
  try {
    const convert = (ArabicReshaper as any).convertArabic || (ArabicReshaper as any).reshape || ((s: string) => s)
    const cleaned = String(text)
      .normalize('NFC')
      .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    const reshaped = convert(cleaned)
    console.debug('processArabicTextShaped:', { input: text, reshaped })
    return reshaped
  } catch (error) {
    console.error('Error processing Arabic text (shaped only):', error)
    return text
  }
}

/**
 * Reorder (BiDi visual) THEN shape.
 * - Good when you will draw the text as-is (no reversal) in PDF.
 * - Preserves connections because shaping happens after visual order is established.
 */
export function processArabicTextVisualShaped(text: string): string {
  if (!text) return ''
  try {
    const cleaned = String(text)
      .normalize('NFC')
      .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    const bidi = getBidi()
    let visual = cleaned
    if (bidi && typeof bidi.getEmbeddingLevels === 'function' && typeof bidi.getReorderedString === 'function') {
      const embedding = bidi.getEmbeddingLevels(cleaned, 'rtl')
      let mirrored = cleaned
      try {
        if (typeof bidi.getMirroredCharactersMap === 'function') {
          const map: Map<number, string> = bidi.getMirroredCharactersMap(cleaned, embedding)
          if (map && map.size) {
            const arr = Array.from(cleaned)
            for (const [idx, rep] of map.entries()) {
              if (idx >= 0 && idx < arr.length) arr[idx] = rep
            }
            mirrored = arr.join('')
          }
        }
      } catch {
        // ignore
      }
      visual = bidi.getReorderedString(mirrored, embedding)
    } else {
      visual = Array.from(cleaned).reverse().join('')
    }

    const convert = (ArabicReshaper as any).convertArabic || (ArabicReshaper as any).reshape || ((s: string) => s)
    const shaped = convert(visual)
    console.debug('processArabicTextVisualShaped:', { input: text, visual, shaped })
    return shaped
  } catch (error) {
    console.error('Error processing Arabic text (visual shaped):', error)
    return text
  }
}

/**
 * Process Arabic text for PDF rendering - CORRECT ORDER.
 * 
 * The key insight: we must reorder BEFORE shaping, not after!
 * 1. Apply BiDi reordering to get visual order (on original unshaped text)
 * 2. Then apply Arabic shaping to the visual-order text
 * 
 * This ensures that letter connections are correct in the final output.
 */
export function processArabicTextForPdf(text: string): string {
  if (!text) return ''

  try {
    const cleaned = String(text)
      .normalize('NFC')
      .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    const bidi = getBidi()
    
    // Step 1: Apply BiDi reordering to ORIGINAL (unshaped) text
    let visualOrder = cleaned
    if (bidi && typeof bidi.getEmbeddingLevels === 'function' && typeof bidi.getReorderedString === 'function') {
      const embedding = bidi.getEmbeddingLevels(cleaned, 'rtl')
      
      // Apply mirroring before reordering
      let mirroredText = cleaned
      try {
        if (typeof bidi.getMirroredCharactersMap === 'function') {
          const map: Map<number, string> = bidi.getMirroredCharactersMap(cleaned, embedding)
          if (map && map.size) {
            const arr = Array.from(cleaned)
            for (const [idx, rep] of map.entries()) {
              if (idx >= 0 && idx < arr.length) arr[idx] = rep
            }
            mirroredText = arr.join('')
          }
        }
      } catch {
        // ignore
      }
      
      visualOrder = bidi.getReorderedString(mirroredText, embedding)
    } else {
      // Fallback: simple reverse for RTL
      visualOrder = Array.from(cleaned).reverse().join('')
    }

    // Step 2: Apply Arabic shaping to the visual-order text
    const convert = (ArabicReshaper as any).convertArabic || (ArabicReshaper as any).reshape || ((s: string) => s)
    const shaped = convert(visualOrder)

    console.debug('processArabicTextForPdf:', { input: text, visualOrder, shaped })
    return shaped
  } catch (error) {
    console.error('Error processing Arabic text for PDF:', error)
    return text
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
