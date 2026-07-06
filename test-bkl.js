const fs = require('fs');
const XLSX = require('xlsx');

try {
  const wb = XLSX.read(fs.readFileSync('./BKL TGL 040726.xls'), { type: 'buffer' });
  const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('Row 1 DEALER:', data[0]['DEALER']);
    console.log('Row 1 SO:', data[0]['SO']);
  }
} catch(e) { console.error(e.message); }
