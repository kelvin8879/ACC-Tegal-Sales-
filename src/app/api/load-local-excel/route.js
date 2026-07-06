import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// ─── C1 Master Data ───────────────────────────────────────────────────────────
const C1_DEALERS = [
  'CHANDRA PRATAMA M-PKL KLBANGER',
  'NASMOCO PRATAMA MTR-TGL MRTLYO',
  'NASMOCO-SMG KALIGAWE',
  'AI DSO-TGL SUGIONO',
  'AI DSO-PKL SUTOMO',
  'AI ISO-TGL PEKALONGAN',
  'KARYA ZIRANG U-TGL ISZ NEW',
  'CARBAY SERVICES IND,PT-JKT PAL',
  'AUTOMOBIL JAYA MANDIRI-TGL BRT',
  'DOVA PUTRA M S,PT-TGL MTLYO',
  'GEDONG JEMBAR-TGL AR HAKIM',
];

const C1_OFFICERS = [
  'MUHAMMAD AFIF MUZAQI',
  'R MUHAMMAD CAKRA DHIKA',
  'MUHAMAD ALWAN CHAFIZH HAIDAR',
  'MUHAMAD AJI MUSTOGA',
  'REIVALDINO ENDAH MULIO',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize: upper-trim */
const norm = (v) => String(v || '').trim().toUpperCase();

/** Exact match against C1 dealer list */
const matchDealer = (val) => C1_DEALERS.find(d => norm(d) === norm(val)) || null;

/** Exact match against C1 officer list */
const matchOfficer = (val) => C1_OFFICERS.find(o => norm(o) === norm(val)) || null;

/** Derive brand from dealer name */
const getBrand = (dealer) => {
  const d = norm(dealer);
  if (d.includes('CHANDRA') || d.includes('NASMOCO')) return 'Toyota';
  if (d.includes('AI DSO')) return 'Daihatsu';
  if (d.includes('AI ISO') || d.includes('KARYA ZIRANG')) return 'Isuzu';
  if (d.includes('CARBAY')) return 'Used Car';
  if (d.includes('AUTOMOBIL JAYA')) return 'Honda';
  if (d.includes('DOVA')) return 'Suzuki';
  if (d.includes('GEDONG JEMBAR')) return 'Suzuki';
  return 'Lainnya';
};

/** Derive wilayah (city) from dealer name */
const getWilayah = (dealer) => {
  const d = norm(dealer);
  if (d.includes('PKL') || d.includes('PEKALONGAN') || d.includes('KLBANGER') || d.includes('SUTOMO')) return 'Pekalongan';
  if (d.includes('TGL') || d.includes('TEGAL') || d.includes('SUGIONO') || d.includes('MRTLYO') || d.includes('ISZ') || d.includes('BRT') || d.includes('MTLYO') || d.includes('HAKIM')) return 'Tegal';
  return 'Lainnya';
};

/** Convert Excel serial date or string → YYYY-MM-DD */
const toDate = (val) => {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  }
  const d = new Date(val);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return null;
};

/** Last-7-chars key for cross-referencing IN → VALID */
const key7 = (v) => String(v || '').trim().slice(-7);

