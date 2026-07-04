'use client';

import { useMemo, useState } from 'react';

const TABS = ['Officer', 'Dealer'];

export default function PerformanceTables({ data, onDrillDown, activeTabFilter = 'Overall' }) {
  const [activeTab, setActiveTab] = useState('Officer');

  // ── Per-Officer stats ─────────────────────────────────────────────────────
  const officerStats = useMemo(() => {
    const map = new Map();
    for (const row of data) {
      const key = row.officer || 'Unknown';
      if (!map.has(key)) map.set(key, { name: key, IN: 0, VALID: 0, BACKLOG: 0, ACP: 0, NonACP: 0 });
      const s = map.get(key);
      if (row.source_type === 'IN') s.IN++;
      else if (row.source_type === 'VALID') {
        s.VALID++;
        if (row.acp === 'ACP') s.ACP++;
        else s.NonACP++;
      } else if (row.source_type === 'BACKLOG') s.BACKLOG++;
    }
    return [...map.values()].sort((a, b) => {
      if (activeTabFilter === 'IN') return b.IN - a.IN;
      if (activeTabFilter === 'BACKLOG') return b.BACKLOG - a.BACKLOG;
      return b.VALID - a.VALID;
    });
  }, [data, activeTabFilter]);

  // ── Per-Dealer stats ──────────────────────────────────────────────────────
  const dealerStats = useMemo(() => {
    const map = new Map();
    for (const row of data) {
      const key = row.dealer || 'Unknown';
      if (!map.has(key)) map.set(key, { name: key, brand: row.brand || '-', wilayah: row.wilayah || '-', IN: 0, VALID: 0, BACKLOG: 0, ACP: 0, NonACP: 0 });
      const s = map.get(key);
      if (row.source_type === 'IN') s.IN++;
      else if (row.source_type === 'VALID') {
        s.VALID++;
        if (row.acp === 'ACP') s.ACP++;
        else s.NonACP++;
      } else if (row.source_type === 'BACKLOG') s.BACKLOG++;
    }
    return [...map.values()].sort((a, b) => {
      if (activeTabFilter === 'IN') return b.IN - a.IN;
      if (activeTabFilter === 'BACKLOG') return b.BACKLOG - a.BACKLOG;
      return b.VALID - a.VALID;
    });
  }, [data, activeTabFilter]);

  const stats = activeTab === 'Officer' ? officerStats : dealerStats;

  const acpPct = (s) => {
    if (!s.VALID) return '-';
    return Math.round((s.ACP / s.VALID) * 100) + '%';
  };

  const tabStyle = (t) => ({
    padding: '0.4rem 1.1rem',
    borderRadius: '0.5rem',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: activeTab === t ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
    color: activeTab === t ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  });

  const pillStyle = (color) => ({
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.7rem',
    fontWeight: 700,
    background: color,
    color: '#fff',
    minWidth: '2.2rem',
    textAlign: 'center',
  });

  return (
    <div className="glass-card" style={{ padding: '1.25rem', height: '100%' }}>
      {/* Header + Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          Performa {activeTab}
        </h3>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {TABS.map(t => (
            <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {activeTab === 'Officer' ? 'Nama Officer' : 'Nama Dealer'}
              </th>
              {activeTab === 'Dealer' && (
                <>
                  <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Brand</th>
                  <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Kota</th>
                </>
              )}
              <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: '#22d3ee', fontWeight: 600 }}>IN</th>
              <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: '#34d399', fontWeight: 600 }}>VALID</th>
              <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: '#fb923c', fontWeight: 600 }}>BACKLOG</th>
              <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: '#a78bfa', fontWeight: 600 }}>ACP</th>
              <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: '#a78bfa', fontWeight: 600 }}>%ACP</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr>
                <td colSpan={activeTab === 'Dealer' ? 8 : 6}
                  style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Belum ada data
                </td>
              </tr>
            ) : (
              stats.map((s, i) => (
                <tr key={s.name}
                  onClick={() => onDrillDown?.({ type: activeTab.toLowerCase(), name: s.name })}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.5rem 0.5rem', color: '#fff', fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: '0.4rem', fontSize: '0.7rem' }}>#{i + 1}</span>
                    {activeTab === 'Officer' ? s.name.split(' ').slice(0, 3).join(' ') : s.name}
                  </td>
                  {activeTab === 'Dealer' && (
                    <>
                      <td style={{ textAlign: 'center', padding: '0.5rem 0.5rem' }}>
                        <span style={pillStyle(brandColor(s.brand))}>{s.brand}</span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.5rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{s.wilayah}</td>
                    </>
                  )}
                  <td style={{ textAlign: 'center', padding: '0.5rem 0.5rem' }}>
                    <span style={pillStyle('rgba(34,211,238,0.2)')}><span style={{ color: '#22d3ee' }}>{s.IN}</span></span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.5rem 0.5rem' }}>
                    <span style={pillStyle('rgba(52,211,153,0.2)')}><span style={{ color: '#34d399' }}>{s.VALID}</span></span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.5rem 0.5rem' }}>
                    <span style={pillStyle('rgba(251,146,60,0.2)')}><span style={{ color: '#fb923c' }}>{s.BACKLOG}</span></span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.5rem 0.5rem' }}>
                    <span style={pillStyle('rgba(167,139,250,0.2)')}><span style={{ color: '#a78bfa' }}>{s.ACP}</span></span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.5rem 0.5rem' }}>
                    <span style={{ color: '#a78bfa', fontWeight: 700 }}>{acpPct(s)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {/* Totals row */}
          {stats.length > 0 && (() => {
            const totals = stats.reduce((acc, s) => ({
              IN: acc.IN + s.IN, VALID: acc.VALID + s.VALID, BACKLOG: acc.BACKLOG + s.BACKLOG, ACP: acc.ACP + s.ACP
            }), { IN: 0, VALID: 0, BACKLOG: 0, ACP: 0 });
            const pct = totals.VALID ? Math.round((totals.ACP / totals.VALID) * 100) + '%' : '-';
            return (
              <tfoot>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)' }}>
                  <td colSpan={activeTab === 'Dealer' ? 3 : 1} style={{ padding: '0.5rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem' }}>TOTAL</td>
                  <td style={{ textAlign: 'center', padding: '0.5rem', color: '#22d3ee', fontWeight: 700 }}>{totals.IN}</td>
                  <td style={{ textAlign: 'center', padding: '0.5rem', color: '#34d399', fontWeight: 700 }}>{totals.VALID}</td>
                  <td style={{ textAlign: 'center', padding: '0.5rem', color: '#fb923c', fontWeight: 700 }}>{totals.BACKLOG}</td>
                  <td style={{ textAlign: 'center', padding: '0.5rem', color: '#a78bfa', fontWeight: 700 }}>{totals.ACP}</td>
                  <td style={{ textAlign: 'center', padding: '0.5rem', color: '#a78bfa', fontWeight: 700 }}>{pct}</td>
                </tr>
              </tfoot>
            );
          })()}
        </table>
      </div>
    </div>
  );
}

function brandColor(brand) {
  const map = {
    Toyota: '#e53e3e',
    Daihatsu: '#3182ce',
    Isuzu: '#38a169',
    Mitsubishi: '#d69e2e',
    Honda: '#dd6b20',
    Suzuki: '#805ad5',
  };
  return map[brand] || '#718096';
}
