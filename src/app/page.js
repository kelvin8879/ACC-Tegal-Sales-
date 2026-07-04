'use client';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useState, useEffect, useMemo } from 'react';
import {
  Upload, RefreshCw, Search, ChevronLeft, ChevronRight, SlidersHorizontal, X, Download
} from 'lucide-react';

import KpiCards from './components/KpiCards';
import TrendChart from './components/TrendChart';
import BrandChart from './components/BrandChart';
import DistributionComposedChart from './components/DistributionComposedChart';
import PerformanceTables from './components/PerformanceTables';
import DrillDownDrawer from './components/DrillDownDrawer';
import AiInsights from './components/AiInsights';
import UploadSection from './components/UploadSection';

export default function HomePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overall'); // Overall, IN, VALID, BACKLOG

  const exportToPDF = async () => {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4 (297 x 210 mm)
    const pageWidth = 297;
    const pageHeight = 210;
    const padding = 10;

    const addElementToPdf = async (elementId, startY = padding, newPage = false) => {
      const el = document.getElementById(elementId);
      if (!el) return startY;
      if (newPage) pdf.addPage();
      
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate width and height to fit width
      const imgWidth = pageWidth - (padding * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If height is too big, scale it down to fit page
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      if (imgHeight > (pageHeight - startY - padding)) {
        finalHeight = pageHeight - startY - padding;
        finalWidth = (canvas.width * finalHeight) / canvas.height;
      }
      
      // Center horizontally if scaled down
      const xPos = padding + (imgWidth - finalWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xPos, startY, finalWidth, finalHeight);
      return startY + finalHeight + padding;
    };

    // Show loading state or similar if needed...
    const originalBodyBg = document.body.style.background;
    
    try {
      // ── Halaman 1: KPI & Pie Chart ──
      let currentY = padding;
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(15, 23, 42); 
      pdf.rect(0, 0, pageWidth, pageHeight, 'F'); 
      pdf.setFontSize(16);
      pdf.text(`Overview - Tab ${activeTab}`, padding, currentY + 5);
      currentY += 15;

      currentY = await addElementToPdf('pdf-kpi', currentY, false);
      // Memasukkan Grafik Trend ke halaman pertama
      currentY = await addElementToPdf('pdf-trend', currentY, false);
      // Memasukkan Grafik Komparasi ke halaman pertama
      currentY = await addElementToPdf('pdf-composed', currentY, false);
      
      // ── Halaman 2: Trend, Composed Chart, & Performance ──
      pdf.addPage();
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      currentY = padding;
      currentY = await addElementToPdf('pdf-brand', currentY, false);
      currentY = await addElementToPdf('pdf-performance', currentY, false);
      
      // Tabel Rincian Data dihilangkan sesuai permintaan (2 lembar saja)

      pdf.save(`Overview_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Gagal mengekspor PDF');
    }
  };


  // Modals & Drawers
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDrillDown, setSelectedDrillDown] = useState(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // ── Filters State ──────────────────────────────────────────────────────────
  const [filterWilayah, setFilterWilayah] = useState(''); // Tegal / Pekalongan
  const [filterBrand, setFilterBrand] = useState('');     // Toyota / Daihatsu / Isuzu / etc.
  const [filterDealer, setFilterDealer] = useState('');
  const [filterOfficer, setFilterOfficer] = useState('');
  const [filterPengajuan, setFilterPengajuan] = useState('');
  const [filterAcp, setFilterAcp] = useState('');         // ACP / NonACP
  const [searchNama, setSearchNama] = useState('');
  const [searchNoReg, setSearchNoReg] = useState('');

  // Table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // ── Load data on mount ──────────────────────────────────────────────────────

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/load-local-excel');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('Failed to load local Excel:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSalesData(); }, []);

  // ── Unique Filter Options ──────────────────────────────────────────────────
  const opts = useMemo(() => {
    const dealers = new Set();
    const officers = new Set();
    const pengajuans = new Set();
    const brands = new Set();
    const wilayahs = new Set();

    data.forEach(r => {
      if (r.dealer) dealers.add(r.dealer);
      if (r.officer) officers.add(r.officer);
      if (r.pengajuan) pengajuans.add(r.pengajuan);
      if (r.brand) brands.add(r.brand);
      if (r.wilayah) wilayahs.add(r.wilayah);
    });

    return {
      dealers: [...dealers].sort(),
      officers: [...officers].sort(),
      pengajuans: [...pengajuans].sort(),
      brands: [...brands].sort(),
      wilayahs: [...wilayahs].sort(),
    };
  }, [data]);

  // ── Data Filtered by Dropdowns (Wilayah, Brand, Dealer, SO, etc.) ─────────
  const baseFilteredData = useMemo(() => {
    return data.filter(r => {
      if (filterWilayah && r.wilayah !== filterWilayah) return false;
      if (filterBrand && r.brand !== filterBrand) return false;
      if (filterDealer && r.dealer !== filterDealer) return false;
      if (filterOfficer && r.officer !== filterOfficer) return false;
      if (filterPengajuan && r.pengajuan !== filterPengajuan) return false;
      if (filterAcp && r.acp !== filterAcp) return false;
      if (searchNama && !String(r.nama || '').toLowerCase().includes(searchNama.toLowerCase())) return false;
      if (searchNoReg && !String(r.no_reg || '').toLowerCase().includes(searchNoReg.toLowerCase())) return false;
      return true;
    });
  }, [data, filterWilayah, filterBrand, filterDealer, filterOfficer, filterPengajuan, filterAcp, searchNama, searchNoReg]);

  // ── Data Filtered by Active Tab (Overall, IN, VALID, BACKLOG) ──────────────
  const tabFilteredData = useMemo(() => {
    if (activeTab === 'Overall') return baseFilteredData;
    return baseFilteredData.filter(r => r.source_type === activeTab);
  }, [baseFilteredData, activeTab]);

  // Pagination for Detail Table
  const totalPages = Math.max(1, Math.ceil(tabFilteredData.length / pageSize));
  const pagedData = tabFilteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setFilterWilayah(''); setFilterBrand('');
    setFilterDealer(''); setFilterOfficer(''); setFilterPengajuan('');
    setFilterAcp(''); setSearchNama(''); setSearchNoReg('');
    setCurrentPage(1);
  };

  const hasActiveFilters = filterWilayah || filterBrand || filterDealer
    || filterOfficer || filterPengajuan || filterAcp || searchNama || searchNoReg;

  // Dropdown style
  const selectStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    color: '#e2e8f0',
    padding: '0.5rem 0.7rem',
    fontSize: '1.1rem',
    outline: 'none',
    cursor: 'pointer',
    minWidth: 0,
    flex: '1 1 130px',
  };

  const inputStyle = {
    ...selectStyle,
    flex: '1 1 150px',
  };

  const sourceBadge = { IN: '#22d3ee', VALID: '#34d399', BACKLOG: '#fb923c' };

  // Theme color maps for tabs
  const tabColors = {
    Overall: { bg: 'linear-gradient(135deg, #6366f1, #4f46e5)', shadow: 'rgba(99,102,241,0.3)', text: '#ffffff' },
    IN: { bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', shadow: 'rgba(6,182,212,0.3)', text: '#ffffff' },
    VALID: { bg: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.3)', text: '#ffffff' },
    BACKLOG: { bg: 'linear-gradient(135deg, #f97316, #ea580c)', shadow: 'rgba(249,115,22,0.3)', text: '#ffffff' }
  };

  const dateRangeLabel = useMemo(() => {
    if (data.length === 0) return '';
    let minD = null;
    let maxD = null;
    data.forEach(r => {
      if (!r.tanggal) return;
      const d = new Date(r.tanggal);
      if (isNaN(d.getTime())) return;
      if (!minD || d < minD) minD = d;
      if (!maxD || d > maxD) maxD = d;
    });
    if (!minD || !maxD) return '';
    const opt = { day: '2-digit', month: 'short', year: 'numeric' };
    return `${minD.toLocaleDateString('id-ID', opt)} s/d ${maxD.toLocaleDateString('id-ID', opt)}`;
  }, [data]);

  return (
    <div className={`app-wrapper`}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="app-header glass-card" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          {dateRangeLabel && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#a78bfa',
              fontSize: '1.05rem',
              fontWeight: 800,
              padding: '0.35rem 0.9rem',
              borderRadius: '0.6rem',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.6rem'
            }}>
              📅 {dateRangeLabel}
            </div>
          )}
          <h1 className="text-gradient" style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
            Sales C1 — Dashboard
          </h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            {data.length > 0 ? `${data.length} record • ${data.filter(d => d.source_type === 'IN').length} IN · ${data.filter(d => d.source_type === 'VALID').length} VALID · ${data.filter(d => d.source_type === 'BACKLOG').length} BACKLOG` : 'Memuat data...'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={fetchSalesData} title="Reload data lokal">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setShowUploadModal(true)}>
            <Upload size={14} /> Upload Data
          </button>
        </div>
      </header>

      {/* ── 4 Tabs Navigation & Export ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          padding: '0.25rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '0.75rem',
          width: 'fit-content',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {['Overall', 'IN', 'VALID', 'BACKLOG'].map(tab => {
            const isActive = activeTab === tab;
            const theme = tabColors[tab];
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.5rem 1.6rem',
                  borderRadius: '0.6rem',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive ? theme.bg : 'transparent',
                  color: isActive ? theme.text : 'var(--text-secondary)',
                  boxShadow: isActive ? `0 4px 14px ${theme.shadow}` : 'none',
                  transform: isActive ? 'scale(1.02)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={exportToPDF}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.55rem 1.25rem',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Download size={18} />
          Unduh PDF
        </button>
      </div>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div id="pdf-kpi"><KpiCards data={baseFilteredData} activeTab={activeTab} /></div>

        {/* ── Filter Panel ──────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isFilterExpanded ? '0.85rem' : 0 }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <SlidersHorizontal size={18} style={{ color: 'var(--primary)' }} /> Filter & Pencarian
              {hasActiveFilters && (
                <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '9999px', fontSize: '0.65rem', padding: '0.1rem 0.45rem', fontWeight: 700 }}>
                  Aktif
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {hasActiveFilters && (
                <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <X size={12} /> Reset
                </button>
              )}
              <button onClick={() => setIsFilterExpanded(p => !p)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}>
                {isFilterExpanded ? '▲ Sembunyikan' : '▼ Tampilkan'}
              </button>
            </div>
          </div>

          {isFilterExpanded && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {/* Wilayah */}
              <select style={selectStyle} value={filterWilayah} onChange={e => { setFilterWilayah(e.target.value); setCurrentPage(1); }}>
                <option value="">Semua Kota</option>
                {opts.wilayahs.map(w => <option key={w} value={w}>{w}</option>)}
              </select>

              {/* Brand */}
              <select style={selectStyle} value={filterBrand} onChange={e => { setFilterBrand(e.target.value); setCurrentPage(1); }}>
                <option value="">Semua Merek</option>
                {opts.brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              {/* Dealer */}
              <select style={selectStyle} value={filterDealer} onChange={e => { setFilterDealer(e.target.value); setCurrentPage(1); }}>
                <option value="">Semua Dealer</option>
                {opts.dealers.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Officer */}
              <select style={selectStyle} value={filterOfficer} onChange={e => { setFilterOfficer(e.target.value); setCurrentPage(1); }}>
                <option value="">Semua Officer</option>
                {opts.officers.map(o => <option key={o} value={o}>{o.split(' ').slice(0, 3).join(' ')}</option>)}
              </select>

              {/* Pengajuan */}
              <select style={selectStyle} value={filterPengajuan} onChange={e => { setFilterPengajuan(e.target.value); setCurrentPage(1); }}>
                <option value="">Semua Pengajuan</option>
                {opts.pengajuans.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              {/* ACP */}
              <select style={selectStyle} value={filterAcp} onChange={e => { setFilterAcp(e.target.value); setCurrentPage(1); }}>
                <option value="">Semua ACP</option>
                <option value="ACP">ACP</option>
                <option value="NonACP">NonACP</option>
              </select>

            </div>
          )}
        </div>

        {/* ── Charts Row ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div id="pdf-trend"><TrendChart data={baseFilteredData} activeTab={activeTab} /></div>
          <div id="pdf-brand"><BrandChart data={baseFilteredData} sourceFilter={activeTab === 'Overall' ? 'ALL' : activeTab} /></div>
          <div id="pdf-composed"><DistributionComposedChart data={baseFilteredData} /></div>
        </div>

        {/* ── Performance Tables ────────────────────────────────────────── */}
        {/* PerformanceTables always shows overall funnel metrics (IN, VALID, BACKLOG, ACP) filtered by other fields */}
        <div id="pdf-performance"><PerformanceTables
          data={baseFilteredData}
          onDrillDown={setSelectedDrillDown}
          activeTabFilter={activeTab}
        /></div>

        {/* ── AI Insights ───────────────────────────────────────────────── */}
        <AiInsights data={baseFilteredData} activeTab={activeTab} />

        {/* ── Detail Table ──────────────────────────────────────────────── */}
        <div id="pdf-detail-table" className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Rincian Data — Tab {activeTab} ({tabFilteredData.length} record)
            </h3>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', padding: '0 0.5rem', whiteSpace: 'nowrap' }}>
                  {currentPage} / {totalPages}
                </span>
                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {activeTab === 'Overall' && ['Tanggal', 'Tipe', 'Nama', 'No. Reg', 'Dealer', 'Officer', 'Merek', 'Kota', 'Pengajuan', 'ACP'].map(col => <th key={col} style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{col}</th>)}
                  {activeTab === 'IN' && ['ID', 'No. Reg', 'Tgl', 'Nama', 'Dealer', 'Salesman', 'Officer', 'Merek', 'Nilai Princip', 'Status', 'Unit'].map(col => <th key={col} style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{col}</th>)}
                  {activeTab === 'VALID' && ['ID', 'No. Aggr', 'Kota Dealer', 'Merek', 'Pengajuan', 'Officer', 'Tgl GoLive', 'ACP'].map(col => <th key={col} style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{col}</th>)}
                  {activeTab === 'BACKLOG' && ['ID', 'No. Reg', 'Nama', 'Dealer', 'Pengajuan', 'Tenor', 'OTR', 'DP', 'PH', 'Merek', 'Tgl In', 'Officer'].map(col => <th key={col} style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={15} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Memuat data lokal...</td></tr>
                ) : pagedData.length === 0 ? (
                  <tr><td colSpan={15} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Tidak ada data sesuai filter</td></tr>
                ) : pagedData.map((item, i) => (
                  <tr key={item.id || i}
                    onClick={() => setSelectedDrillDown({ type: 'officer', name: item.officer })}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {activeTab === 'Overall' && (
                      <>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: `${sourceBadge[item.source_type]}22`, color: sourceBadge[item.source_type] || '#fff' }}>{item.source_type}</span></td>
                        <td style={{ padding: '0.4rem 0.5rem', fontWeight: 500, color: '#fff', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nama}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.7rem' }}>{item.no_reg || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.dealer}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(item.officer || '').split(' ').slice(0, 3).join(' ')}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.brand || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{item.wilayah || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{item.pengajuan || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', whiteSpace: 'nowrap' }}>{item.acp ? <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: item.acp === 'ACP' ? 'rgba(167,139,250,0.2)' : 'rgba(100,116,139,0.2)', color: item.acp === 'ACP' ? '#a78bfa' : '#94a3b8' }}>{item.acp}</span> : '-'}</td>
                      </>
                    )}
                    {activeTab === 'IN' && (
                      <>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.id || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.no_reg || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.nama}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.dealer}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.salesman || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.officer}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.merk || item.brand || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.nilai_princip ? item.nilai_princip.toLocaleString('id-ID') : '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.status || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.unit || '-'}</td>
                      </>
                    )}
                    {activeTab === 'VALID' && (
                      <>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.id || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.no_reg || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.kota_dealer || item.wilayah || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.merk || item.brand || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.pengajuan || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.officer}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.acp || '-'}</td>
                      </>
                    )}
                    {activeTab === 'BACKLOG' && (
                      <>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.id || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.no_reg || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.nama}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.dealer}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.pengajuan || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.tenor || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.otr ? item.otr.toLocaleString('id-ID') : '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.dp ? item.dp.toLocaleString('id-ID') : '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.ph ? item.ph.toLocaleString('id-ID') : '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.merk || item.brand || '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.officer}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


        </div>
      </main>

      {/* ── Modals & Drawers ──────────────────────────────────────────────── */}
      {showUploadModal && (
        <UploadSection
          onUploadSuccess={(newRecords) => {
            if (newRecords?.length > 0) setData(newRecords);
            else fetchSalesData();
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {selectedDrillDown && (
        <DrillDownDrawer
          selectedItem={selectedDrillDown}
          data={data}
          onClose={() => setSelectedDrillDown(null)}
        />
      )}
    </div>
  );
}
