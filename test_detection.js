
const { detectFileType } = require('./backend/src/lib/fileValidation');
const buf = Buffer.from('%PDF-1.4 dummy content');
console.log('Detected:', detectFileType(buf));
console.log('Buffer hex:', buf.toString('hex'));
