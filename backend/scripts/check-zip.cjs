const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// We can inspect zip entries using yauzl or unzip or built-in zlib / read buffer
// Let's check node_modules in backend to see what zip libraries are available
const nodeModules = fs.readdirSync(path.resolve(__dirname, '../node_modules'));
const zipLibs = nodeModules.filter(m => m.includes('zip') || m.includes('arch') || m.includes('tar'));
console.log('Zip libs in backend:', zipLibs);
