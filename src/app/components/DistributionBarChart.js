'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SOURCE_COLORS = {
  IN: '#22d3ee',
  VALID: '#34d399',
  BACKLOG: '#fb923c',
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + p.value, 0);
  return (
    <div style={{
      background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '0.6rem', padding: '0.6rem 1rem', fontSize: '0.8rem', color: '#fff', zIndex: 1000
    }}>
      <p style={{ margin: '0 0 0.4rem 0', fontWeight: 700, color: '#fff' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', margin: '0.1rem 0' }}>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.name}:</span>
          <span>{p.value} unit</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.4rem', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
        <span>Total:</span>
        <span>{total} unit</span>
      </div>
    </div>
  );
};

export default function DistributionBarChart({ data }) {
  const [groupBy, setGroupBy] = useState('dealer'); // 'dealer' or 'officer'

  const chartData = useMemo(() => {
    const map = new Map();
    
    data.forEach(row => {
      const key = groupBy === 'dealer' ? row.dealer : row.officer;
      if (!key) return;
      
      if (!map.has(key)) {
        map.set(key, { name: key, IN: 0, VALID: 0, BACKLOG: 0, total: 0 });
      }
      
      const entry = map.get(key);
      if (row.source_type === 'IN') entry.IN++;
      else if (row.source_type === 'VALID') entry.VALID++;
      else if (row.source_type === 'BACKLOG') entry.BACKLOG++;
      entry.total++;
    });

    const sorted = [...map.values()].sort((a, b) => b.total - a.total);
    
    return sorted.slice(0, 8).map(item => ({
      ...item,
      name: groupBy === 'officer' ? item.name.split(' ').slice(0, 2).join(' ') : item.name
    }));
  }, [data, groupBy]);

  const totalUnits = chartData.reduce((a, b) => a + b.total, 0);

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select 
            value={groupBy} 
            onChange={e => setGroupBy(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.85rem', outline: 'none' }}
          >
            <option value="dealer" style={{ color: '#000' }}>Distribusi Status per Dealer (Bar Chart)</option>
            <option value="officer" style={{ color: '#000' }}>Distribusi Status per SO (Bar Chart)</option>
          </select>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Top 8 — {totalUnits} unit</span>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255, 255, 255, 0.15)"
                tick={{ fill: '#94a3b8', fontSize: 9 }}
                angle={-15}
                textAnchor="end"
                interval={0}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.15)"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }}
              />
              <Bar name="IN" dataKey="IN" stackId="statusStack" fill={SOURCE_COLORS.IN} />
              <Bar name="VALID" dataKey="VALID" stackId="statusStack" fill={SOURCE_COLORS.VALID} />
              <Bar name="BACKLOG" dataKey="BACKLOG" stackId="statusStack" fill={SOURCE_COLORS.BACKLOG} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tidak ada data</p>
          </div>
        )}
      </div>
    </div>
  );
}
