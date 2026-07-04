'use client';

import { FileText, CheckSquare, AlertCircle, Award, BadgeCheck } from 'lucide-react';

export default function KpiCards({ data, activeTab = 'Overall' }) {
  const inData = data.filter(d => d.source_type === 'IN');
  const validData = data.filter(d => d.source_type === 'VALID');
  const backlogData = data.filter(d => d.source_type === 'BACKLOG');

  const totalIn = inData.length;
  const totalValid = validData.length;
  const totalBacklog = backlogData.length;

  const acpCount = validData.filter(d => d.acp === 'ACP').length;
  const acpPct = totalValid > 0 ? Math.round((acpCount / totalValid) * 100) : 0;

  // Determine which data to use for the Top metrics.
  // User request: "kalau overview benar valid aja", "kalau di IN ... in terbanyak"
  const topSourceType = activeTab === 'Overall' ? 'VALID' : activeTab;
  const topData = data.filter(d => d.source_type === topSourceType);

  const topOfficer = topEntity(topData, 'officer');
  const topDealer = topEntity(topData, 'dealer');

  const unitLabel = topSourceType === 'IN' ? 'IN' : topSourceType === 'VALID' ? 'Valid' : 'Backlog';

  return (
    <div className="stats-grid animate-fade-in">
      {/* Total IN */}
      <div className="glass-card stat-card" style={{ '--stat-theme-color': '#22d3ee' }}>
        <label><FileText size={15} style={{ color: '#22d3ee' }} /> TOTAL IN</label>
        <div className="stat-val" style={{ color: '#22d3ee' }}>{totalIn}</div>
        <div className="stat-desc">Aplikasi masuk C1</div>
      </div>

      {/* Total VALID */}
      <div className="glass-card stat-card" style={{ '--stat-theme-color': '#34d399' }}>
        <label><CheckSquare size={15} style={{ color: '#34d399' }} /> TOTAL VALID</label>
        <div className="stat-val" style={{ color: '#34d399' }}>{totalValid}</div>
        <div className="stat-desc">Aplikasi Go Live</div>
      </div>

      {/* Total BACKLOG */}
      <div className="glass-card stat-card" style={{ '--stat-theme-color': '#fb923c' }}>
        <label><AlertCircle size={15} style={{ color: '#fb923c' }} /> TOTAL BACKLOG</label>
        <div className="stat-val" style={{ color: '#fb923c' }}>{totalBacklog}</div>
        <div className="stat-desc">Pending / belum Go Live</div>
      </div>

      {/* ACP Count + % */}
      <div className="glass-card stat-card" style={{ '--stat-theme-color': '#a78bfa' }}>
        <label><BadgeCheck size={15} style={{ color: '#a78bfa' }} /> ACP</label>
        <div className="stat-val" style={{ color: '#a78bfa' }}>
          {acpCount}
          <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '0.5rem', color: 'rgba(167,139,250,0.7)' }}>
            ({acpPct}%)
          </span>
        </div>
        <div className="stat-desc">ACP dari {totalValid} Valid — NonACP: {totalValid - acpCount}</div>
      </div>

      {/* Top Officer */}
      <div className="glass-card stat-card" style={{ '--stat-theme-color': '#f472b6' }}>
        <label><Award size={15} style={{ color: '#f472b6' }} /> TOP OFFICER</label>
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {topOfficer.name ? topOfficer.name.split(' ').slice(0, 3).join(' ') : '-'}
          </div>
          {topOfficer.count > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#f472b6', marginTop: '0.2rem' }}>
              {topOfficer.count} {unitLabel}
            </div>
          )}
        </div>
        <div className="stat-desc">Officer dengan {unitLabel} terbanyak</div>
      </div>

      {/* Top Dealer */}
      <div className="glass-card stat-card" style={{ '--stat-theme-color': '#fbbf24' }}>
        <label><Award size={15} style={{ color: '#fbbf24' }} /> TOP DEALER</label>
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {topDealer.name || '-'}
          </div>
          {topDealer.count > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: '0.2rem' }}>
              {topDealer.count} {unitLabel}
            </div>
          )}
        </div>
        <div className="stat-desc">Dealer dengan {unitLabel} terbanyak</div>
      </div>
    </div>
  );
}

function topEntity(data, field) {
  if (!data.length) return { name: '-', count: 0 };
  const counts = {};
  for (const row of data) {
    const v = row[field];
    if (v) counts[v] = (counts[v] || 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? { name: top[0], count: top[1] } : { name: '-', count: 0 };
}
