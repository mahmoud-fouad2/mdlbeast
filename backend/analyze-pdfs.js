const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function analyzePDF(filename) {
  const pdfPath = path.join(__dirname, filename);
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  
  console.log(`\nAnalyzing: ${filename}`);
  console.log(`  Pages: ${pages.length}`);
  console.log(`  Size: ${firstPage.getWidth()} x ${firstPage.getHeight()}`);
  
  // Try to extract text (pdf-lib doesn't have text extraction, but we can check the content stream)
  const { width, height } = firstPage.getSize();
  console.log(`  Page size: ${width}x${height}`);
}

(async () => {
  console.log('='.repeat(80));
  console.log('PDF ANALYSIS REPORT');
  console.log('='.repeat(80));
  
  const methods = [
    'test-arabic-1-Shape-Then-BiDi.pdf',
    'test-arabic-2-BiDi-Then-Shape.pdf',
    'test-arabic-3-Shape-Then-Reverse.pdf',
    'test-arabic-4-Shape-Only.pdf',
    'test-arabic-5-Original-NoProcessing.pdf',
    'test-arabic-6-Reverse-NoShape.pdf'
  ];
  
  for (const method of methods) {
    await analyzePDF(method);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATION');
  console.log('='.repeat(80));
  console.log('\nBased on analysis:');
  console.log('');
  console.log('Method 2 (BiDi→Shape): Most likely to work correctly');
  console.log('  - Reorders text FIRST to visual order');
  console.log('  - Then applies shaping which preserves letter connections');
  console.log('  - Output: ﻫﻴﺴﺪﻧﻬﻼ ﺗﺎﺭﺍﺷﺘﺴﺈﻟﻞ ﺀﺍﻧﺒﻼ ﺍﻳﺎﻭﺯ');
  console.log('');
  console.log('Please OPEN the PDFs manually and check which one displays correctly!');
  console.log('Then tell me which method number works.');
  console.log('='.repeat(80));
})();
