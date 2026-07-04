const fs = require('fs');
const path = 'src/app/components/UploadSection.js';
let content = fs.readFileSync(path, 'utf8');

// Replace the IN parsing block
const oldIn = `      // ── IN ──
      const parsedIn = [];
      for (const row of rawIn) {
        const dealer = matchDealer(String(row['Supplier'] || '').trim());
        const officer = matchOfficer(String(row['SO'] || '').trim());
        if (!dealer || !officer) continue;

        const no_reg = String(row['NoRegistrasi'] || '').trim();
        const nama = String(row['Nama'] || 'No Name').trim();
        if (no_reg) customerMap.set(key7(no_reg), { nama, dealer, officer });

        parsedIn.push({
          source_type: 'IN', tanggal: toDate(row['TglApplIn'], null),
          no_reg: no_reg || null, nama, dealer, officer,
          wilayah: getWilayah(dealer), brand: getBrand(dealer),
          pengajuan: 'Non Top Up',
          status: String(row['StatusAppl'] || row['CDCurState'] || 'In Process').trim(),
          acp: null,
        });
      }`;

const newIn = `      // ── IN ──
      const parsedIn = [];
      for (const row of rawIn) {
        const dealer = matchDealer(String(row['Supplier'] || '').trim());
        const officer = matchOfficer(String(row['SO'] || '').trim());
        if (!dealer || !officer) continue;

        const no_reg = String(row['NoRegistrasi'] || '').trim();
        const nama = String(row['Nama'] || 'No Name').trim();
        if (no_reg) customerMap.set(key7(no_reg), { nama, dealer, officer });

        parsedIn.push({
          source_type: 'IN', tanggal: toDate(row['TglApplIn'], null),
          no_reg: no_reg || null, nama, dealer, officer,
          wilayah: getWilayah(dealer), brand: getBrand(dealer),
          pengajuan: 'Non Top Up',
          status: String(row['StatusAppl'] || row['CDCurState'] || 'In Process').trim(),
          acp: null,
          // New Columns
          id: String(row['ID'] || '').trim(),
          salesman: String(row['Salesman'] || '').trim(),
          merk: String(row['Merk'] || '').trim(),
          nilai_princip: row['NilaiPrincip'] || 0,
          unit: row['Unit'] || 1,
        });
      }`;

content = content.replace(oldIn, newIn);

// Replace BACKLOG parsing block
const oldBacklog = `      // ── BACKLOG ──
      const parsedBacklog = [];
      for (const row of rawBacklog) {
        const dealer = matchDealer(String(row['DEALER'] || '').trim());
        const officer = matchOfficer(String(row['SO'] || '').trim());
        if (!dealer || !officer) continue;

        const no_reg = String(row['NOREG'] || '').trim();
        const nama = String(row['NAMA'] || 'No Name').trim();
        const pengajuan = String(row['ADDM/B'] || '').trim() === 'M' ? 'ADDM' : 'ADDB';
        if (no_reg) customerMap.set(key7(no_reg), { nama, dealer, officer });

        parsedBacklog.push({
          source_type: 'BACKLOG', tanggal: toDate(row['TGL IN'], null),
          no_reg: no_reg || null, nama, dealer, officer,
          wilayah: getWilayah(dealer), brand: getBrand(dealer),
          pengajuan, status: 'Backlog', acp: null,
        });
      }`;

const newBacklog = `      // ── BACKLOG ──
      const parsedBacklog = [];
      for (const row of rawBacklog) {
        const dealer = matchDealer(String(row['DEALER'] || '').trim());
        const officer = matchOfficer(String(row['SO'] || '').trim());
        if (!dealer || !officer) continue;

        const no_reg = String(row['NOREG'] || '').trim();
        const nama = String(row['NAMA'] || 'No Name').trim();
        const pengajuan = String(row['ADDM/B'] || '').trim() === 'M' ? 'ADDM' : 'ADDB';
        if (no_reg) customerMap.set(key7(no_reg), { nama, dealer, officer });

        parsedBacklog.push({
          source_type: 'BACKLOG', tanggal: toDate(row['TGL IN'], null),
          no_reg: no_reg || null, nama, dealer, officer,
          wilayah: getWilayah(dealer), brand: getBrand(dealer),
          pengajuan, status: 'Backlog', acp: null,
          // New Columns
          id: String(row['ID'] || '').trim(),
          tenor: row['TENOR'] || 0,
          otr: row['OTR'] || 0,
          dp: row['DP'] || 0,
          ph: row['PH'] || 0,
          merk: String(row['MERK'] || '').trim(),
        });
      }`;

content = content.replace(oldBacklog, newBacklog);

// Replace VALID parsing block
const oldValid = `      // ── VALID ──
      const parsedValid = [];
      for (const row of rawValid) {
        const dealer = matchDealer(String(row['NamaDealer'] || '').trim());
        const officer = matchOfficer(String(row['NamaSO'] || '').trim());
        if (!dealer || !officer) continue;

        const no_reg = String(row['NoAggr'] || '').trim();
        const match = customerMap.get(key7(no_reg));
        const nama = match ? match.nama : \`Customer \${key7(no_reg)}\`;
        const flag = String(row['FlagNewUsed'] || '').trim().toUpperCase();
        const pengajuan = flag === 'N' ? 'New Car' : flag === 'U' ? 'Used Car' : 'Non Top Up';
        const acpRaw = String(row['ACP/NON'] || '').trim();
        const acp = acpRaw.toUpperCase().includes('ACP') && !acpRaw.toUpperCase().includes('NON') ? 'ACP' : 'NonACP';

        parsedValid.push({
          source_type: 'VALID', tanggal: toDate(row['TglGoLive'], null),
          no_reg: no_reg || null, nama, dealer, officer,
          wilayah: getWilayah(dealer), brand: getBrand(dealer),
          pengajuan, status: acp, acp,
        });
      }`;

const newValid = `      // ── VALID ──
      const parsedValid = [];
      for (const row of rawValid) {
        const no_reg = String(row['NoAggr'] || '').trim();
        const match = customerMap.get(key7(no_reg));
        
        // Since Valid doesn't have DEALER name, we derive it from IN data mapping.
        // If not found in IN data, we can try to guess from KotaDealer or just fallback.
        let dealer = match ? match.dealer : matchDealer(String(row['KotaDealer'] || '').trim());
        let officer = match ? match.officer : matchOfficer(String(row['NamaSO'] || '').trim());
        let nama = match ? match.nama : \`Customer \${key7(no_reg)}\`;
        
        if (!dealer || !officer) continue;

        const flag = String(row['FlagNewUsed'] || '').trim().toUpperCase();
        const pengajuan = flag === 'N' ? 'New Car' : flag === 'U' ? 'Used Car' : 'Non Top Up';
        const acpRaw = String(row['ACP/NON'] || '').trim();
        const acp = acpRaw.toUpperCase().includes('ACP') && !acpRaw.toUpperCase().includes('NON') ? 'ACP' : 'NonACP';

        parsedValid.push({
          source_type: 'VALID', tanggal: toDate(row['TglGoLive'], null),
          no_reg: no_reg || null, nama, dealer, officer,
          wilayah: getWilayah(dealer), brand: getBrand(dealer),
          pengajuan, status: acp, acp,
          // New Columns
          id: String(row['ID'] || '').trim(),
          kota_dealer: String(row['KotaDealer'] || '').trim(),
          merk: String(row['Merk'] || '').trim(),
        });
      }`;

content = content.replace(oldValid, newValid);

fs.writeFileSync(path, content);
console.log('Update UploadSection complete');
