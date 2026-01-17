// Deep analysis: Why are letters disconnected?
// The problem might be that pdf-lib doesn't apply OpenType features

const { PDFDocument, PDFName, PDFDict, PDFArray, PDFHexString, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const ArabicReshaper = require('arabic-reshaper');

async function testWithFontFeatures() {
  console.log('='.repeat(80));
  console.log('TESTING: Enabling OpenType Features');
  console.log('='.repeat(80));
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  const fontPath = path.join(__dirname, 'assets', 'fonts', 'NotoSansArabic-Bold.ttf');
  const fontBytes = fs.readFileSync(fontPath);
  const arabicFont = await pdfDoc.embedFont(fontBytes);
  
  const page = pdfDoc.addPage([600, 400]);
  
  // Test different text strings
  const tests = [
    { text: 'زوايا', y: 350 },
    { text: 'البناء', y: 320 },
    { text: 'للإستشارات', y: 290 },
    { text: 'الهندسيه', y: 260 }
  ];
  
  for (const test of tests) {
    const shaped = ArabicReshaper.convertArabic(test.text);
    const reversed = shaped.split('').reverse().join('');
    
    console.log(`\nText: ${test.text}`);
    console.log(`Shaped: ${shaped}`);
    console.log(`Reversed: ${reversed}`);
    console.log(`Hex: ${Array.from(reversed).map(c => '0x' + c.charCodeAt(0).toString(16)).join(' ')}`);
    
    const width = arabicFont.widthOfTextAtSize(reversed, 16);
    page.drawText(reversed, {
      x: 550 - width,
      y: test.y,
      size: 16,
      font: arabicFont,
      color: rgb(0, 0, 0)
    });
  }
  
  // Try to access and modify the font dictionary to enable features
  try {
    const fontRef = arabicFont.ref;
    const fontDict = pdfDoc.context.lookup(fontRef);
    
    console.log('\n\nFont Dictionary Keys:', fontDict.entries().map(([k, v]) => k.toString()));
    
    // Try to add OpenType features
    // This is experimental and might not work
  } catch (e) {
    console.log('Error accessing font dict:', e.message);
  }
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(__dirname, 'test-font-features.pdf'), pdfBytes);
  console.log('\n✓ Saved to: test-font-features.pdf');
}

async function testRawGlyphs() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING: Check actual glyphs in font');
  console.log('='.repeat(80));
  
  const fontPath = path.join(__dirname, 'assets', 'fonts', 'NotoSansArabic-Bold.ttf');
  const fontBytes = fs.readFileSync(fontPath);
  
  // Use fontkit directly to inspect
  const fontkit = require('fontkit');
  const font = fontkit.create(fontBytes);
  
  console.log('\nFont info:');
  console.log('  Family:', font.familyName);
  console.log('  Has OpenType:', !!font.GSUB);
  console.log('  Has GSUB table:', !!font.GSUB);
  
  // Try to get features
  try {
    if (font.GSUB && font.GSUB.features) {
      console.log('  Features:', Object.keys(font.GSUB.features));
    } else if (font._layoutEngine && font._layoutEngine.engine) {
      console.log('  Layout engine exists');
    }
  } catch (e) {
    console.log('  Features: Unable to read');
  }
  
  // Test getting glyphs
  const testChars = ['ز', 'و', 'ا', 'ي', 'ا'];
  const testPresentation = ['\uFEAF', '\uFEED', '\uFE8D', '\uFEF3', '\uFE8E'];
  
  console.log('\nGlyph IDs for original characters:');
  for (const char of testChars) {
    const glyph = font.glyphForCodePoint(char.charCodeAt(0));
    console.log(`  ${char} (0x${char.charCodeAt(0).toString(16)}): glyph ID ${glyph.id}, name: ${glyph.name || 'unnamed'}`);
  }
  
  console.log('\nGlyph IDs for presentation forms:');
  for (const char of testPresentation) {
    const glyph = font.glyphForCodePoint(char.charCodeAt(0));
    console.log(`  ${char} (0x${char.charCodeAt(0).toString(16)}): glyph ID ${glyph.id}, name: ${glyph.name || 'unnamed'}`);
  }
  
  // Check if these glyphs have width
  console.log('\nGlyph widths (presentation forms):');
  for (const char of testPresentation) {
    const glyph = font.glyphForCodePoint(char.charCodeAt(0));
    console.log(`  ${char}: width = ${glyph.advanceWidth}, bbox = [${glyph.bbox.minX}, ${glyph.bbox.minY}, ${glyph.bbox.maxX}, ${glyph.bbox.maxY}]`);
  }
}

async function testAlternativeLibrary() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING: Alternative approach - Generate image');
  console.log('='.repeat(80));
  
  // The nuclear option: use node-canvas to render text as image
  // then embed the image in PDF
  
  try {
    const { createCanvas } = require('canvas');
    
    const canvas = createCanvas(500, 100);
    const ctx = canvas.getContext('2d');
    
    // Set font - canvas should handle Arabic properly
    ctx.font = 'bold 24px "Noto Sans Arabic"';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';
    
    const text = 'MDLBEAST Communications';
    ctx.fillText(text, 480, 50);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'text-as-image.png'), buffer);
    console.log('✓ Saved text as image: text-as-image.png');
    
    // Now embed this image in PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    
    const pngImage = await pdfDoc.embedPng(buffer);
    page.drawImage(pngImage, {
      x: 50,
      y: 250,
      width: 500,
      height: 100
    });
    
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(path.join(__dirname, 'test-image-approach.pdf'), pdfBytes);
    console.log('✓ Saved PDF with embedded image: test-image-approach.pdf');
    console.log('\nThis approach should show PERFECT Arabic text!');
    
  } catch (e) {
    console.log('❌ canvas library not available. Install with: npm install canvas');
    console.log('   (This would be the solution if needed)');
  }
}

(async () => {
  await testWithFontFeatures();
  await testRawGlyphs();
  await testAlternativeLibrary();
  
  console.log('\n' + '='.repeat(80));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));
})();
