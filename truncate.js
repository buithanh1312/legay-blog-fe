const fs = require('fs');
const path = require('path');

const filePath = 'D:\\Data\\working\\practice\\blog-frontend\\blog-fe\\src\\pages\\PostDetailPage.tsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');
const truncated = lines.slice(0, 248).join('\n');
fs.writeFileSync(filePath, truncated, 'utf8');
console.log('File truncated to 248 lines');

// Show last 5 lines
const finalLines = fs.readFileSync(filePath, 'utf8').split('\n');
console.log('\n--- Last 5 lines ---');
console.log(finalLines.slice(-6).join('\n'));
