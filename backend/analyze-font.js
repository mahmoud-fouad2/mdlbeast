const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');

async function analyzeFontFeatures() {
  console.log('='.repeat(80));
  console.log('FONT ANALYSIS');
  console.log('='.repeat(80));
  
  const boldPath = path.join(__dirname, 'assets', 'fonts', 'NotoSansArabic-Bold.ttf');
  const regularPath = path.join(__dirname, 'assets', 'fonts', 'NotoSansArabic-Regular.ttf');
  
  const boldBytes = fs.readFileSync(boldPath);
  const regularBytes = fs.readFileSync(regularPath);
  
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  const boldFont = await pdfDoc.embedFont(boldBytes);
  const regularFont = await pdfDoc.embedFont(regularBytes);
  
  console.log('\nBold Font Info:');
  console.log('  Name:', boldFont.name);
  
  console.log('\nRegular Font Info:');
  console.log('  Name:', regularFont.name);
  
  // Test specific Arabic characters
  const testChars = {
    'ز isolated': '\u0632',
    'ز initial': '\uFEAF',
    'ز medial': '\uFEB0',
    'ز final': '\uFEB0',
    'و isolated': '\u0648',
    'و final': '\uFEED',
    'ا isolated': '\u0627',
    'ا final': '\uFE8E',
    'ي isolated': '\u064A',
    'ي initial': '\uFEF3',
    'ي medial': '\uFEF4',
    'ي final': '\uFEF4'
  };
  
  console.log('\nTesting character support:');
  for (const [name, char] of Object.entries(testChars)) {
    try {
      const width = boldFont.widthOfTextAtSize(char, 16);
      console.log(`  ${name} (${char.charCodeAt(0).toString(16)}): width=${width.toFixed(2)}`);
    } catch (e) {
      console.log(`  ${name}: ERROR - ${e.message}`);
    }
  }
  
  // Test a simple word
  const testWord = 'زوايا';
  const testWordPresentation = '\uFEAF\uFEED\uFE8E\uFEF3\uFE8E'; // z w a y a in presentation forms
  
  console.log('\nWord width comparison:');
  console.log(`  Original "${testWord}": ${boldFont.widthOfTextAtSize(testWord, 16)}`);
  console.log(`  Presentation forms: ${boldFont.widthOfTextAtSize(testWordPresentation, 16)}`);
}

(async () => {
  await analyzeFontFeatures();
})();
