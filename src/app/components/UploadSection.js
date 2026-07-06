'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

const norm = (v) => String(v || '').trim().toUpperCase();
const matchDealer = (val) => C1_DEALERS.find(d => norm(d) === norm(val)) || null;
const matchOfficer = (val) => C1_OFFICERS.find(o => norm(o) === norm(val)) || null;

const getBrand = (dealer) => {
  const d = norm(dealer);
  if (d.includes('CHANDRA') || d.includes('NASMOCO')) return 'Toyota';
  if (d.includes('AI DSO')) return 'Daihatsu';
  if (d.includes('AI ISO') || d.includes('KARYA ZIRANG')) return 'Isuzu';
  if (d.includes('CARBAY')) return 'Used Car';
  if (d.includes('AUTOMOBIL JAYA')) return 'Honda';
  if (d.includes('DOVA') || d.includes('GEDONG JEMBAR')) return 'Suzuki';
  return 'Lainnya';
};

const getWilayah = (dealer) => {
  const d = norm(dealer);
  if (d.includes('PKL') || d.includes('PEKALONGAN') || d.includes('KLBANGER') || d.includes('SUTOMO')) return 'Pekalongan';
  if (d.includes('TGL') || d.includes('TEGAL') || d.includes('SUGIONO') || d.includes('MRTLYO') || d.includes('ISZ') || d.includes('BRT') || d.includes('MTLYO') || d.includes('HAKIM')) return 'Tegal';
  return 'Lainnya';
};

const toDate = (val, fallback = null) => {
  if (!val) return fallback;
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  }
  const d = new Date(val);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return fallback;
};

const key7 = (v) => String(v || '').trim().slice(-7);

