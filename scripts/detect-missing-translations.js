#!/usr/bin/env node
/**
 * 🌐 Translation Detection Script
 * 
 * This script scans all React/TypeScript components for:
 * 1. Hardcoded Arabic text that should be translated
 * 2. t() function calls with missing translation keys
 * 
 * Usage: node scripts/detect-missing-translations.js
 */

const fs = require('fs');
const path = require('path');

// Load translation files
const arTranslations = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../locales/ar.json'), 'utf8')
);
const enTranslations = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../locales/en.json'), 'utf8')
);

// Patterns to detect hardcoded Arabic text
const arabicTextPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Directories to scan
const dirsToScan = ['components', 'app', 'lib'];

// Files to exclude (config, types, etc.)
const excludeFiles = [
  'translations.ts',
  'i18n-context.tsx',
  'language-context.tsx',
];

// Patterns for strings that don't need translation
const skipPatterns = [
  /^https?:\/\//,
  /^[0-9\-\/\.\:\s]+$/,
  /^\s*$/,
  /^#[a-fA-F0-9]{3,8}$/,
  /^[a-zA-Z_]+$/,  // Pure English identifiers
  /^INCOMING$|^OUTGOING$/,
  /^PDF$|^CSV$/,
  /^\$\{/,  // Template literals
];

// Collect all findings
const findings = {
  hardcodedArabic: [],
  missingInAr: [],
  missingInEn: [],
  usedKeys: new Set(),
};

/**
 * Extract strings from a file
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  const lines = content.split('\n');

  // Find t() calls and track used keys
  const tCallPattern = /t\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,|\))/g;
  let match;
  while ((match = tCallPattern.exec(content)) !== null) {
    const key = match[1];
    findings.usedKeys.add(key);
    
    if (!arTranslations[key]) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      findings.missingInAr.push({
        file: relativePath,
        line: lineNum,
        key,
        context: lines[lineNum - 1]?.trim().substring(0, 80)
      });
    }
    
    if (!enTranslations[key]) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      findings.missingInEn.push({
        file: relativePath,
        line: lineNum,
        key,
        context: lines[lineNum - 1]?.trim().substring(0, 80)
      });
    }
  }

  // Find hardcoded Arabic strings in JSX
  // Match strings inside JSX text content, className, placeholder, title, etc.
  const jsxTextPatterns = [
    // JSX text content between tags: >Arabic text<
    />([^<>\{\}]+)</g,
    // String attributes: placeholder="Arabic"
    /(?:placeholder|title|label|aria-label|alt)=["']([^"']+)["']/g,
    // String literals in JSX expressions: {"Arabic"}
    /\{["']([^"']+)["']\}/g,
    // Direct strings: "Arabic text" or 'Arabic text'
    /["']([^"'\n]{3,})["']/g,
  ];

  for (const pattern of jsxTextPatterns) {
    let strMatch;
    pattern.lastIndex = 0;
    
    while ((strMatch = pattern.exec(content)) !== null) {
      const text = strMatch[1]?.trim();
      
      if (!text) continue;
      if (skipPatterns.some(p => p.test(text))) continue;
      
      // Check if contains Arabic characters
      if (arabicTextPattern.test(text)) {
        const lineNum = content.substring(0, strMatch.index).split('\n').length;
        const lineContent = lines[lineNum - 1]?.trim() || '';
        
        // Skip if it's inside a t() call
        if (/t\s*\(/.test(lineContent) && lineContent.includes(text)) continue;
        
        // Skip if it looks like a translation value being defined
        if (lineContent.startsWith('"') && lineContent.includes(':')) continue;
        
        // Skip comments
        if (lineContent.startsWith('//') || lineContent.startsWith('/*')) continue;
        
        findings.hardcodedArabic.push({
          file: relativePath,
          line: lineNum,
          text: text.length > 50 ? text.substring(0, 50) + '...' : text,
          lineContent: lineContent.substring(0, 100)
        });
      }
    }
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
  const fullPath = path.join(process.cwd(), dir);
  
  if (!fs.existsSync(fullPath)) return;
  
  const items = fs.readdirSync(fullPath);
  
  for (const item of items) {
    const itemPath = path.join(fullPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      scanDirectory(path.join(dir, item));
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (['.tsx', '.jsx', '.ts', '.js'].includes(ext)) {
        if (!excludeFiles.includes(item)) {
          scanFile(itemPath);
        }
      }
    }
  }
}

/**
 * Generate suggested translation keys
 */
function suggestKey(text) {
  // Simple key generation from Arabic text
  const keyMap = {
    'تتبع الباركود': 'scanner.title',
    'مسح بالكاميرا': 'scanner.camera_scan',
    'بحث يدوي': 'scanner.manual_search',
    'في انتظار المسح': 'scanner.waiting',
    'استخدم الكاميرا': 'scanner.use_camera',
    'نظام الإعتمادات': 'approvals.title',
    'إدارة الطلبات': 'approvals.manage_requests',
    'لا توجد طلبات': 'approvals.no_requests',
    'طلب جديد': 'approvals.new_request',
    'إرسال الطلب': 'approvals.submit_request',
  };
  
  for (const [pattern, key] of Object.entries(keyMap)) {
    if (text.includes(pattern)) return key;
  }
  
  return 'new.key.' + Math.random().toString(36).substring(2, 8);
}

/**
 * Main execution
 */
console.log('🌐 Translation Detection Script');
console.log('================================\n');

// Scan directories
for (const dir of dirsToScan) {
  console.log(`📂 Scanning ${dir}/...`);
  scanDirectory(dir);
}

// Remove duplicates
const uniqueHardcoded = [];
const seenHardcoded = new Set();
for (const item of findings.hardcodedArabic) {
  const key = `${item.file}:${item.line}:${item.text}`;
  if (!seenHardcoded.has(key)) {
    seenHardcoded.add(key);
    uniqueHardcoded.push(item);
  }
}
findings.hardcodedArabic = uniqueHardcoded;

// Report findings
console.log('\n\n📋 REPORT');
console.log('=========\n');

// Hardcoded Arabic text
if (findings.hardcodedArabic.length > 0) {
  console.log(`\n🔴 HARDCODED ARABIC TEXT (${findings.hardcodedArabic.length} found):`);
  console.log('These strings should be moved to translation files:\n');
  
  for (const item of findings.hardcodedArabic.slice(0, 50)) {
    console.log(`  📍 ${item.file}:${item.line}`);
    console.log(`     Text: "${item.text}"`);
    console.log(`     Suggested key: ${suggestKey(item.text)}`);
    console.log('');
  }
  
  if (findings.hardcodedArabic.length > 50) {
    console.log(`  ... and ${findings.hardcodedArabic.length - 50} more\n`);
  }
}

// Missing in Arabic
if (findings.missingInAr.length > 0) {
  console.log(`\n🟠 MISSING IN ar.json (${findings.missingInAr.length} keys):`);
  for (const item of findings.missingInAr.slice(0, 20)) {
    console.log(`  • ${item.key} (${item.file}:${item.line})`);
  }
  if (findings.missingInAr.length > 20) {
    console.log(`  ... and ${findings.missingInAr.length - 20} more`);
  }
}

// Missing in English
if (findings.missingInEn.length > 0) {
  console.log(`\n🟡 MISSING IN en.json (${findings.missingInEn.length} keys):`);
  for (const item of findings.missingInEn.slice(0, 20)) {
    console.log(`  • ${item.key} (${item.file}:${item.line})`);
  }
  if (findings.missingInEn.length > 20) {
    console.log(`  ... and ${findings.missingInEn.length - 20} more`);
  }
}

// Summary
console.log('\n\n📊 SUMMARY');
console.log('==========');
console.log(`Total translation keys in ar.json: ${Object.keys(arTranslations).length}`);
console.log(`Total translation keys in en.json: ${Object.keys(enTranslations).length}`);
console.log(`Keys used in code: ${findings.usedKeys.size}`);
console.log(`Hardcoded Arabic text found: ${findings.hardcodedArabic.length}`);
console.log(`Missing in ar.json: ${findings.missingInAr.length}`);
console.log(`Missing in en.json: ${findings.missingInEn.length}`);

// Generate fix suggestions
if (findings.hardcodedArabic.length > 0) {
  console.log('\n\n💡 SUGGESTED FIXES');
  console.log('==================');
  console.log('Add these translations to locales/ar.json and locales/en.json:\n');
  
  const suggestions = new Map();
  for (const item of findings.hardcodedArabic) {
    if (!suggestions.has(item.text)) {
      suggestions.set(item.text, suggestKey(item.text));
    }
  }
  
  console.log('// For ar.json:');
  for (const [text, key] of suggestions) {
    console.log(`"${key}": "${text}",`);
  }
  
  console.log('\n// For en.json (translate these):');
  for (const [text, key] of suggestions) {
    console.log(`"${key}": "[English translation needed]",`);
  }
}

console.log('\n✅ Scan complete!\n');
