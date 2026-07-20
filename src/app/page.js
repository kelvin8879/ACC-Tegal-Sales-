'use client';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload, RefreshCw, Search, ChevronLeft, ChevronRight, SlidersHorizontal, X, Download, LogOut, User, Database
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import KpiCards from './components/KpiCards';
import TrendChart from './components/TrendChart';
import BrandChart from './components/BrandChart';
import DistributionComposedChart from './components/DistributionComposedChart';
import PerformanceTables from './components/PerformanceTables';
import DrillDownDrawer from './components/DrillDownDrawer';
import AiInsights from './components/AiInsights';

export default function HomePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overall'); // Overall, IN, VALID, BACKLOG
  const [tableTab, setTableTab] = useState('Overall');
  const [user, setUser] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const authSession = sessionStorage.getItem('auth_session');
    if (!authSession) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(authSession));
      
      // Ping Supabase to check connection
      const checkConnection = async () => {
        try {
          const { error } = await supabase.from('coordinators').select('id').limit(1);
          if (!error) setDbConnected(true);
        } catch (e) {
          setDbConnected(false);
        }
      };
      checkConnection();
  }, [router]);

  const exportToPDF = async () => {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4 (297 x 210 mm)
    const pageWidth = 297;
    const pageHeight = 210;
    const padding = 10;

    const exportPage = async (elementIds, isFirstPage = false) => {
      if (!isFirstPage) pdf.addPage();
      pdf.setFillColor(15, 23, 42); 
      pdf.rect(0, 0, pageWidth, pageHeight, 'F'); 

      let currentY = padding;
      if (isFirstPage) {
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text(`Overview - Tab ${activeTab}`, padding, currentY + 5);
        currentY += 15;
      }

      // Render all canvases for this page
      const canvases = [];
      let total_h_mm = 0;
      const targetWidth = pageWidth - (padding * 2);

      for (const id of elementIds) {
        const el = document.getElementById(id);
        if (el) {
          const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0f172a' });
          const h_mm = (canvas.height * targetWidth) / canvas.width;
          canvases.push({ canvas, h_mm });
          total_h_mm += h_mm;
        }
      }

      // Calculate uniform scale so they fit the available page height
      const availableHeight = pageHeight - currentY - padding;
      let scale = 1;
      if (total_h_mm > availableHeight) {
        scale = availableHeight / total_h_mm;
      }

      // Draw them
      for (const item of canvases) {
        const imgData = item.canvas.toDataURL('image/png');
        const finalWidth = targetWidth * scale;
        const finalHeight = item.h_mm * scale;
        const xPos = padding + (targetWidth - finalWidth) / 2;

        pdf.addImage(imgData, 'PNG', xPos, currentY, finalWidth, finalHeight);
        currentY += finalHeight;
      }
    };

    // Show loading state or similar if needed...
    const originalBodyBg = document.body.style.background;
    
    try {
      // ── Halaman 1 ──
      await exportPage(['pdf-kpi', 'pdf-trend', 'pdf-composed'], true);
      
      // ── Halaman 2 ──
      await exportPage(['pdf-brand', 'pdf-performance'], false);
      
      // Tabel Rincian Data dihilangkan sesuai permintaan (2 lembar saja)

      pdf.save(`Overview_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Gagal mengekspor PDF');
    }
  };


  // Modals & Drawers
  // Modals & Drawers
  const [selectedDrillDown, setSelectedDrillDown] = useState(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // ── Filters State ──────────────────────────────────────────────────────────
  const [filterWilayah, setFilterWilayah] = useState(''); // Tegal / Pekalongan
  const [filterBrand, setFilterBrand] = useState('');     // Toyota / Daihatsu / Isuzu / etc.
  const [filterDealer, setFilterDealer] = useState('');
  const [filterOfficer, setFilterOfficer] = useState([]);
  const [isOfficerDropdownOpen, setIsOfficerDropdownOpen] = useState(false);
  const [filterAcp, setFilterAcp] = useState('');         // ACP / NonACP
  const [filterKondisi, setFilterKondisi] = useState(''); // New Car / Used Car
  const [searchNama, setSearchNama] = useState('');
  const [searchNoReg, setSearchNoReg] = useState('');

  // Table specific states
  const [inCurrentPage, setInCurrentPage] = useState(1);
  const [backlogCurrentPage, setBacklogCurrentPage] = useState(1);
  const [filterInStatus, setFilterInStatus] = useState([]);
  const [isFilterInStatusOpen, setIsFilterInStatusOpen] = useState(false);
  const [filterBacklogBrand, setFilterBacklogBrand] = useState([]);
  const [isFilterBacklogBrandOpen, setIsFilterBacklogBrandOpen] = useState(false);
  const [filterBacklogOfficer, setFilterBacklogOfficer] = useState([]);
  const [isFilterBacklogOfficerOpen, setIsFilterBacklogOfficerOpen] = useState(false);
  const pageSize = 15;

  const handleDeleteData = async () => {
    if (!confirm('AWAS! Apakah Anda yakin ingin menghapus SELURUH data penjualan dari Database?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('sales_data_v3').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw new Error(error.message);
      alert('Semua data berhasil dihapus!');
      setData([]);
    } catch (err) {
      alert('Gagal menghapus data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Load data on mount ──────────────────────────────────────────────────────

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const { data: dbData, error } = await supabase.from('sales_data_v3').select('*');
      
      if (error) throw new Error(error.message);
      
      setData(dbData || []);
    } catch (err) {
      console.error('Failed to load from Supabase:', err.message);
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
    const brands = new Set();
    const wilayahs = new Set();
    const inStatuses = new Set();

    data.forEach(r => {
      if (r.dealer) dealers.add(r.dealer);
      if (r.officer) officers.add(r.officer);
      if (r.brand) brands.add(r.brand);
      if (r.wilayah) wilayahs.add(r.wilayah);
      if (r.source_type === 'IN' && r.status) inStatuses.add(r.status);
    });

    return {
      dealers: [...dealers].sort(),
      officers: [...officers].sort(),
      brands: [...brands].sort(),
      wilayahs: [...wilayahs].sort(),
      inStatuses: [...inStatuses].sort(),
    };
  }, [data]);

  // ── Data Filtered by Dropdowns (Wilayah, Brand, Dealer, SO, etc.) ─────────
  const baseFilteredData = useMemo(() => {
    return data.filter(r => {
      if (filterWilayah && r.wilayah !== filterWilayah) return false;
      if (filterBrand && r.brand !== filterBrand) return false;
      if (filterDealer && r.dealer !== filterDealer) return false;
      if (filterOfficer.length > 0 && !filterOfficer.includes(r.officer)) return false;
      if (filterAcp && r.acp !== filterAcp) return false;
      if (filterKondisi && r.segment !== filterKondisi) return false;
      if (searchNama && !String(r.nama || '').toLowerCase().includes(searchNama.toLowerCase())) return false;
      if (searchNoReg && !String(r.no_reg || '').toLowerCase().includes(searchNoReg.toLowerCase())) return false;
      return true;
    });
  }, [data, filterWilayah, filterBrand, filterDealer, filterOfficer, filterAcp, filterKondisi, searchNama, searchNoReg]);

    const localOpts = useMemo(() => {
    const brands = new Set();
    const officers = new Set();
    const inStatuses = new Set();
    baseFilteredData.forEach(r => {
      if (r.brand && r.source_type === 'BACKLOG') brands.add(r.brand);
      if (r.officer && r.source_type === 'BACKLOG') officers.add(r.officer);
      if (r.status && r.source_type === 'IN') inStatuses.add(r.status);
    });
    return {
      brands: [...brands].sort(),
      officers: [...officers].sort(),
      inStatuses: [...inStatuses].sort(),
    };
  }, [baseFilteredData]);

  // ── Separate Table Data ──────────────
  const inTableData = useMemo(() => {
    return baseFilteredData.filter(r => {
      if (r.source_type !== 'IN') return false;
      if (filterInStatus.length > 0 && !filterInStatus.includes(r.status)) return false;
      return true;
    });
  }, [baseFilteredData, filterInStatus]);

  const backlogTableData = useMemo(() => {
    return baseFilteredData.filter(r => {
      if (r.source_type !== 'BACKLOG') return false;
      if (filterBacklogBrand.length > 0 && !filterBacklogBrand.includes(r.brand)) return false;
      if (filterBacklogOfficer.length > 0 && !filterBacklogOfficer.includes(r.officer)) return false;
      return true;
    });
  }, [baseFilteredData, filterBacklogBrand, filterBacklogOfficer]);

  // Pagination
  const inTotalPages = Math.max(1, Math.ceil(inTableData.length / pageSize));
  const inPagedData = inTableData.slice((inCurrentPage - 1) * pageSize, inCurrentPage * pageSize);

  
  const backlogTotalPH = useMemo(() => {
    return backlogTableData.reduce((sum, item) => sum + (Number(item.excel_id) || 0), 0);
  }, [backlogTableData]);

  const backlogTotalPages = Math.max(1, Math.ceil(backlogTableData.length / pageSize));
  const backlogPagedData = backlogTableData.slice((backlogCurrentPage - 1) * pageSize, backlogCurrentPage * pageSize);

  const resetFilters = () => {
    setFilterWilayah(''); setFilterBrand('');
    setFilterDealer(''); setFilterOfficer([]);
    setFilterAcp(''); setFilterKondisi(''); setSearchNama(''); setSearchNoReg('');
    setFilterInStatus([]); setFilterBacklogBrand([]); setFilterBacklogOfficer([]);
    setInCurrentPage(1);
    setBacklogCurrentPage(1);
  };

  const hasActiveFilters = filterWilayah || filterBrand || filterDealer
    || filterOfficer.length > 0 || filterAcp || filterKondisi || searchNama || searchNoReg;

  // Dropdown style
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  const MultiSelectDropdown = ({ title, options, selected, onChange, isOpen, setIsOpen }) => {
    const wrapperRef = useRef(null);
    useEffect(() => {
      function handleClickOutside(event) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [wrapperRef, setIsOpen]);

    return (
      <div ref={wrapperRef} style={{ position: 'relative', minWidth: '150px' }}>
        <div 
          style={{...selectStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none'}}
          onClick={() => setIsOpen(prev => !prev)}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected.length === 0 ? title : `${selected.length} Dipilih`}
          </span>
          <span>▼</span>
        </div>
        {isOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.25rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', maxHeight: '200px', overflowY: 'auto', zIndex: 50, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.02)' }}>
              <input 
                type="checkbox" 
                checked={selected.length === 0} 
                onChange={() => { onChange([]); setIsOpen(false); }}
              />
              Semua
            </label>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />
            {options.map(o => (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.02)' }}>
                <input 
                  type="checkbox" 
                  checked={selected.includes(o)} 
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selected, o]);
                    else onChange(selected.filter(v => v !== o));
                  }}
                />
                {String(o).split(' ').slice(0, 3).join(' ')}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const selectStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    color: '#e2e8f0',
    padding: '0.4rem 0.6rem',
    fontSize: '0.85rem',
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

  if (!user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Memeriksa Akses...</div>;
  }

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
          
          {/* Status Database & User (Dipindah ke Kiri) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.6rem', background: dbConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${dbConnected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '999px' }}>
              <Database size={12} style={{ color: dbConnected ? '#34d399' : '#f87171' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: dbConnected ? '#34d399' : '#f87171' }}>
                {dbConnected ? 'Terhubung (Supabase)' : 'Koneksi Terputus'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <User size={13} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{user.email}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-end', justifyContent: 'center' }}>
          
          {/* Tombol Aksi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
              onClick={fetchSalesData} title="Reload data dari Supabase">
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = 'scale(1)'; }}
              onClick={() => router.push('/upload')}>
              <Upload size={16} /> Upload Data
            </button>
            <button className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
              onClick={handleDeleteData}>
              <X size={16} /> Hapus Data
            </button>
          </div>
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

              {/* Officer Multi-Select */}
              <div style={{ flex: '1 1 130px' }}>
                <MultiSelectDropdown 
                  title="Semua Officer"
                  options={opts.officers}
                  selected={filterOfficer}
                  onChange={val => { setFilterOfficer(val); setCurrentPage(1); setInCurrentPage(1); setBacklogCurrentPage(1); }}
                  isOpen={isOfficerDropdownOpen}
                  setIsOpen={setIsOfficerDropdownOpen}
                />
              </div>
              {/* Kondisi Kendaraan (New/Used) */}
              <select style={selectStyle} value={filterKondisi} onChange={e => { setFilterKondisi(e.target.value); setCurrentPage(1); }}>
                <option value="">Semua Kondisi</option>
                <option value="New Car">New Car</option>
                <option value="Used Car">Used Car</option>
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

        {/* ── Detail Tables ─────────────────────────────────────────────── */}
        <div id="pdf-detail-table" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* TABLE IN */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Rincian Data KHUSUS IN ({inTableData.length} record)
                </h3>
                <MultiSelectDropdown 
                  title="Semua Status"
                  options={localOpts.inStatuses}
                  selected={filterInStatus}
                  onChange={val => { setFilterInStatus(val); setInCurrentPage(1); }}
                  isOpen={isFilterInStatusOpen}
                  setIsOpen={setIsFilterInStatusOpen}
                />
              </div>
              {inTotalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setInCurrentPage(p => Math.max(p - 1, 1))} disabled={inCurrentPage === 1}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', padding: '0 0.5rem', whiteSpace: 'nowrap' }}>
                    {inCurrentPage} / {inTotalPages}
                  </span>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setInCurrentPage(p => Math.min(p + 1, inTotalPages))} disabled={inCurrentPage === inTotalPages}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['No. Reg', 'Tgl', 'Nama', 'Dealer', 'Officer', 'Merek', 'Status'].map(col => <th key={col} style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Memuat data lokal...</td></tr>
                  ) : inPagedData.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Tidak ada data IN sesuai filter</td></tr>
                  ) : inPagedData.map((item, i) => (
                    <tr key={item.id || i}
                      onClick={() => setSelectedDrillDown({ type: 'officer', name: item.officer })}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.no_reg?.toString() || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{formatDate(item.tanggal)}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.nama?.split(' ')[0] || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.dealer}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.officer}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.merk || item.brand || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE BACKLOG */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Rincian Data KHUSUS BACKLOG
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <MultiSelectDropdown 
                    title="Semua Merek"
                    options={localOpts.brands}
                    selected={filterBacklogBrand}
                    onChange={val => { setFilterBacklogBrand(val); setBacklogCurrentPage(1); }}
                    isOpen={isFilterBacklogBrandOpen}
                    setIsOpen={setIsFilterBacklogBrandOpen}
                  />
                  <MultiSelectDropdown 
                    title="Semua Officer"
                    options={localOpts.officers}
                    selected={filterBacklogOfficer}
                    onChange={val => { setFilterBacklogOfficer(val); setBacklogCurrentPage(1); }}
                    isOpen={isFilterBacklogOfficerOpen}
                    setIsOpen={setIsFilterBacklogOfficerOpen}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1.1rem', color: '#facc15', fontWeight: 800, background: 'rgba(250, 204, 21, 0.1)', padding: '0.4rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(250, 204, 21, 0.2)', marginLeft: 'auto' }}>
                  <span>Unit: {backlogTableData.length}</span>
                  <span>PH: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(backlogTotalPH)}</span>
                </div>
              </div>
              {backlogTotalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setBacklogCurrentPage(p => Math.max(p - 1, 1))} disabled={backlogCurrentPage === 1}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', padding: '0 0.5rem', whiteSpace: 'nowrap' }}>
                    {backlogCurrentPage} / {backlogTotalPages}
                  </span>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setBacklogCurrentPage(p => Math.min(p + 1, backlogTotalPages))} disabled={backlogCurrentPage === backlogTotalPages}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['No. Reg', 'Nama', 'Dealer', 'Pengajuan', 'Merek', 'PH', 'Officer'].map(col => <th key={col} style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Memuat data lokal...</td></tr>
                  ) : backlogPagedData.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Tidak ada data BACKLOG sesuai filter</td></tr>
                  ) : backlogPagedData.map((item, i) => (
                    <tr key={item.id || i}
                      onClick={() => setSelectedDrillDown({ type: 'officer', name: item.officer })}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.no_reg?.toString() || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.nama?.split(' ')[0] || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.dealer}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.pengajuan || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.merk || item.brand || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: '#a78bfa', fontWeight: 600 }}>
                        {item.excel_id ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(item.excel_id) || 0) : '-'}
                      </td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.officer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
</main>

      {/* ── Modals & Drawers ──────────────────────────────────────────────── */}

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
