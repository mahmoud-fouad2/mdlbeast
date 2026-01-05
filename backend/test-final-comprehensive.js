const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const ArabicReshaper = require('arabic-reshaper');
const bidiFactory = require('bidi-js');

const bidi = bidiFactory();

const companyName = 'زوايا البناء للإستشارات الهندسيه';
const attachmentText = 'نوعية المرفقات: ٢ اسطوانه';

// Simple test: just the word "زوايا"
const simpleTest = 'زوايا';

async function testFinal(methodName, processFunc, description) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FINAL TEST: ${methodName}`);
  console.log(`Description: ${description}`);
  console.log('='.repeat(80));
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  const fontPath = path.join(__dirname, 'assets', 'fonts', 'NotoSansArabic-Bold.ttf');
  const fontBytes = fs.readFileSync(fontPath);
  const arabicFont = await pdfDoc.embedFont(fontBytes);
  
  const page = pdfDoc.addPage([600, 400]);
  const fontSize = 20; // Larger size to see better
  
  const result = processFunc(simpleTest);
  
  console.log('Input:', simpleTest);
  console.log('Output:', result);
  console.log('Hex:', Array.from(result).map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' '));
  
  // Draw simple test
  const w = arabicFont.widthOfTextAtSize(result, fontSize);
  page.drawText(result, { 
    x: 500 - w, 
    y: 300, 
    size: fontSize, 
    font: arabicFont, 
    color: rgb(0, 0, 0) 
  });
  
  // Draw full texts
  const company = processFunc(companyName);
  const attachment = processFunc(attachmentText);
  
  const w1 = arabicFont.widthOfTextAtSize(company, 16);
  const w2 = arabicFont.widthOfTextAtSize(attachment, 16);
  
  page.drawText(company, { x: 550 - w1, y: 250, size: 16, font: arabicFont, color: rgb(0, 0, 0) });
  page.drawText(attachment, { x: 550 - w2, y: 220, size: 16, font: arabicFont, color: rgb(0, 0, 0) });
  
  // Label
  page.drawText(methodName, { x: 50, y: 350, size: 12, color: rgb(0.5, 0.5, 0.5) });
  page.drawText(description, { x: 50, y: 330, size: 10, color: rgb(0.5, 0.5, 0.5) });
  
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, `final-${methodName.replace(/[^a-z0-9]/gi, '-')}.pdf`);
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✓ Saved to: ${outputPath}\n`);
}

// Test 1: Shape only, no reverse
function test1(text) {
  return ArabicReshaper.convertArabic(text.normalize('NFC'));
}

// Test 2: Shape + full reverse
function test2(text) {
  const shaped = ArabicReshaper.convertArabic(text.normalize('NFC'));
  return shaped.split('').reverse().join('');
}

// Test 3: BiDi first, then shape
function test3(text) {
  const cleaned = text.normalize('NFC');
  const embedding = bidi.getEmbeddingLevels(cleaned, 'rtl');
  const visual = bidi.getReorderedString(cleaned, embedding);
  return ArabicReshaper.convertArabic(visual);
}

// Test 4: Shape then BiDi
function test4(text) {
  const shaped = ArabicReshaper.convertArabic(text.normalize('NFC'));
  const embedding = bidi.getEmbeddingLevels(shaped, 'rtl');
  return bidi.getReorderedString(shaped, embedding);
}

// Test 5: Manual presentation forms for "زوايا"
function test5(text) {
  if (text === 'زوايا') {
    // Manually specify: ز(initial) و(medial) ا(medial) ي(medial) ا(final)
    // In reverse for PDF: ا(final) ي(medial) ا(medial) و(medial) ز(initial)
    return '\uFE8E\uFEF4\uFE8E\uFEED\uFEAF';
  }
  return ArabicReshaper.convertArabic(text);
}

// Test 6: Original, no processing (let font do everything)
function test6(text) {
  return text.normalize('NFC');
}

// Test 7: Just reverse original
function test7(text) {
  return text.normalize('NFC').split('').reverse().join('');
}

// Test 8: Manual correct forms then reverse
function test8(text) {
  if (text === 'زوايا') {
    // Correct forms in logical order: ز(initial) و(medial) ا(medial) ي(medial) ا(final)
    const logical = '\uFEAF\uFEED\uFE8E\uFEF4\uFE8E';
    // Now reverse for RTL display
    return logical.split('').reverse().join('');
  }
  const shaped = ArabicReshaper.convertArabic(text.normalize('NFC'));
  return shaped.split('').reverse().join('');
}

// Test 9: Manual WRONG forms (isolated) to see difference
function test9(text) {
  if (text === 'زوايا') {
    // All isolated forms
    return '\u0632\u0648\u0627\u064A\u0627';
  }
  return text;
}

// Test 10: Shaped + word-level reverse
function test10(text) {
  const shaped = ArabicReshaper.convertArabic(text.normalize('NFC'));
  const words = shaped.split(' ');
  const reversedWords = words.map(w => w.split('').reverse().join(''));
  return reversedWords.reverse().join(' ');
}

(async () => {
  console.log('FINAL COMPREHENSIVE TEST - Finding the solution...\n');
  
  await testFinal('1-Shape-Only', test1, 'Shape, no reverse - baseline');
  await testFinal('2-Shape-Reverse', test2, 'Shape then full reverse');
  await testFinal('3-BiDi-Shape', test3, 'BiDi first, then shape');
  await testFinal('4-Shape-BiDi', test4, 'Shape first, then BiDi');
  await testFinal('5-Manual-Forms', test5, 'Manually specified presentation forms');
  await testFinal('6-Original', test6, 'Original text, no processing');
  await testFinal('7-Reverse-Only', test7, 'Just reverse, no shape');
  await testFinal('8-Manual-Reversed', test8, 'Manual forms then reverse');
  await testFinal('9-Isolated-Forms', test9, 'All isolated forms (wrong - for comparison)');
  await testFinal('10-Word-Reverse', test10, 'Word-level reverse');
  
  console.log('\n' + '='.repeat(80));
  console.log('✓ FINAL TEST COMPLETE');
  console.log('Open each PDF and check the word "زوايا" at the top');
  console.log('Tell me which number shows connected letters!');
  console.log('='.repeat(80));
})();
