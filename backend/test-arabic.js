const ArabicReshaper = require('arabic-reshaper');
const bidiFactory = require('bidi-js');

const bidi = bidiFactory();

// Test strings
const companyName = 'زوايا البناء للإستشارات الهندسيه';
const attachmentText = 'نوعية المرفقات: ٢ اسطوانه';

console.log('='.repeat(80));
console.log('TESTING ARABIC TEXT PROCESSING');
console.log('='.repeat(80));

function hexDump(text, label) {
  const hex = Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ');
  console.log(`${label}:`, text);
  console.log(`  HEX:`, hex);
  console.log(`  Length:`, text.length);
}

// Method 1: Shape THEN BiDi reorder
console.log('\n--- METHOD 1: Shape → BiDi reorder → draw as-is ---');
function method1(text) {
  const cleaned = text.normalize('NFC').trim();
  const shaped = ArabicReshaper.convertArabic(cleaned);
  const embedding = bidi.getEmbeddingLevels(shaped, 'rtl');
  const visual = bidi.getReorderedString(shaped, embedding);
  
  hexDump(cleaned, 'Input');
  hexDump(shaped, 'Shaped');
  hexDump(visual, 'Visual');
  return visual;
}

console.log('\n>>> Company Name:');
const m1_company = method1(companyName);
console.log('\n>>> Attachment:');
const m1_attachment = method1(attachmentText);

// Method 2: BiDi reorder THEN Shape
console.log('\n\n--- METHOD 2: BiDi reorder → Shape → draw as-is ---');
function method2(text) {
  const cleaned = text.normalize('NFC').trim();
  const embedding = bidi.getEmbeddingLevels(cleaned, 'rtl');
  const visual = bidi.getReorderedString(cleaned, embedding);
  const shaped = ArabicReshaper.convertArabic(visual);
  
  hexDump(cleaned, 'Input');
  hexDump(visual, 'Visual');
  hexDump(shaped, 'Shaped');
  return shaped;
}

console.log('\n>>> Company Name:');
const m2_company = method2(companyName);
console.log('\n>>> Attachment:');
const m2_attachment = method2(attachmentText);

// Method 3: Shape ONLY, then reverse manually
console.log('\n\n--- METHOD 3: Shape → Reverse → draw ---');
function method3(text) {
  const cleaned = text.normalize('NFC').trim();
  const shaped = ArabicReshaper.convertArabic(cleaned);
  const reversed = Array.from(shaped).reverse().join('');
  
  hexDump(cleaned, 'Input');
  hexDump(shaped, 'Shaped');
  hexDump(reversed, 'Reversed');
  return reversed;
}

console.log('\n>>> Company Name:');
const m3_company = method3(companyName);
console.log('\n>>> Attachment:');
const m3_attachment = method3(attachmentText);

// Method 4: Shape ONLY, draw as-is (LTR)
console.log('\n\n--- METHOD 4: Shape ONLY → draw LTR ---');
function method4(text) {
  const cleaned = text.normalize('NFC').trim();
  const shaped = ArabicReshaper.convertArabic(cleaned);
  
  hexDump(cleaned, 'Input');
  hexDump(shaped, 'Shaped');
  return shaped;
}

console.log('\n>>> Company Name:');
const m4_company = method4(companyName);
console.log('\n>>> Attachment:');
const m4_attachment = method4(attachmentText);

// Method 5: Just reverse (no shape, no BiDi)
console.log('\n\n--- METHOD 5: Just Reverse (no shape) ---');
function method5(text) {
  const cleaned = text.normalize('NFC').trim();
  const reversed = Array.from(cleaned).reverse().join('');
  
  hexDump(cleaned, 'Input');
  hexDump(reversed, 'Reversed');
  return reversed;
}

console.log('\n>>> Company Name:');
const m5_company = method5(companyName);
console.log('\n>>> Attachment:');
const m5_attachment = method5(attachmentText);

// Summary
console.log('\n\n' + '='.repeat(80));
console.log('SUMMARY - Company Name Results:');
console.log('='.repeat(80));
console.log('Method 1 (Shape→BiDi):', m1_company);
console.log('Method 2 (BiDi→Shape):', m2_company);
console.log('Method 3 (Shape→Reverse):', m3_company);
console.log('Method 4 (Shape only):', m4_company);
console.log('Method 5 (Reverse only):', m5_company);

console.log('\n' + '='.repeat(80));
console.log('SUMMARY - Attachment Results:');
console.log('='.repeat(80));
console.log('Method 1 (Shape→BiDi):', m1_attachment);
console.log('Method 2 (BiDi→Shape):', m2_attachment);
console.log('Method 3 (Shape→Reverse):', m3_attachment);
console.log('Method 4 (Shape only):', m4_attachment);
console.log('Method 5 (Reverse only):', m5_attachment);

console.log('\n' + '='.repeat(80));
console.log('EXPECTED OUTPUT (from screenshot):');
console.log('='.repeat(80));
console.log('Company should show: زوايا البناء للإستشارات الهندسيه');
console.log('Attachment should show: نوعية المرفقات: ٢ اسطوانه');
