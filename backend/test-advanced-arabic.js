const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const ArabicReshaper = require('arabic-reshaper');

const companyName = 'زوايا البناء للإستشارات الهندسيه';
const attachmentText = 'نوعية المرفقات: ٢ اسطوانه';

async function testAdvancedMethod(methodName, processFunc) {
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
  
  // Process and draw
  processFunc(page, arabicFont, fontSize);
  
  // Add method label
  page.drawText(`Method: ${methodName}`, {
    x: 50,
    y: 350,
    size: 12,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, `advanced-${methodName.replace(/[^a-z0-9]/gi, '-')}.pdf`);
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✓ Saved to: ${outputPath}`);
}

// Method 1: Original text, let pdf-lib handle everything
function method1(page, font, size) {
  console.log('Drawing original text without any processing');
  page.drawText(companyName, { x: 400, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(attachmentText, { x: 400, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method 2: Character-by-character drawing (right to left)
function method2(page, font, size) {
  console.log('Drawing character-by-character RTL');
  const shaped = ArabicReshaper.convertArabic(companyName);
  let x = 550;
  for (const char of Array.from(shaped)) {
    const charWidth = font.widthOfTextAtSize(char, size);
    x -= charWidth;
    page.drawText(char, { x, y: 300, size, font, color: rgb(0, 0, 0) });
  }
  
  const shaped2 = ArabicReshaper.convertArabic(attachmentText);
  x = 550;
  for (const char of Array.from(shaped2)) {
    const charWidth = font.widthOfTextAtSize(char, size);
    x -= charWidth;
    page.drawText(char, { x, y: 250, size, font, color: rgb(0, 0, 0) });
  }
}

// Method 3: Use ZWJ (Zero Width Joiner) to force connections
function method3(page, font, size) {
  console.log('Using ZWJ to force connections');
  const ZWJ = '\u200D';
  
  // Insert ZWJ between Arabic characters
  function addZWJ(text) {
    const shaped = ArabicReshaper.convertArabic(text);
    return Array.from(shaped).join(ZWJ);
  }
  
  const processedCompany = addZWJ(companyName);
  const processedAttachment = addZWJ(attachmentText);
  
  const w1 = font.widthOfTextAtSize(processedCompany, size);
  const w2 = font.widthOfTextAtSize(processedAttachment, size);
  
  page.drawText(processedCompany, { x: 550 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(processedAttachment, { x: 550 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method 4: Try Regular font instead of Bold
async function method4(page, _, size) {
  console.log('Using Regular font instead of Bold');
  const regularFontPath = path.join(__dirname, 'assets', 'fonts', 'NotoSansArabic-Regular.ttf');
  const regularFontBytes = fs.readFileSync(regularFontPath);
  const pdfDoc = page.doc;
  const regularFont = await pdfDoc.embedFont(regularFontBytes);
  
  const shaped1 = ArabicReshaper.convertArabic(companyName);
  const shaped2 = ArabicReshaper.convertArabic(attachmentText);
  
  const reversed1 = Array.from(shaped1).reverse().join('');
  const reversed2 = Array.from(shaped2).reverse().join('');
  
  const w1 = regularFont.widthOfTextAtSize(reversed1, size);
  const w2 = regularFont.widthOfTextAtSize(reversed2, size);
  
  page.drawText(reversed1, { x: 550 - w1, y: 300, size, font: regularFont, color: rgb(0, 0, 0) });
  page.drawText(reversed2, { x: 550 - w2, y: 250, size, font: regularFont, color: rgb(0, 0, 0) });
}

// Method 5: Word by word with spaces preserved
function method5(page, font, size) {
  console.log('Drawing word by word');
  
  function processAndDrawRTL(text, y) {
    const shaped = ArabicReshaper.convertArabic(text);
    const reversed = Array.from(shaped).reverse().join('');
    const width = font.widthOfTextAtSize(reversed, size);
    page.drawText(reversed, { x: 550 - width, y, size, font, color: rgb(0, 0, 0) });
  }
  
  processAndDrawRTL(companyName, 300);
  processAndDrawRTL(attachmentText, 250);
}

// Method 6: Original + Reverse only (no shape)
function method6(page, font, size) {
  console.log('Reverse original without shaping');
  const reversed1 = Array.from(companyName).reverse().join('');
  const reversed2 = Array.from(attachmentText).reverse().join('');
  
  const w1 = font.widthOfTextAtSize(reversed1, size);
  const w2 = font.widthOfTextAtSize(reversed2, size);
  
  page.drawText(reversed1, { x: 550 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(reversed2, { x: 550 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method 7: Shape + No reverse + Draw RTL aligned
function method7(page, font, size) {
  console.log('Shape without reverse, RTL aligned');
  const shaped1 = ArabicReshaper.convertArabic(companyName);
  const shaped2 = ArabicReshaper.convertArabic(attachmentText);
  
  const w1 = font.widthOfTextAtSize(shaped1, size);
  const w2 = font.widthOfTextAtSize(shaped2, size);
  
  page.drawText(shaped1, { x: 550 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(shaped2, { x: 550 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method 8: Manual presentation forms
function method8(page, font, size) {
  console.log('Testing manual presentation forms mapping');
  
  // Simple test: just the word "زوايا"
  const testWord = 'زوايا';
  const shaped = ArabicReshaper.convertArabic(testWord);
  
  console.log('Original:', testWord);
  console.log('Shaped:', shaped);
  console.log('Shaped hex:', Array.from(shaped).map(c => c.charCodeAt(0).toString(16)).join(' '));
  
  // Draw shaped
  const w1 = font.widthOfTextAtSize(shaped, size);
  page.drawText(shaped, { x: 300 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  
  // Draw reversed shaped
  const reversed = Array.from(shaped).reverse().join('');
  const w2 = font.widthOfTextAtSize(reversed, size);
  page.drawText(reversed, { x: 300 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

(async () => {
  console.log('Testing advanced Arabic rendering methods...\n');
  
  await testAdvancedMethod('1-Original-NoPr ocessing', method1);
  await testAdvancedMethod('2-CharByChar-RTL', method2);
  await testAdvancedMethod('3-ZWJ-Forced', method3);
  await testAdvancedMethod('4-RegularFont', method4);
  await testAdvancedMethod('5-WordByWord', method5);
  await testAdvancedMethod('6-ReverseNoShape', method6);
  await testAdvancedMethod('7-ShapeNoReverse', method7);
  await testAdvancedMethod('8-ManualTest', method8);
  
  console.log('\n' + '='.repeat(80));
  console.log('✓ All advanced test PDFs generated!');
  console.log('Check each one carefully and tell me which number works.');
  console.log('='.repeat(80));
})();
