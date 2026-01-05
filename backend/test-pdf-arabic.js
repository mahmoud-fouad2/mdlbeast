const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const ArabicReshaper = require('arabic-reshaper');
const bidiFactory = require('bidi-js');

const bidi = bidiFactory();

// Test strings
const companyName = 'زوايا البناء للإستشارات الهندسيه';
const attachmentText = 'نوعية المرفقات: ٢ اسطوانه';

async function testMethod(methodName, processTextFunc) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TESTING: ${methodName}`);
  console.log('='.repeat(80));
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  // Load Arabic font
  const fontPath = path.join(__dirname, 'assets', 'fonts', 'NotoSansArabic-Bold.ttf');
  const fontBytes = fs.readFileSync(fontPath);
  const arabicFont = await pdfDoc.embedFont(fontBytes);
  
  const page = pdfDoc.addPage([600, 400]);
  const fontSize = 16;
  
  // Process texts
  const processedCompany = processTextFunc(companyName);
  const processedAttachment = processTextFunc(attachmentText);
  
  console.log('Company processed:', processedCompany);
  console.log('Attachment processed:', processedAttachment);
  
  // Draw texts
  page.drawText(processedCompany, {
    x: 50,
    y: 300,
    size: fontSize,
    font: arabicFont,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(processedAttachment, {
    x: 50,
    y: 250,
    size: fontSize,
    font: arabicFont,
    color: rgb(0, 0, 0)
  });
  
  // Add method label
  page.drawText(`Method: ${methodName}`, {
    x: 50,
    y: 350,
    size: 12,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, `test-arabic-${methodName.replace(/[^a-z0-9]/gi, '-')}.pdf`);
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✓ Saved to: ${outputPath}`);
}

// Method 1: Shape → BiDi → draw as-is
function method1(text) {
  const cleaned = text.normalize('NFC').trim();
  const shaped = ArabicReshaper.convertArabic(cleaned);
  const embedding = bidi.getEmbeddingLevels(shaped, 'rtl');
  const visual = bidi.getReorderedString(shaped, embedding);
  return visual;
}

// Method 2: BiDi → Shape → draw as-is
function method2(text) {
  const cleaned = text.normalize('NFC').trim();
  const embedding = bidi.getEmbeddingLevels(cleaned, 'rtl');
  const visual = bidi.getReorderedString(cleaned, embedding);
  const shaped = ArabicReshaper.convertArabic(visual);
  return shaped;
}

// Method 3: Shape → Reverse
function method3(text) {
  const cleaned = text.normalize('NFC').trim();
  const shaped = ArabicReshaper.convertArabic(cleaned);
  const reversed = Array.from(shaped).reverse().join('');
  return reversed;
}

// Method 4: Shape only (no reverse, no BiDi)
function method4(text) {
  const cleaned = text.normalize('NFC').trim();
  const shaped = ArabicReshaper.convertArabic(cleaned);
  return shaped;
}

// Method 5: Original (no processing)
function method5(text) {
  return text.normalize('NFC').trim();
}

// Method 6: Just reverse (no shape)
function method6(text) {
  const cleaned = text.normalize('NFC').trim();
  return Array.from(cleaned).reverse().join('');
}

(async () => {
  console.log('Testing all methods with actual PDF rendering...\n');
  
  await testMethod('1-Shape-Then-BiDi', method1);
  await testMethod('2-BiDi-Then-Shape', method2);
  await testMethod('3-Shape-Then-Reverse', method3);
  await testMethod('4-Shape-Only', method4);
  await testMethod('5-Original-NoProcessing', method5);
  await testMethod('6-Reverse-NoShape', method6);
  
  console.log('\n' + '='.repeat(80));
  console.log('✓ All PDFs generated! Check the backend folder.');
  console.log('='.repeat(80));
})();
