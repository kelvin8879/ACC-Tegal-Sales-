'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

const SOURCE_COLORS = {
  IN: '#3b82f6',
  VALID: '#22c55e',
  BACKLOG: '#ef4444',
};

const DYNAMIC_COLORS = [
  '#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b',
  '#ec4899', '#3b82f6', '#14b8a6', '#84cc16', '#eab308'
];

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '0.6rem', padding: '0.6rem 1rem', fontSize: '0.95rem', color: '#fff', zIndex: 1000
    }}>
      <p style={{ margin: 0, fontWeight: 700, color: d.payload.fill }}>{d.name}</p>
      <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)' }}>
        {d.value} unit — <strong style={{ color: '#fff' }}>{d.payload.pct}%</strong>
      </p>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '0.6rem', padding: '0.6rem 1rem', fontSize: '0.95rem', color: '#fff', zIndex: 1000
    }}>
      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#fff' }}>Status: {label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', margin: '0.2rem 0' }}>
          <span style={{ color: p.payload.fill, fontWeight: 600 }}>Total:</span>
          <span>{p.value} unit</span>
        </div>
      ))}
    </div>
  );
};

// Tracker untuk menyimpan label yang sudah di-render, agar bisa mendeteksi jarak
let pieRenderState = {
  rightLabels: [],
  leftLabels: []
};

const getAngleDiff = (a, b) => {
  let diff = Math.abs((a % 360) - (b % 360));
  if (diff > 180) diff = 360 - diff;
  return diff;
};

