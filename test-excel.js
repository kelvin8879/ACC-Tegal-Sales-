const fs = require('fs');
const XLSX = require('xlsx');

function checkFile(name, path) {
  try {
    const wb = XLSX.read(fs.readFileSync(path), { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    console.log(`\n--- ${name} ---`);
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('Row 1:', data[0]);
    } else {
      console.log('Empty data');
    }
  } catch (e) {
    console.error(`Error reading ${name}:`, e.message);
  }
}

checkFile('IN', './IN TGL 040726.xls');
checkFile('VLD', './VLD TGL 040726.xls');