export default function UploadSection({ onUploadSuccess, onClose }) {
  const [files, setFiles] = useState({ IN: null, VALID: null, BACKLOG: null });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [dragActive, setDragActive] = useState({ IN: false, VALID: false, BACKLOG: false });

  const handleFileChange = (type, file) => {
    if (file) {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        setFiles(prev => ({ ...prev, [type]: file }));
        setStatusMsg({ type: '', text: '' });
      } else {
        setStatusMsg({ type: 'error', text: 'Format file harus Excel (.xlsx atau .xls)' });
      }
    }
  };

  const handleDrag = (type, e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(prev => ({ ...prev, [type]: true }));
    else if (e.type === 'dragleave') setDragActive(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (type, e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    if (e.dataTransfer.files?.[0]) handleFileChange(type, e.dataTransfer.files[0]);
  };

  const parseExcelFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const handleProcess = async () => {
    if (!files.IN || !files.VALID || !files.BACKLOG) {
      setStatusMsg({ type: 'error', text: 'Upload ketiga file Excel (IN, VALID, dan BACKLOG).' });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Membaca dan memvalidasi file Excel...' });

    try {
      const rawIn = await parseExcelFile(files.IN);
      const rawValid = await parseExcelFile(files.VALID);
      const rawBacklog = await parseExcelFile(files.BACKLOG);

      const customerMap = new Map();

      // ── IN ──
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
          status: String(row['StatusAppl'] || row['CDCurState'] || 'In Process').trim(),
          acp: null,
          // New Columns
          excel_id: String(row['ID'] || '').trim(),
          salesman: String(row['Salesman'] || '').trim(),
          merk: String(row['Merk'] || '').trim(),
          nilai_princip: row['NilaiPrincip'] || 0,
          unit: row['Unit'] || 1,
        });
      }

      // ── BACKLOG ──
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
          excel_id: String(row['ID'] || '').trim(),
          tenor: row['TENOR'] || 0,
          otr: row['OTR'] || 0,
          dp: row['DP'] || 0,
          ph: row['PH'] || 0,
          merk: String(row['MERK'] || '').trim(),
        });
      }

      // ── VALID ──
      const parsedValid = [];
      for (const row of rawValid) {
        const no_reg = String(row['NoAggr'] || '').trim();
        const match = customerMap.get(key7(no_reg));
        
        let dealerRaw = String(row['NamaDealer'] || '').trim();
        let officerRaw = String(row['NamaSO'] || '').trim();
        let dealer = match ? match.dealer : matchDealer(dealerRaw);
        let officer = match ? match.officer : matchOfficer(officerRaw);
        let nama = match ? match.nama : String(row['Name'] || `Customer ${key7(no_reg)}`).trim();
        
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
          excel_id: String(row['ID'] || '').trim(),
          kota_dealer: String(row['KotaDealer'] || '').trim(),
          merk: String(row['Merk'] || '').trim(),
        });
      }

      const allRecords = [...parsedIn, ...parsedValid, ...parsedBacklog];
      if (allRecords.length === 0) throw new Error('Tidak ada data C1 yang valid ditemukan di file ini.');

      setStatusMsg({ type: 'loading', text: `Menyimpan ${allRecords.length} data ke Supabase...` });

      // 1. Delete old data (Truncate basically)
      const { error: delError } = await supabase.from('sales_data_v3').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (delError) throw new Error('Gagal menghapus data lama di database: ' + delError.message);

      // 2. Map data for insertion
      const insertData = allRecords.map(r => ({
        excel_id: r.excel_id,
        source_type: r.source_type,
        tanggal: r.tanggal,
        dealer: r.dealer,
        officer: r.officer,
        pengajuan: r.pengajuan,
        status: r.status,
        nama: r.nama,
        no_reg: r.no_reg,
        wilayah: r.wilayah,
        brand: r.brand,
        acp: r.acp
      }));

      // 3. Bulk Insert (chunking per 1000 to be safe with Supabase limits)
      const chunkSize = 1000;
      for (let i = 0; i < insertData.length; i += chunkSize) {
        const chunk = insertData.slice(i, i + chunkSize);
        const { error: insError } = await supabase.from('sales_data_v3').insert(chunk);
        if (insError) throw new Error('Gagal menyimpan data baru: ' + insError.message);
      }

      setStatusMsg({ type: 'success', text: `Sukses! ${allRecords.length} data berhasil disimpan ke Database.` });
      setTimeout(() => { onUploadSuccess(); onClose(); }, 2000);

    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Gagal memproses: ' + (err.message || 'Format data tidak sesuai.') });
    } finally {
      setLoading(false);
    }
  };

  const uploadFields = [
    { type: 'IN', label: '1. File Data IN', desc: 'Seret & Lepas atau klik untuk pilih file IN' },
    { type: 'VALID', label: '2. File Data VALID', desc: 'Seret & Lepas atau klik untuk pilih file VALID' },
    { type: 'BACKLOG', label: '3. File Data BACKLOG', desc: 'Seret & Lepas atau klik untuk pilih file BACKLOG' },
  ];

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)' }}>
      <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '520px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: 700 }}>Upload Data C1</h2>
          <button className="drawer-close" onClick={onClose} disabled={loading}>×</button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
          Silakan unggah ketiga file laporan penjualan di bawah ini. Aplikasi akan secara otomatis mendeteksi rentang tanggal laporan dari data transaksi Anda.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {uploadFields.map(({ type, label, desc }) => (
            <div key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>{label}</span>
                {files[type] && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle2 size={11} /> {files[type].name}
                  </span>
                )}
              </div>
              <div
                className={`upload-zone ${dragActive[type] ? 'drag-active' : ''}`}
                onDragEnter={(e) => handleDrag(type, e)} onDragOver={(e) => handleDrag(type, e)}
                onDragLeave={(e) => handleDrag(type, e)} onDrop={(e) => handleDrop(type, e)}
                onClick={() => document.getElementById(`file-input-${type}`).click()}
                style={{ padding: files[type] ? '1rem' : '1.75rem 1rem' }}
              >
                {loading && <div className="scanner-laser" />}
                <input id={`file-input-${type}`} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(type, e.target.files[0])} disabled={loading} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  {files[type]
                    ? <FileSpreadsheet size={28} className="text-primary-theme" />
                    : <Upload size={28} style={{ color: 'var(--text-secondary)' }} />}
                  <span style={{ fontSize: '0.78rem', color: files[type] ? '#fff' : 'var(--text-secondary)' }}>
                    {files[type] ? `✓ ${files[type].name}` : desc}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {statusMsg.text && (
          <div style={{
            background: statusMsg.type === 'error' ? 'rgba(239,68,68,0.15)' : statusMsg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
            border: `1px solid ${statusMsg.type === 'error' ? '#ef4444' : statusMsg.type === 'success' ? '#10b981' : '#6366f1'}`,
            borderRadius: '0.65rem', padding: '0.65rem 1rem', marginBottom: '1.25rem',
            fontSize: '0.82rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            {statusMsg.type === 'error' && <AlertTriangle size={15} />}
            {statusMsg.type === 'success' && <CheckCircle2 size={15} />}
            {statusMsg.type === 'info' && <Loader2 size={15} className="animate-spin" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Batal</button>
          <button className="btn btn-primary" onClick={handleProcess}
            disabled={loading || !files.IN || !files.VALID || !files.BACKLOG}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Memproses...</> : 'Proses & Tampilkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