// ─── Main ─────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const root = process.cwd();
    const paths = {
      IN: path.join(root, 'IN TGL 270626.xls'),
      VALID: path.join(root, 'VLD TGL 270626.xls'),
      BACKLOG: path.join(root, 'BKL TGL 270626.xls'),
    };

    for (const [k, p] of Object.entries(paths)) {
      if (!fs.existsSync(p)) {
        return NextResponse.json({ error: `File ${k} tidak ditemukan: ${p}` }, { status: 404 });
      }
    }

    const read = (p) => {
      const wb = XLSX.read(fs.readFileSync(p), { type: 'buffer' });
      return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    };

    const rawIn = read(paths.IN);
    const rawValid = read(paths.VALID);
    const rawBacklog = read(paths.BACKLOG);

    // Build lookup map (no_reg last-7 → customer info) from IN & BACKLOG
    const customerMap = new Map();

    // ── Process IN ────────────────────────────────────────────────────────────
    const parsedIn = [];
    for (const row of rawIn) {
      const dealerRaw = String(row['Supplier'] || '').trim();
      const officerRaw = String(row['SO'] || '').trim();

      const dealer = matchDealer(dealerRaw);
      const officer = matchOfficer(officerRaw);

      // Skip if dealer OR officer not in C1 list (person name = C2)
      if (!dealer || !officer) continue;

      const no_reg = String(row['NoRegistrasi'] || '').trim();
      const nama = String(row['Nama'] || 'No Name').trim();
      const dateStr = toDate(row['TglApplIn']) || new Date().toISOString().split('T')[0];
      const brand = getBrand(dealer);
      const wilayah = getWilayah(dealer);
      const status = String(row['StatusAppl'] || row['CDCurState'] || 'In Process').trim();

      if (no_reg) customerMap.set(key7(no_reg), { nama, brand, dealer, officer });

      parsedIn.push({
        source_type: 'IN',
        tanggal: dateStr,
        no_reg: no_reg || null,
        nama,
        dealer,
        officer,
        wilayah,
        brand,
        pengajuan: 'Non Top Up',
        status,
        acp: null,
      });
    }

    // ── Process BACKLOG ───────────────────────────────────────────────────────
    const parsedBacklog = [];
    for (const row of rawBacklog) {
      const dealerRaw = String(row['DEALER'] || '').trim();
      const officerRaw = String(row['SO'] || '').trim();

      const dealer = matchDealer(dealerRaw);
      const officer = matchOfficer(officerRaw);

      if (!dealer || !officer) continue;

      const no_reg = String(row['NOREG'] || '').trim();
      const nama = String(row['NAMA'] || 'No Name').trim();
      const dateStr = toDate(row['TGL IN']) || new Date().toISOString().split('T')[0];
      const brand = getBrand(dealer);
      const wilayah = getWilayah(dealer);
      const pengajuan = String(row['ADDM/B'] || '').trim() === 'M' ? 'ADDM' : 'ADDB';

      if (no_reg) customerMap.set(key7(no_reg), { nama, brand, dealer, officer });

      parsedBacklog.push({
        source_type: 'BACKLOG',
        tanggal: dateStr,
        no_reg: no_reg || null,
        nama,
        dealer,
        officer,
        wilayah,
        brand,
        pengajuan,
        status: 'Backlog',
        acp: null,
      });
    }

    // ── Process VALID ─────────────────────────────────────────────────────────
    const parsedValid = [];
    for (const row of rawValid) {
      const dealerRaw = String(row['NamaDealer'] || '').trim();
      const officerRaw = String(row['NamaSO'] || '').trim();

      const dealer = matchDealer(dealerRaw);
      const officer = matchOfficer(officerRaw);

      if (!dealer || !officer) continue;

      const no_reg = String(row['NoAggr'] || '').trim();
      const dateStr = toDate(row['TglGoLive']) || new Date().toISOString().split('T')[0];
      const match = customerMap.get(key7(no_reg));
      const nama = match ? match.nama : `Customer ${key7(no_reg)}`;
      const brand = getBrand(dealer);
      const wilayah = getWilayah(dealer);

      const flagNewUsed = String(row['FlagNewUsed'] || '').trim().toUpperCase();
      const pengajuan = flagNewUsed === 'N' ? 'New Car' : flagNewUsed === 'U' ? 'Used Car' : 'Non Top Up';

      const acpRaw = String(row['ACP/NON'] || '').trim();
      const acp = acpRaw.toUpperCase().includes('ACP') && !acpRaw.toUpperCase().includes('NON') ? 'ACP' : 'NonACP';

      parsedValid.push({
        source_type: 'VALID',
        tanggal: dateStr,
        no_reg: no_reg || null,
        nama,
        dealer,
        officer,
        wilayah,
        brand,
        pengajuan,
        status: acp,
        acp,
      });
    }

    const allRecords = [...parsedIn, ...parsedValid, ...parsedBacklog];

    return NextResponse.json({ success: true, recordsCount: allRecords.length, data: allRecords });
  } catch (err) {
    console.error('API local excel error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
