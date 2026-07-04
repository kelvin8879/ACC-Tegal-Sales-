'use client';

import { useMemo, useState } from 'react';

export default function DistributionComposedChart({ data }) {
  const [groupBy, setGroupBy] = useState('wilayah'); // 'wilayah', 'officer', 'dealer'

  // Process data for the custom visualization
  const itemsData = useMemo(() => {
    const map = new Map();

    data.forEach(row => {
      let key = '';
      if (groupBy === 'wilayah') key = row.wilayah || 'Lainnya';
      else if (groupBy === 'officer') key = row.officer || 'Unknown';
      else key = row.dealer || 'Unknown';

      if (!map.has(key)) {
        map.set(key, { name: key, IN: 0, VALID: 0, BACKLOG: 0, total: 0 });
      }

      const entry = map.get(key);
      if (row.source_type === 'IN') entry.IN++;
      else if (row.source_type === 'VALID') entry.VALID++;
      else if (row.source_type === 'BACKLOG') entry.BACKLOG++;
      entry.total++;
    });

    const list = [...map.values()].sort((a, b) => b.total - a.total);
    // Limit to top 10 for dealer, show all for wilayah and officer
    return groupBy === 'dealer' ? list.slice(0, 10) : list;
  }, [data, groupBy]);

  const selectStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '0.4rem 0.8rem',
    borderRadius: '0.5rem',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
    fontWeight: 600,
  };

  const getCleanName = (name) => {
    if (groupBy === 'officer') {
      return name.split(' ').slice(0, 2).join(' '); // Max 2 words for SO
    }
    if (groupBy === 'dealer') {
      const n = name.toUpperCase();
      if (n.includes('NASMOCO')) return 'Nasmoco TGL';
      if (n.includes('CHANDRA')) return 'Chandra PKL';
      if (n.includes('AI DSO-TGL') || (n.includes('DSO') && n.includes('TGL'))) return 'Daihatsu TGL';
      if (n.includes('AI DSO-PKL') || (n.includes('DSO') && n.includes('PKL'))) return 'Daihatsu PKL';
      if (n.includes('AI ISO') || n.includes('ISO')) return 'Isuzu PKL';
      if (n.includes('ZIRANG')) return 'Zirang TGL';
      if (n.includes('CARBAY')) return 'Carbay JKT';
      if (n.includes('AUTOMOBIL')) return 'AJM TGL';
      if (n.includes('DOVA')) return 'Dova TGL';
      if (n.includes('GEDONG')) return 'Gedong Jembar';
    }
    return name;
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Distribusi Status Penjualan (IN, VALID, BACKLOG)
          </h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Perbandingan detail status tiap {groupBy === 'wilayah' ? 'Cabang / Kota' : groupBy === 'officer' ? 'SO (Officer)' : 'Dealer'}
          </p>
        </div>

        <div>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={selectStyle}>
            <option value="wilayah" style={{ color: '#000' }}>Berdasarkan Cabang / Kota</option>
            <option value="officer" style={{ color: '#000' }}>Berdasarkan SO (Officer)</option>
            <option value="dealer" style={{ color: '#000' }}>Berdasarkan Dealer (Top 10)</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(() => {
          const maxTotal = itemsData.length > 0 ? Math.max(...itemsData.map(i => i.total)) : 0;
          return itemsData.map((item, idx) => {
            const pctIn = item.total ? (item.IN / item.total) * 100 : 0;
            const pctValid = item.total ? (item.VALID / item.total) * 100 : 0;
            const pctBacklog = item.total ? (item.BACKLOG / item.total) * 100 : 0;
            const barWidthPct = maxTotal > 0 ? (item.total / maxTotal) * 100 : 100;

            return (
            <div 
              key={item.name} 
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '0.75rem',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Row Label */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '0.25rem',
                    minWidth: '1.6rem',
                    textAlign: 'center'
                  }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                    {getCleanName(item.name)}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Total: <strong style={{ color: '#fff' }}>{item.total}</strong> unit
                </span>
              </div>

              {/* Progress Segment Bar */}
              <div style={{
                height: '8px',
                width: `${barWidthPct}%`,
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                overflow: 'hidden',
              }}>
                {item.IN > 0 && (
                  <div 
                    style={{ 
                      width: `${pctIn}%`, 
                      background: '#3b82f6', 
                      height: '100%' 
                    }} 
                    title={`IN: ${item.IN} unit (${pctIn.toFixed(1)}%)`}
                  />
                )}
                {item.VALID > 0 && (
                  <div 
                    style={{ 
                      width: `${pctValid}%`, 
                      background: '#22c55e', 
                      height: '100%' 
                    }} 
                    title={`VALID: ${item.VALID} unit (${pctValid.toFixed(1)}%)`}
                  />
                )}
                {item.BACKLOG > 0 && (
                  <div 
                    style={{ 
                      width: `${pctBacklog}%`, 
                      background: '#ef4444', 
                      height: '100%' 
                    }} 
                    title={`BACKLOG: ${item.BACKLOG} unit (${pctBacklog.toFixed(1)}%)`}
                  />
                )}
              </div>

              {/* Status Breakdowns */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.95rem' }}>
                <span style={{ color: '#3b82f6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                  IN: {item.IN} unit
                </span>
                <span style={{ color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  VALID: {item.VALID} unit
                </span>
                <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  BACKLOG: {item.BACKLOG} unit
                </span>
              </div>
            </div>
          );
          });
        })()}
      </div>
    </div>
  );
}
