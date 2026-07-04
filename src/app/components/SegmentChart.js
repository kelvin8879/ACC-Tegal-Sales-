'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="chart-tooltip" style={{ minWidth: '140px' }}>
        <p className="tooltip-title" style={{ color: dataPoint.color }}>{dataPoint.name}</p>
        <div className="tooltip-item">
          <span style={{ color: '#94a3b8' }}>Volume:</span>
          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{dataPoint.value}</span>
        </div>
        <div className="tooltip-item">
          <span style={{ color: '#94a3b8' }}>Persentase:</span>
          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{dataPoint.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function SegmentChart({ data, activeTab }) {
  // Aggregate segment data
  const segmentData = useMemo(() => {
    const counts = {};
    let total = 0;

    // Filter by active tab (or use all if Overall)
    const filtered = activeTab === 'Overall' 
      ? data 
      : data.filter(d => d.source_type === activeTab);

    filtered.forEach(item => {
      const seg = item.segment || 'Bronze';
      counts[seg] = (counts[seg] || 0) + 1;
      total++;
    });

    // Color palette matching the glassmorphism theme
    const colors = {
      Bronze: '#d97706',    // Amber
      Flexi: '#06b6d4',     // Cyan
      Gold: '#fbbf24',      // Yellow Gold
      Platinum: '#a855f7',  // Purple
      Solitaire: '#10b981', // Emerald
      Other: '#6b7280',     // Gray
    };

    return Object.keys(counts).map(name => ({
      name,
      value: counts[name],
      color: colors[name] || colors.Other,
      percentage: total > 0 ? ((counts[name] / total) * 100).toFixed(1) : 0
    })).sort((a, b) => b.value - a.value);
  }, [data, activeTab]);

  const totalCount = useMemo(() => {
    return segmentData.reduce((sum, item) => sum + item.value, 0);
  }, [segmentData]);



  if (totalCount === 0) {
    return (
      <div className="glass-card" style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Belum ada data segmen untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1.25rem', paddingLeft: '0.25rem' }}>
        Distribusi Segmen Customer
      </h3>

      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
        {/* Total Count in the center of Doughnut */}
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 5
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            Total
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
            {totalCount}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Aplikasi
          </span>
        </div>

        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive={false}
              >
                {segmentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="rgba(15, 23, 42, 0.5)"
                    strokeWidth={2}
                    style={{
                      filter: `drop-shadow(0px 0px 4px ${entry.color}33)`,
                      outline: 'none',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Custom Legend to show names, volumes and percentages */}
      <div style={{
        marginTop: '1rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem 1rem',
        padding: '0 0.5rem'
      }}>
        {segmentData.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  display: 'inline-block',
                  boxShadow: `0 0 6px ${item.color}`
                }}
              />
              <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{item.name}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600, color: '#f8fafc', marginRight: '4px' }}>{item.value}</span>
              <span style={{ fontSize: '0.7rem' }}>({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
