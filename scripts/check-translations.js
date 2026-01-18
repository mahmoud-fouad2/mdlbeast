#!/usr/bin/env node

/**
 * Translation Coverage Checker
 * Scans all .tsx and .ts files for t() calls and compares with translation files
 * Reports missing translations
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../locales');
const SRC_DIRS = [
  path.join(__dirname, '../components'),
  path.join(__dirname, '../app'),
  path.join(__dirname, '../lib')
];

// Load translation files
const enTranslations = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
const arTranslations = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'ar.json'), 'utf8'));

// Get all translation keys from files
function getAllKeysFromObject(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(getAllKeysFromObject(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = getAllKeysFromObject(enTranslations);
const arKeys = getAllKeysFromObject(arTranslations);

console.log('\n📊 Translation Files Statistics:');
console.log(`English keys: ${enKeys.length}`);
console.log(`Arabic keys: ${arKeys.length}`);

// Find used translation keys in code
const usedKeys = new Set();
const tCallPattern = /t\(['"`]([^'"`]+)['"`]\)/g;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let match;
      
      while ((match = tCallPattern.exec(content)) !== null) {
        usedKeys.add(match[1]);
      }
    }
  }
}

console.log('\n🔍 Scanning source files...');
SRC_DIRS.forEach(dir => scanDirectory(dir));

console.log(`Found ${usedKeys.size} unique translation keys in code\n`);

// Check for missing translations
const missingInEn = [];
const missingInAr = [];
const unusedInEn = [];
const unusedInAr = [];

for (const key of usedKeys) {
  if (!enKeys.includes(key)) {
    missingInEn.push(key);
  }
  if (!arKeys.includes(key)) {
    missingInAr.push(key);
  }
}

for (const key of enKeys) {
  if (!usedKeys.has(key)) {
    unusedInEn.push(key);
  }
}

for (const key of arKeys) {
  if (!usedKeys.has(key)) {
    unusedInAr.push(key);
  }
}

// Report missing translations
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚨 MISSING TRANSLATIONS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (missingInEn.length > 0) {
  console.log(`❌ Missing in English (${missingInEn.length}):`);
  missingInEn.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

if (missingInAr.length > 0) {
  console.log(`❌ Missing in Arabic (${missingInAr.length}):`);
  missingInAr.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

if (missingInEn.length === 0 && missingInAr.length === 0) {
  console.log('✅ All used translations are defined!\n');
}

// Report unused translations
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠️  UNUSED TRANSLATIONS (Safe to remove)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (unusedInEn.length > 0) {
  console.log(`📝 Unused in English (${unusedInEn.length}):`);
  unusedInEn.slice(0, 20).forEach(key => console.log(`   - ${key}`));
  if (unusedInEn.length > 20) {
    console.log(`   ... and ${unusedInEn.length - 20} more`);
  }
  console.log('');
}

if (unusedInAr.length > 0) {
  console.log(`📝 Unused in Arabic (${unusedInAr.length}):`);
  unusedInAr.slice(0, 20).forEach(key => console.log(`   - ${key}`));
  if (unusedInAr.length > 20) {
    console.log(`   ... and ${unusedInAr.length - 20} more`);
  }
  console.log('');
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📈 SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`Total translation keys used in code: ${usedKeys.size}`);
console.log(`Missing in English: ${missingInEn.length}`);
console.log(`Missing in Arabic: ${missingInAr.length}`);
console.log(`Unused in English: ${unusedInEn.length}`);
console.log(`Unused in Arabic: ${unusedInAr.length}`);

const exitCode = (missingInEn.length + missingInAr.length) > 0 ? 1 : 0;
console.log(`\n${exitCode === 0 ? '✅ Pass' : '❌ Fail'}\n`);

process.exit(exitCode);
