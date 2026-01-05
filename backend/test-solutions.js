const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const ArabicReshaper = require('arabic-reshaper');

const companyName = 'زوايا البناء للإستشارات الهندسيه';
const attachmentText = 'نوعية المرفقات: ٢ اسطوانه';

async function testMethod(methodName, processFunc) {
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
  
  await processFunc(page, arabicFont, fontSize, pdfDoc);
  
  page.drawText(`Method: ${methodName}`, {
    x: 50,
    y: 350,
    size: 12,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, `solution-${methodName.replace(/[^a-z0-9]/gi, '-')}.pdf`);
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✓ Saved to: ${outputPath}`);
}

// Method A: Shape + ZWJ between ALL characters
function methodA(page, font, size) {
  const ZWJ = '\u200D';
  const shaped1 = ArabicReshaper.convertArabic(companyName);
  const shaped2 = ArabicReshaper.convertArabic(attachmentText);
  
  const withZWJ1 = Array.from(shaped1).join(ZWJ);
  const withZWJ2 = Array.from(shaped2).join(ZWJ);
  
  const reversed1 = Array.from(withZWJ1).reverse().join('');
  const reversed2 = Array.from(withZWJ2).reverse().join('');
  
  const w1 = font.widthOfTextAtSize(reversed1, size);
  const w2 = font.widthOfTextAtSize(reversed2, size);
  
  console.log('Company with ZWJ:', withZWJ1);
  console.log('Reversed:', reversed1);
  
  page.drawText(reversed1, { x: 550 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(reversed2, { x: 550 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method B: Shape + ZWNJ (Zero Width Non-Joiner) - force isolation then join
function methodB(page, font, size) {
  const ZWNJ = '\u200C';
  const shaped1 = ArabicReshaper.convertArabic(companyName);
  const shaped2 = ArabicReshaper.convertArabic(attachmentText);
  
  // Remove any ZWNJ that might exist
  const clean1 = shaped1.replace(/\u200C/g, '');
  const clean2 = shaped2.replace(/\u200C/g, '');
  
  const reversed1 = Array.from(clean1).reverse().join('');
  const reversed2 = Array.from(clean2).reverse().join('');
  
  const w1 = font.widthOfTextAtSize(reversed1, size);
  const w2 = font.widthOfTextAtSize(reversed2, size);
  
  page.drawText(reversed1, { x: 550 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(reversed2, { x: 550 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method C: NO shaping at all + Reverse + Let font handle shaping
function methodC(page, font, size) {
  const reversed1 = Array.from(companyName).reverse().join('');
  const reversed2 = Array.from(attachmentText).reverse().join('');
  
  const w1 = font.widthOfTextAtSize(reversed1, size);
  const w2 = font.widthOfTextAtSize(reversed2, size);
  
  console.log('Original:', companyName);
  console.log('Reversed (no shape):', reversed1);
  
  page.drawText(reversed1, { x: 550 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(reversed2, { x: 550 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method D: Use Tatweel (ـ) between characters
function methodD(page, font, size) {
  const TATWEEL = '\u0640';
  const shaped1 = ArabicReshaper.convertArabic(companyName);
  const shaped2 = ArabicReshaper.convertArabic(attachmentText);
  
  // Add tatweel between Arabic letters only
  function addTatweel(text) {
    const chars = Array.from(text);
    const result = [];
    for (let i = 0; i < chars.length; i++) {
      result.push(chars[i]);
      // Add tatweel if next char is also Arabic
      if (i < chars.length - 1 && chars[i] !== ' ' && chars[i+1] !== ' ') {
        const code = chars[i].charCodeAt(0);
        const nextCode = chars[i+1].charCodeAt(0);
        if (code >= 0xFE70 && code <= 0xFEFF && nextCode >= 0xFE70 && nextCode <= 0xFEFF) {
          result.push(TATWEEL);
        }
      }
    }
    return result.join('');
  }
  
  const withTatweel1 = addTatweel(shaped1);
  const withTatweel2 = addTatweel(shaped2);
  
  const reversed1 = Array.from(withTatweel1).reverse().join('');
  const reversed2 = Array.from(withTatweel2).reverse().join('');
  
  const w1 = font.widthOfTextAtSize(reversed1, size);
  const w2 = font.widthOfTextAtSize(reversed2, size);
  
  page.drawText(reversed1, { x: 550 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(reversed2, { x: 550 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method E: Draw as single string (no character splitting)
function methodE(page, font, size) {
  const shaped1 = ArabicReshaper.convertArabic(companyName);
  const shaped2 = ArabicReshaper.convertArabic(attachmentText);
  
  // Simple full-string reverse
  const reversed1 = shaped1.split('').reverse().join('');
  const reversed2 = shaped2.split('').reverse().join('');
  
  const w1 = font.widthOfTextAtSize(reversed1, size);
  const w2 = font.widthOfTextAtSize(reversed2, size);
  
  console.log('Shaped:', shaped1);
  console.log('Reversed full:', reversed1);
  console.log('Hex:', Array.from(reversed1).map(c => c.charCodeAt(0).toString(16)).join(' '));
  
  page.drawText(reversed1, { x: 550 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(reversed2, { x: 550 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method F: Try different font - Regular instead of Bold
async function methodF(page, _, size, pdfDoc) {
  const regularPath = path.join(__dirname, 'assets', 'fonts', 'NotoSansArabic-Regular.ttf');
  const regularBytes = fs.readFileSync(regularPath);
  const regularFont = await pdfDoc.embedFont(regularBytes);
  
  const shaped1 = ArabicReshaper.convertArabic(companyName);
  const shaped2 = ArabicReshaper.convertArabic(attachmentText);
  
  const reversed1 = Array.from(shaped1).reverse().join('');
  const reversed2 = Array.from(shaped2).reverse().join('');
  
  const w1 = regularFont.widthOfTextAtSize(reversed1, size);
  const w2 = regularFont.widthOfTextAtSize(reversed2, size);
  
  page.drawText(reversed1, { x: 550 - w1, y: 300, size, font: regularFont, color: rgb(0, 0, 0) });
  page.drawText(reversed2, { x: 550 - w2, y: 250, size, font: regularFont, color: rgb(0, 0, 0) });
}

// Method G: Shape + Keep spaces + Reverse only non-space runs
function methodG(page, font, size) {
  function reverseKeepingSpaces(text) {
    const shaped = ArabicReshaper.convertArabic(text);
    // Split by spaces, reverse each word, then reverse word order
    const words = shaped.split(' ');
    const reversedWords = words.map(word => Array.from(word).reverse().join(''));
    return reversedWords.reverse().join(' ');
  }
  
  const processed1 = reverseKeepingSpaces(companyName);
  const processed2 = reverseKeepingSpaces(attachmentText);
  
  console.log('Company reversed with spaces:', processed1);
  
  const w1 = font.widthOfTextAtSize(processed1, size);
  const w2 = font.widthOfTextAtSize(processed2, size);
  
  page.drawText(processed1, { x: 550 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(processed2, { x: 550 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

// Method H: Original text + ZWJ + No shaping + Reverse
function methodH(page, font, size) {
  const ZWJ = '\u200D';
  
  // Add ZWJ between original characters
  const withZWJ1 = Array.from(companyName).join(ZWJ);
  const withZWJ2 = Array.from(attachmentText).join(ZWJ);
  
  const reversed1 = Array.from(withZWJ1).reverse().join('');
  const reversed2 = Array.from(withZWJ2).reverse().join('');
  
  const w1 = font.widthOfTextAtSize(reversed1, size);
  const w2 = font.widthOfTextAtSize(reversed2, size);
  
  console.log('Original + ZWJ:', withZWJ1);
  console.log('Reversed:', reversed1);
  
  page.drawText(reversed1, { x: 550 - w1, y: 300, size, font, color: rgb(0, 0, 0) });
  page.drawText(reversed2, { x: 550 - w2, y: 250, size, font, color: rgb(0, 0, 0) });
}

(async () => {
  console.log('Testing solution methods based on ZWJ success...\n');
  
  await testMethod('A-Shaped-ZWJ-Reversed', methodA);
  await testMethod('B-Shaped-Clean-Reversed', methodB);
  await testMethod('C-NoShape-Reversed', methodC);
  await testMethod('D-Shaped-Tatweel-Reversed', methodD);
  await testMethod('E-Shaped-FullReverse', methodE);
  await testMethod('F-RegularFont-Shaped', methodF);
  await testMethod('G-Shaped-WordReverse', methodG);
  await testMethod('H-Original-ZWJ-Reversed', methodH);
  
  console.log('\n' + '='.repeat(80));
  console.log('✓ All solution PDFs generated!');
  console.log('Check each carefully - one should have connected letters!');
  console.log('='.repeat(80));
})();