const renderCustomLabel = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, outerRadius, fill, payload, percent, value, index } = props;

  // Reset state for a new pie chart
  if (index === 0) {
    pieRenderState.rightLabels = [];
    pieRenderState.leftLabels = [];
  }

  // Tampilkan SEMUA label tanpa kecuali sesuai permintaan user
  // (kode penyembunyian persentase kecil dihapus)

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  // 1. Posisi dasar di pinggir pie
  const sx = cx + (outerRadius) * cos;
  const sy = cy + (outerRadius) * sin;

  // 2. Arah Teks
  // Permintaan user: "label paling bawah mengarah ke kiri"
  // Titik terbawah adalah cos = 0. Dengan cos > 0.05, label di ujung bawah akan lari ke Kiri.
  const isRight = cos > 0.05;

  // 3. SMART VERTICAL STAGGERING
  // Kita pastikan tidak ada teks yang bertabrakan secara vertikal (ey)
  let mx = cx + (outerRadius + 15) * cos;
  let my = cy + (outerRadius + 15) * sin;

  const labelsOnSide = isRight ? pieRenderState.rightLabels : pieRenderState.leftLabels;

  let collision = true;
  let iters = 0;
  while (collision && iters < 8) {
    collision = false;
    for (const lbl of labelsOnSide) {
      if (Math.abs(my - lbl.ey) < 22) { // Teks butuh jarak vertikal minimal 22px (karena 2 baris teks)
        collision = true;
        if (my >= cy) {
          my += 22; 
        } else {
          my -= 22; 
        }
        mx += (isRight ? 1 : -1) * 8; 
        break;
      }
    }
    iters++;
  }

  labelsOnSide.push({ ey: my, angle: midAngle });

  // Koreksi patahan (foldback/zig-zag) untuk label bawah:
  // Jika label dipaksa ke kiri (!isRight) tetapi posisinya aslinya sedikit di kanan (mx >= cx),
  // bengkokkan garis secara halus ke kiri agar tidak melipat balik.
  if (!isRight && mx >= cx) {
    mx = cx - 15;
  }

  const ex = mx + (isRight ? 1 : -1) * 20;
  const ey = my;
  const textAnchor = isRight ? 'start' : 'end';

  let nameLabel = payload.name;
  const maxLen = payload.isSingleChart ? 25 : 18;
  if (nameLabel.length > maxLen) {
    nameLabel = nameLabel.substring(0, maxLen) + '...';
  }

  const fontSizeTitle = payload.isSingleChart ? 11.5 : 9.5;
  const fontSizeValue = payload.isSingleChart ? 10.5 : 8.5;

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" opacity={0.8} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      <text x={ex + (isRight ? 1 : -1) * 6} y={ey - 4} textAnchor={textAnchor} fill="#f8fafc" fontSize={fontSizeTitle} fontWeight={800}>
        {nameLabel}
      </text>
      <text x={ex + (isRight ? 1 : -1) * 6} y={ey + 10} textAnchor={textAnchor} fill={fill} fontSize={fontSizeValue} fontWeight={700}>
        {`${value} Unit (${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};
export default function BrandChart({ data, sourceFilter = 'ALL' }) {
  const [groupBy, setGroupBy] = useState('dealer'); // 'dealer' or 'officer'
  const [filterValue, setFilterValue] = useState('ALL');

  // Determine the active dimension for the pie slices
  // If user selects "Tampilkan: Dealer" and doesn't filter, pie shows Dealers.
  // If user selects "Tampilkan: Dealer" and filters to "Dealer X", pie should show Officers inside Dealer X!
  const sliceDimension = useMemo(() => {
    if (filterValue === 'ALL') return groupBy; // 'dealer' or 'officer'
    return groupBy === 'dealer' ? 'officer' : 'dealer';
  }, [groupBy, filterValue]);

  // Generate options for the sub-filter
  const filterOptions = useMemo(() => {
    const opts = new Set();
    data.forEach(row => {
      const val = groupBy === 'dealer' ? row.dealer : row.officer;
      if (val) opts.add(val);
    });
    return [...opts].sort();
  }, [data, groupBy]);

  // When groupBy changes, reset filter to ALL
  const handleGroupByChange = (e) => {
    setGroupBy(e.target.value);
    setFilterValue('ALL');
  };

  const getPieData = (statusType) => {
    let filtered = data.filter(r => r.source_type === statusType);

    // Apply internal filter if not ALL
    if (filterValue !== 'ALL') {
      filtered = filtered.filter(r => {
        const val = groupBy === 'dealer' ? r.dealer : r.officer;
        return val === filterValue;
      });
    }

    const counts = {};
    for (const row of filtered) {
      let key = sliceDimension === 'dealer' ? row.dealer : row.officer;
      if (!key) key = 'Unknown';
      if (sliceDimension === 'officer') {
        key = key.split(' ').slice(0, 2).join(' ');
      }
      counts[key] = (counts[key] || 0) + 1;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    const topN = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    const restCount = rest.reduce((sum, item) => sum + item[1], 0);

    const finalData = topN.map(([name, value], idx) => ({
      name, value, pct: total ? Math.round((value / total) * 100) : 0, fill: DYNAMIC_COLORS[idx % DYNAMIC_COLORS.length]
    }));

    if (restCount > 0) {
      finalData.push({
        name: 'Lainnya', value: restCount, pct: total ? Math.round((restCount / total) * 100) : 0, fill: '#475569'
      });
    }

    return { chartData: finalData, total };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inPie = useMemo(() => getPieData('IN'), [data, groupBy, filterValue, sliceDimension]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validPie = useMemo(() => getPieData('VALID'), [data, groupBy, filterValue, sliceDimension]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const backlogPie = useMemo(() => getPieData('BACKLOG'), [data, groupBy, filterValue, sliceDimension]);

  const barChartData = useMemo(() => {
    let filtered = data;
    if (filterValue !== 'ALL') {
      filtered = filtered.filter(r => {
        const val = groupBy === 'dealer' ? r.dealer : r.officer;
        return val === filterValue;
      });
    }

    const counts = { IN: 0, VALID: 0, BACKLOG: 0 };
    filtered.forEach(r => {
      if (counts[r.source_type] !== undefined) {
        counts[r.source_type]++;
      }
    });

    return [
      { name: 'IN', value: counts.IN, fill: SOURCE_COLORS.IN },
      { name: 'VALID', value: counts.VALID, fill: SOURCE_COLORS.VALID },
      { name: 'BACKLOG', value: counts.BACKLOG, fill: SOURCE_COLORS.BACKLOG }
    ];
  }, [data, groupBy, filterValue]);

  if (!data.length) return null;

  const selectStyle = {
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '0.6rem 0.9rem',
    borderRadius: '0.5rem',
    fontSize: '1.1rem',
    outline: 'none',
    cursor: 'pointer'
  };

  const isSingleChart = sourceFilter !== 'ALL';
  const innerR = isSingleChart ? 130 : 55;
  const outerR = isSingleChart ? 190 : 80;
  const containerHeight = isSingleChart ? 550 : 380;

  return (
    <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '2rem' }}>

      {/* HEADER & FILTERS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Distribusi Top {sliceDimension === 'dealer' ? 'Dealer' : 'Officer'}
          </h3>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Breakdown berdasarkan status {sourceFilter === 'ALL' ? 'IN, VALID, dan BACKLOG' : sourceFilter}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={groupBy} onChange={handleGroupByChange} style={selectStyle}>
            <option value="dealer" style={{ color: '#000' }}>Tampilkan: Dealer</option>
            <option value="officer" style={{ color: '#000' }}>Tampilkan: Officer</option>
          </select>

          <select value={filterValue} onChange={e => setFilterValue(e.target.value)} style={selectStyle}>
            <option value="ALL" style={{ color: '#000' }}>Semua {groupBy === 'dealer' ? 'Dealer' : 'Officer'}</option>
            {filterOptions.map(opt => (
              <option key={opt} value={opt} style={{ color: '#000' }}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TOP ROW: PIE CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: sourceFilter === 'ALL' ? '1fr auto 1fr auto 1fr' : '1fr', gap: '1.5rem', alignItems: 'center' }}>

        {/* IN PIE */}
        {(sourceFilter === 'ALL' || sourceFilter === 'IN') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h4 style={{ color: SOURCE_COLORS.IN, margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1.6rem', textShadow: '0 2px 10px rgba(59, 130, 246, 0.4)', textAlign: 'center', letterSpacing: '0.05em' }}>
              IN
            </h4>
            <div style={{ width: '100%', height: containerHeight, position: 'relative' }}>
              {inPie.total > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 5
                }}>
                  <span style={{ fontSize: isSingleChart ? '1rem' : '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Total</span>
                  <span style={{ fontSize: isSingleChart ? '3.5rem' : '1.8rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{inPie.total}</span>
                  <span style={{ fontSize: isSingleChart ? '0.9rem' : '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Unit</span>
                </div>
              )}
              {inPie.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={inPie.chartData} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR} paddingAngle={4} dataKey="value" stroke="none" label={(props) => renderCustomLabel({...props, isSingleChart})} labelLine={false} minAngle={18} isAnimationActive={false}>
                      {inPie.chartData.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Tidak ada data IN</div>
              )}
            </div>
          </div>
        )}

        {sourceFilter === 'ALL' && <div style={{ width: '1px', height: '80%', background: 'rgba(255,255,255,0.1)' }}></div>}

        {/* VALID PIE */}
        {(sourceFilter === 'ALL' || sourceFilter === 'VALID') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h4 style={{ color: SOURCE_COLORS.VALID, margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1.6rem', textShadow: '0 2px 10px rgba(34, 197, 94, 0.4)', textAlign: 'center', letterSpacing: '0.05em' }}>
              VALID
            </h4>
            <div style={{ width: '100%', height: containerHeight, position: 'relative' }}>
              {validPie.total > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 5
                }}>
                  <span style={{ fontSize: isSingleChart ? '1rem' : '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Total</span>
                  <span style={{ fontSize: isSingleChart ? '3.5rem' : '1.8rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{validPie.total}</span>
                  <span style={{ fontSize: isSingleChart ? '0.9rem' : '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Unit</span>
                </div>
              )}
              {validPie.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={validPie.chartData} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR} paddingAngle={4} dataKey="value" stroke="none" label={(props) => renderCustomLabel({...props, isSingleChart})} labelLine={false} minAngle={18} isAnimationActive={false}>
                      {validPie.chartData.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Tidak ada data VALID</div>
              )}
            </div>
          </div>
        )}

        {sourceFilter === 'ALL' && <div style={{ width: '1px', height: '80%', background: 'rgba(255,255,255,0.1)' }}></div>}

        {/* BACKLOG PIE */}
        {(sourceFilter === 'ALL' || sourceFilter === 'BACKLOG') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h4 style={{ color: SOURCE_COLORS.BACKLOG, margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1.6rem', textShadow: '0 2px 10px rgba(239, 68, 68, 0.4)', textAlign: 'center', letterSpacing: '0.05em' }}>
              BACKLOG
            </h4>
            <div style={{ width: '100%', height: containerHeight, position: 'relative' }}>
              {backlogPie.total > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 5
                }}>
                  <span style={{ fontSize: isSingleChart ? '1rem' : '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Total</span>
                  <span style={{ fontSize: isSingleChart ? '3.5rem' : '1.8rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{backlogPie.total}</span>
                  <span style={{ fontSize: isSingleChart ? '0.9rem' : '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Unit</span>
                </div>
              )}
              {backlogPie.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={backlogPie.chartData} cx="50%" cy="50%" innerRadius={innerR} outerRadius={outerR} paddingAngle={4} dataKey="value" stroke="none" label={(props) => renderCustomLabel({...props, isSingleChart})} labelLine={false} minAngle={18} isAnimationActive={false}>
                      {backlogPie.chartData.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Tidak ada data BACKLOG</div>
              )}
            </div>
          </div>
        )}

      </div>

      {sourceFilter === 'ALL' && (
        <>
          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }}></div>

          {/* BOTTOM ROW: HORIZONTAL BAR CHART */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Komparasi Status Keseluruhan
            </h3>

            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical" margin={{ top: 10, right: 50, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={true} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fill: '#94a3b8', fontSize: 13 }} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" tick={{ fill: '#e2e8f0', fontSize: 14, fontWeight: 700 }} width={90} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={40}>
                    {barChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="right" fill="#fff" fontSize={13} fontWeight="bold" formatter={(val) => `${val} unit`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
