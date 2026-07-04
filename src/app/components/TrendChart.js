'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Custom Glassmorphic Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dateFormatted = new Date(label).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="chart-tooltip">
        <p className="tooltip-title">{dateFormatted}</p>
        {payload.map((pld) => (
          <div key={pld.name} className="tooltip-item">
            <span
              className="dot"
              style={{
                backgroundColor: pld.color,
                boxShadow: `0 0 8px ${pld.color}`
              }}
            />
            <span style={{ color: '#94a3b8', marginRight: '8px' }}>{pld.name}:</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{pld.value} Aplikasi</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendChart({ data, activeTab = 'Overall' }) {
  // Toggle states for lines (used in Overall mode)
  const [visibleLines, setVisibleLines] = useState({
    IN: true,
    VALID: true,
    BACKLOG: true,
  });

  const toggleLine = (line) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line]
    }));
  };

  // Helper to translate month to Indonesian
  const getIndonesianMonth = (monthIndex) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthIndex] || '';
  };

  // Detect the month and year of the uploaded dataset
  const activeMonthInfo = useMemo(() => {
    if (data.length === 0) return { month: new Date().getMonth(), year: new Date().getFullYear(), label: '' };

    let latestDate = null;
    for (const item of data) {
      if (item.tanggal) {
        const d = new Date(item.tanggal);
        if (!isNaN(d.getTime())) {
          if (!latestDate || d > latestDate) {
            latestDate = d;
          }
        }
      }
    }

    const targetDate = latestDate || new Date();
    const m = targetDate.getMonth();
    const y = targetDate.getFullYear();

    return {
      month: m,
      year: y,
      label: `${getIndonesianMonth(m)} ${y}`
    };
  }, [data]);

    // Local filters for the chart
    const [filterDealer, setFilterDealer] = useState('');
    const [filterOfficer, setFilterOfficer] = useState('');

    const filterOptions = useMemo(() => {
      const dealers = new Set();
      const officers = new Set();
      data.forEach(d => {
        if (d.dealer) dealers.add(d.dealer);
        if (d.officer) officers.add(d.officer);
      });
      return {
        dealers: [...dealers].sort(),
        officers: [...officers].sort()
      };
    }, [data]);

    // Process data for Recharts (Generating full calendar month)
    const chartData = useMemo(() => {
      if (data.length === 0) return [];
  
      const { month, year } = activeMonthInfo;
  
      // Generate every day of that month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const datesMap = {};
  
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        datesMap[dateStr] = { date: dateStr, IN: 0, VALID: 0, BACKLOG: 0 };
      }
  
      // Populate actual counts
      data.forEach(item => {
        if (filterDealer && item.dealer !== filterDealer) return;
        if (filterOfficer && item.officer !== filterOfficer) return;

        const dateStr = item.tanggal;
        if (!dateStr || !datesMap[dateStr]) return;
  
        if (item.source_type === 'IN') datesMap[dateStr].IN++;
        else if (item.source_type === 'VALID') datesMap[dateStr].VALID++;
        else if (item.source_type === 'BACKLOG') datesMap[dateStr].BACKLOG++;
      });
  
      // Convert to sorted array
      return Object.values(datesMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [data, activeMonthInfo, filterDealer, filterOfficer]);

  // Format date for X Axis (e.g., "30 Jun")
  const formatDate = (tickItem) => {
    if (!tickItem) return '';
    try {
      const date = new Date(tickItem);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch (e) {
      return tickItem;
    }
  };



  if (chartData.length === 0) {
    return (
      <div className="glass-card" style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Belum ada data trend untuk ditampilkan. Silakan unggah file Excel terlebih dahulu.
      </div>
    );
  }

  const showControls = activeTab === 'Overall';
  const chartTitle = activeTab === 'Overall' 
    ? 'Tren Aktivitas Penjualan' 
    : `Tren Aktivitas Data ${activeTab}`;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1rem' }}>
      {/* Header + Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingLeft: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            {chartTitle}
          </h3>
          {activeMonthInfo.label && (
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Periode: {activeMonthInfo.label}
            </p>
          )}
        </div>
        
        {/* Only show line toggles on Overall tab */}
        {showControls && (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => toggleLine('IN')}
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '0.4rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: visibleLines.IN ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)',
                background: visibleLines.IN ? 'rgba(34,211,238,0.15)' : 'transparent',
                color: visibleLines.IN ? '#22d3ee' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              IN {visibleLines.IN ? '●' : '○'}
            </button>
            <button
              onClick={() => toggleLine('VALID')}
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '0.4rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: visibleLines.VALID ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                background: visibleLines.VALID ? 'rgba(52,211,153,0.15)' : 'transparent',
                color: visibleLines.VALID ? '#34d399' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              VALID {visibleLines.VALID ? '●' : '○'}
            </button>
            <button
              onClick={() => toggleLine('BACKLOG')}
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '0.4rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: visibleLines.BACKLOG ? '1px solid #fb923c' : '1px solid rgba(255,255,255,0.1)',
                background: visibleLines.BACKLOG ? 'rgba(251,146,60,0.15)' : 'transparent',
                color: visibleLines.BACKLOG ? '#fb923c' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              BACKLOG {visibleLines.BACKLOG ? '●' : '○'}
            </button>
          </div>
        )}
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorValid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBacklog" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" vertical={false} />
            
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="rgba(255, 255, 255, 0.15)"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              dy={10}
            />
            
            <YAxis
              stroke="rgba(255, 255, 255, 0.15)"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              dx={-5}
            />
            
            <Tooltip content={<CustomTooltip />} />

            {/* Overall Tab: Render any toggled line */}
            {activeTab === 'Overall' && (
              <>
                {visibleLines.IN && (
                  <Area
                    name="IN"
                    type="monotone"
                    dataKey="IN"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIn)"
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#22d3ee' }}
                  />
                )}
                
                {visibleLines.VALID && (
                  <Area
                    name="VALID"
                    type="monotone"
                    dataKey="VALID"
                    stroke="#34d399"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValid)"
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#34d399' }}
                  />
                )}
                
                {visibleLines.BACKLOG && (
                  <Area
                    name="BACKLOG"
                    type="monotone"
                    dataKey="BACKLOG"
                    stroke="#fb923c"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBacklog)"
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#fb923c' }}
                  />
                )}
              </>
            )}

            {/* Individual Tab Modes: Lock to render only the active line */}
            {activeTab === 'IN' && (
              <Area
                name="IN"
                type="monotone"
                dataKey="IN"
                stroke="#22d3ee"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIn)"
                activeDot={{ r: 5, strokeWidth: 0, fill: '#22d3ee' }}
              />
            )}

            {activeTab === 'VALID' && (
              <Area
                name="VALID"
                type="monotone"
                dataKey="VALID"
                stroke="#34d399"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValid)"
                activeDot={{ r: 5, strokeWidth: 0, fill: '#34d399' }}
              />
            )}

            {activeTab === 'BACKLOG' && (
              <Area
                name="BACKLOG"
                type="monotone"
                dataKey="BACKLOG"
                stroke="#fb923c"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBacklog)"
                activeDot={{ r: 5, strokeWidth: 0, fill: '#fb923c' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
