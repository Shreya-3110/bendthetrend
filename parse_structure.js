const fs = require('fs');
const html = fs.readFileSync('framer_dump.html', 'utf8');

// Extract Google fonts / web fonts
const fontLinks = html.match(/https:\/\/fonts\.googleapis\.com\/css2?[^"']+/g) || [];
const fontFaces = html.match(/@font-face\s*\{[^}]+\}/g) || [];
console.log('--- FONT LINKS ---');
console.log(fontLinks);

// Extract all SVG strings
const svgs = html.match(/<svg[\s\S]*?<\/svg>/g) || [];
console.log('--- SVGS FOUND:', svgs.length);
fs.writeFileSync('extracted_svgs.json', JSON.stringify(svgs, null, 2));

// Extract all text content and section IDs / headings
const headings = html.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi) || [];
console.log('--- HEADINGS ---');
headings.forEach(h => console.log(h.replace(/<[^>]+>/g, '').trim()));
