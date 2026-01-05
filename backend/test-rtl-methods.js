const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const ArabicReshaper = require('arabic-reshaper');

// Test strings
const companyName = 'زوايا البناء للإستشارات الهندسيه';
const attachmentText = 'نوعية المرفقات: ٢ اسطوانه';

// Shape the text (this works - from Method 4)
function shapeText(text) {
  const cleaned = text.normalize('NFC').trim();
  return ArabicReshaper.convertArabic(cleaned);
}

async function testRTLDrawing(methodName, drawFunc) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TESTING: ${methodName}`);
  console.log('='.repeat(80));
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  const fontPath = path.join(__dirname, 'assets', 'fonts', 'NotoSansArabic-Bold.ttf');
  const fontBytes = fs.readFileSync(fontPath);
  const arabicFont = await pdfDoc.embedFont(fontBytes);
  
  const page = pdfDoc.addPage([600, 400]);
  const fontSize = 16;
  
  // Shape the texts
  const shapedCompany = shapeText(companyName);
  const shapedAttachment = shapeText(attachmentText);
  
  console.log('Original company:', companyName);
  console.log('Shaped company:', shapedCompany);
  console.log('Original attachment:', attachmentText);
  console.log('Shaped attachment:', shapedAttachment);
  
  // Draw using the test function
  drawFunc(page, shapedCompany, shapedAttachment, arabicFont, fontSize);
  
  // Add method label
  page.drawText(`Method: ${methodName}`, {
    x: 50,
    y: 350,
    size: 12,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, `rtl-test-${methodName.replace(/[^a-z0-9]/gi, '-')}.pdf`);
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✓ Saved to: ${outputPath}`);
}

// Method A: Shape + Reverse + Draw LTR from left
function methodA(page, shapedCompany, shapedAttachment, font, size) {
  const reversedCompany = Array.from(shapedCompany).reverse().join('');
  const reversedAttachment = Array.from(shapedAttachment).reverse().join('');
  
  page.drawText(reversedCompany, { x: 50, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(reversedAttachment, { x: 50, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method B: Shape + Draw LTR from left (same as Method 4 - baseline)
function methodB(page, shapedCompany, shapedAttachment, font, size) {
  page.drawText(shapedCompany, { x: 50, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(shapedAttachment, { x: 50, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method C: Shape + Calculate width + Draw from RIGHT edge
function methodC(page, shapedCompany, shapedAttachment, font, size) {
  const companyWidth = font.widthOfTextAtSize(shapedCompany, size);
  const attachmentWidth = font.widthOfTextAtSize(shapedAttachment, size);
  
  const rightEdge = 550; // Right side of page
  
  page.drawText(shapedCompany, { 
    x: rightEdge - companyWidth, 
    y: 300, 
    size, 
    font, 
    color: rgb(0, 0, 0) 
  });
  page.drawText(shapedAttachment, { 
    x: rightEdge - attachmentWidth, 
    y: 250, 
    size, 
    font, 
    color: rgb(0, 0, 0) 
  });
}

// Method D: Shape + Reverse + Draw from RIGHT edge
function methodD(page, shapedCompany, shapedAttachment, font, size) {
  const reversedCompany = Array.from(shapedCompany).reverse().join('');
  const reversedAttachment = Array.from(shapedAttachment).reverse().join('');
  
  const companyWidth = font.widthOfTextAtSize(reversedCompany, size);
  const attachmentWidth = font.widthOfTextAtSize(reversedAttachment, size);
  
  const rightEdge = 550;
  
  page.drawText(reversedCompany, { 
    x: rightEdge - companyWidth, 
    y: 300, 
    size, 
    font, 
    color: rgb(0, 0, 0) 
  });
  page.drawText(reversedAttachment, { 
    x: rightEdge - attachmentWidth, 
    y: 250, 
    size, 
    font, 
    color: rgb(0, 0, 0) 
  });
}

// Method E: Character-by-character reverse (grapheme aware)
function methodE(page, shapedCompany, shapedAttachment, font, size) {
  // Split into grapheme clusters to avoid breaking combining marks
  function splitGraphemes(str) {
    const segmenter = new Intl.Segmenter('ar', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(str), s => s.segment);
  }
  
  const companyGraphemes = splitGraphemes(shapedCompany);
  const attachmentGraphemes = splitGraphemes(shapedAttachment);
  
  const reversedCompany = companyGraphemes.reverse().join('');
  const reversedAttachment = attachmentGraphemes.reverse().join('');
  
  const companyWidth = font.widthOfTextAtSize(reversedCompany, size);
  const attachmentWidth = font.widthOfTextAtSize(reversedAttachment, size);
  
  const rightEdge = 550;
  
  page.drawText(reversedCompany, { 
    x: rightEdge - companyWidth, 
    y: 300, 
    size, 
    font, 
    color: rgb(0, 0, 0) 
  });
  page.drawText(reversedAttachment, { 
    x: rightEdge - attachmentWidth, 
    y: 250, 
    size, 
    font, 
    color: rgb(0, 0, 0) 
  });
}

// Method F: Word-by-word reverse (preserve word order, reverse characters within words)
function methodF(page, shapedCompany, shapedAttachment, font, size) {
  function reverseWords(str) {
    return str.split(' ').map(word => Array.from(word).reverse().join('')).join(' ');
  }
  
  const reversedCompany = reverseWords(shapedCompany);
  const reversedAttachment = reverseWords(shapedAttachment);
  
  const companyWidth = font.widthOfTextAtSize(reversedCompany, size);
  const attachmentWidth = font.widthOfTextAtSize(reversedAttachment, size);
  
  const rightEdge = 550;
  
  page.drawText(reversedCompany, { 
    x: rightEdge - companyWidth, 
    y: 300, 
    size, 
    font, 
    color: rgb(0, 0, 0) 
  });
  page.drawText(reversedAttachment, { 
    x: rightEdge - attachmentWidth, 
    y: 250, 
    size, 
    font, 
    color: rgb(0, 0, 0) 
  });
}

(async () => {
  console.log('Testing RTL drawing methods with shaped text...\n');
  
  await testRTLDrawing('A-Shape-Reverse-DrawLeft', methodA);
  await testRTLDrawing('B-Shape-DrawLeft-Baseline', methodB);
  await testRTLDrawing('C-Shape-DrawRight', methodC);
  await testRTLDrawing('D-Shape-Reverse-DrawRight', methodD);
  await testRTLDrawing('E-Shape-GraphemeReverse-DrawRight', methodE);
  await testRTLDrawing('F-Shape-WordReverse-DrawRight', methodF);
  
  console.log('\n' + '='.repeat(80));
  console.log('✓ All RTL test PDFs generated!');
  console.log('Check which one displays correctly and tell me the letter (A-F).');
  console.log('='.repeat(80));
})();
