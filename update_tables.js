const fs = require('fs');

let content = fs.readFileSync('src/app/page.js', 'utf8');

// 1. Replace state
content = content.replace(
`  const [searchNama, setSearchNama] = useState('');
  const [searchNoReg, setSearchNoReg] = useState('');

  // Table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;`,
`  const [searchNama, setSearchNama] = useState('');
  const [searchNoReg, setSearchNoReg] = useState('');

  // Table specific states
  const [inCurrentPage, setInCurrentPage] = useState(1);
  const [backlogCurrentPage, setBacklogCurrentPage] = useState(1);
  const [filterInStatus, setFilterInStatus] = useState('');
  const pageSize = 15;`
);

// 2. Add inStatuses
content = content.replace(
`    const wilayahs = new Set();`,
`    const wilayahs = new Set();
    const inStatuses = new Set();`
);
content = content.replace(
`      if (r.wilayah) wilayahs.add(r.wilayah);`,
`      if (r.wilayah) wilayahs.add(r.wilayah);
      if (r.source_type === 'IN' && r.status) inStatuses.add(r.status);`
);
content = content.replace(
`      wilayahs: [...wilayahs].sort(),`,
`      wilayahs: [...wilayahs].sort(),
      inStatuses: [...inStatuses].sort(),`
);

// 3. Replace filtering logic
content = content.replace(
`  // ── Data Filtered by Table Tab (Overall, IN, VALID, BACKLOG) ──────────────
  const tabFilteredData = useMemo(() => {
    if (tableTab === 'Overall') return baseFilteredData;
    return baseFilteredData.filter(r => r.source_type === tableTab);
  }, [baseFilteredData, tableTab]);

  // Pagination for Detail Table
  const totalPages = Math.max(1, Math.ceil(tabFilteredData.length / pageSize));
  const pagedData = tabFilteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setFilterWilayah(''); setFilterBrand('');
    setFilterDealer(''); setFilterOfficer('');
    setFilterAcp(''); setFilterKondisi(''); setSearchNama(''); setSearchNoReg('');
    setCurrentPage(1);
  };`,
`  // ── Separate Table Data ──────────────
  const inTableData = useMemo(() => {
    return baseFilteredData.filter(r => {
      if (r.source_type !== 'IN') return false;
      if (filterInStatus && r.status !== filterInStatus) return false;
      return true;
    });
  }, [baseFilteredData, filterInStatus]);

  const backlogTableData = useMemo(() => {
    return baseFilteredData.filter(r => r.source_type === 'BACKLOG');
  }, [baseFilteredData]);

  // Pagination
  const inTotalPages = Math.max(1, Math.ceil(inTableData.length / pageSize));
  const inPagedData = inTableData.slice((inCurrentPage - 1) * pageSize, inCurrentPage * pageSize);

  const backlogTotalPages = Math.max(1, Math.ceil(backlogTableData.length / pageSize));
  const backlogPagedData = backlogTableData.slice((backlogCurrentPage - 1) * pageSize, backlogCurrentPage * pageSize);

  const resetFilters = () => {
    setFilterWilayah(''); setFilterBrand('');
    setFilterDealer(''); setFilterOfficer('');
    setFilterAcp(''); setFilterKondisi(''); setSearchNama(''); setSearchNoReg('');
    setFilterInStatus('');
    setInCurrentPage(1);
    setBacklogCurrentPage(1);
  };`
);

// 4. Replace Detail Table JSX
const detailTableStart = content.indexOf('{/* ── Detail Table ──────────────────────────────────────────────── */}');
const detailTableEnd = content.indexOf('</main>');

const newTableJSX = `{/* ── Detail Tables ─────────────────────────────────────────────── */}
        <div id="pdf-detail-table" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* TABLE IN */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Rincian Data KHUSUS IN ({inTableData.length} record)
                </h3>
                <select 
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#e2e8f0', padding: '0.3rem 0.6rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                  value={filterInStatus} 
                  onChange={e => { setFilterInStatus(e.target.value); setInCurrentPage(1); }}
                >
                  <option value="">Semua Status</option>
                  {opts.inStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.no_reg || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.nama}</td>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Rincian Data KHUSUS BACKLOG ({backlogTableData.length} record)
                </h3>
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
                    {['No. Reg', 'Nama', 'Dealer', 'Pengajuan', 'Merek', 'Tgl In', 'Officer'].map(col => <th key={col} style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{col}</th>)}
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
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.no_reg || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.nama}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.dealer}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.pengajuan || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: '#fff' }}>{item.merk || item.brand || '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.officer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
`;

content = content.slice(0, detailTableStart) + newTableJSX + content.slice(detailTableEnd);

fs.writeFileSync('src/app/page.js', content, 'utf8');
