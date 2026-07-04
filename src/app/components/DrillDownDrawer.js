'use client';

import { useMemo } from 'react';
import { X, Send, FileText, CheckSquare, AlertCircle, Building2, User, BadgeCheck } from 'lucide-react';

const BRAND_COLORS = {
  Toyota: '#ef4444',
  Daihatsu: '#3b82f6',
  Isuzu: '#22c55e',
  Mitsubishi: '#f59e0b',
  Honda: '#f97316',
  Suzuki: '#a855f7',
  Lainnya: '#64748b',
};

export default function DrillDownDrawer({ selectedItem, data, onClose }) {
  const { type, name } = selectedItem;

  // Filter data for this specific dealer or officer
  const entityData = useMemo(() => {
    return data.filter(d => {
      if (type === 'dealer') {
        return d.dealer === name;
      } else {
        return d.officer === name;
      }
    });
  }, [data, type, name]);

  // Calculations for this entity
  const stats = useMemo(() => {
    const totalIn = entityData.filter(d => d.source_type === 'IN').length;
    const totalValid = entityData.filter(d => d.source_type === 'VALID').length;
    const totalBacklog = entityData.filter(d => d.source_type === 'BACKLOG').length;
    
    const validData = entityData.filter(d => d.source_type === 'VALID');
    const acpCount = validData.filter(d => d.acp === 'ACP').length;
    const acpPct = totalValid > 0 ? Math.round((acpCount / totalValid) * 100) : 0;

    // Brand breakdown
    const brands = {};
    entityData.forEach(d => {
      const b = d.brand || 'Lainnya';
      brands[b] = (brands[b] || 0) + 1;
    });

    return { totalIn, totalValid, totalBacklog, acpCount, acpPct, brands };
  }, [entityData]);

  // Generate WhatsApp Share Message
  const handleWhatsAppShare = () => {
    const dateStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const message = `Halo Bapak/Ibu, berikut adalah update performa Sales C1 untuk *${name}* (${type === 'dealer' ? 'Dealer' : 'Officer'}) per ${dateStr}:

📥 *Aplikasi IN*: ${stats.totalIn}
✅ *Aplikasi VALID*: ${stats.totalValid}
⚠️ *Aplikasi BACKLOG*: ${stats.totalBacklog}
💜 *ACP*: ${stats.acpCount} (${stats.acpPct}%)

Mohon dukungannya untuk menindaklanjuti data *BACKLOG* agar dapat segera diproses menjadi *VALID*.

Terima kasih,
*Koordinator Sales ACC Tegal*`;

    const encodedText = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const pillStyle = (color) => ({
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.68rem',
    fontWeight: 700,
    background: color,
    color: '#fff',
  });

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {type === 'dealer' ? (
              <Building2 size={24} className="text-primary-theme" />
            ) : (
              <User size={24} className="text-primary-theme" />
            )}
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 700 }}>
                {name}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Drill-down Performa {type === 'dealer' ? 'Dealer' : 'Officer'}
              </span>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Individual KPIs */}
        <div>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
            KPI RINGKASAN
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="glass-card" style={{ padding: '0.85rem', borderLeft: '3px solid #22d3ee' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FileText size={12} style={{ color: '#22d3ee' }} /> IN
              </span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.25rem', color: '#22d3ee' }}>{stats.totalIn}</div>
            </div>
            <div className="glass-card" style={{ padding: '0.85rem', borderLeft: '3px solid #34d399' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckSquare size={12} style={{ color: '#34d399' }} /> VALID
              </span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.25rem', color: '#34d399' }}>{stats.totalValid}</div>
            </div>
            <div className="glass-card" style={{ padding: '0.85rem', borderLeft: '3px solid #fb923c' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertCircle size={12} style={{ color: '#fb923c' }} /> BACKLOG
              </span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.25rem', color: '#fb923c' }}>{stats.totalBacklog}</div>
            </div>
            <div className="glass-card" style={{ padding: '0.85rem', borderLeft: '3px solid #a78bfa' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <BadgeCheck size={12} style={{ color: '#a78bfa' }} /> ACP
              </span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.25rem', color: '#a78bfa' }}>
                {stats.acpCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(167,139,250,0.7)' }}>({stats.acpPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Breakdown */}
        <div>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
            DISTRIBUSI MEREK (BRAND)
          </h3>
          <div className="glass-card" style={{ padding: '1rem' }}>
            {Object.keys(stats.brands).length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tidak ada data merek.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {Object.entries(stats.brands)
                  .sort((a, b) => b[1] - a[1])
                  .map(([brandName, count]) => {
                    const barColor = BRAND_COLORS[brandName] || '#64748b';
                    const pct = entityData.length > 0 ? ((count / entityData.length) * 100).toFixed(0) : 0;

                    return (
                      <div key={brandName} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{brandName}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Case List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
            DAFTAR KONTRAK TERBARU ({entityData.length})
          </h3>
          <div className="responsive-table-container" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="data-table" style={{ minWidth: 'auto', tableLayout: 'auto', fontSize: '0.74rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Nama Customer</th>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Detail</th>
                  <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>Tipe</th>
                </tr>
              </thead>
              <tbody>
                {entityData.slice(0, 15).map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: '0.4rem 0.5rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.nama}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{item.no_reg || '-'}</div>
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <div style={{ color: '#fff', fontWeight: 500 }}>{item.brand}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{item.status || '-'}</div>
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                      <span className={`badge badge-${item.source_type.toLowerCase()}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                        {item.source_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button className="btn-wa" onClick={handleWhatsAppShare} style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem' }}>
            <Send size={14} />
            Bagikan via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
