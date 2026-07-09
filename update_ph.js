const fs = require('fs');

// UPDATE UPLOADSECTION
let up = fs.readFileSync('src/app/components/UploadSection.js', 'utf8');
up = up.replace(
  `excel_id: String(row['ID'] || '').trim(),\n          tenor: row['TENOR'] || 0,\n          otr: row['OTR'] || 0,\n          dp: row['DP'] || 0,\n          ph: row['PH'] || 0,`,
  `excel_id: String(row['PH'] || 0).trim(),\n          tenor: row['TENOR'] || 0,\n          otr: row['OTR'] || 0,\n          dp: row['DP'] || 0,\n          ph: row['PH'] || 0,`
);
fs.writeFileSync('src/app/components/UploadSection.js', up, 'utf8');
console.log("UploadSection updated");

// UPDATE PAGE.JS
let p = fs.readFileSync('src/app/page.js', 'utf8');

// 1. Update State
p = p.replace(
  `const [filterInStatus, setFilterInStatus] = useState('');`,
  `const [filterInStatus, setFilterInStatus] = useState([]);\n  const [isFilterInStatusOpen, setIsFilterInStatusOpen] = useState(false);\n  const [filterBacklogBrand, setFilterBacklogBrand] = useState([]);\n  const [isFilterBacklogBrandOpen, setIsFilterBacklogBrandOpen] = useState(false);\n  const [filterBacklogOfficer, setFilterBacklogOfficer] = useState([]);\n  const [isFilterBacklogOfficerOpen, setIsFilterBacklogOfficerOpen] = useState(false);`
);

// 2. Add formatDate helper inside component (after selectStyle)
const insertHelper = `
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return \`\${day}/\${month}/\${d.getFullYear()}\`;
  };

  const MultiSelectDropdown = ({ title, options, selected, onChange, isOpen, setIsOpen }) => {
    return (
      <div style={{ position: 'relative', minWidth: '150px' }}>
        <div 
          style={{...selectStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none'}}
          onClick={() => setIsOpen(prev => !prev)}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected.length === 0 ? title : \`\${selected.length} Dipilih\`}
          </span>
          <span>▼</span>
        </div>
        {isOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.25rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', maxHeight: '200px', overflowY: 'auto', zIndex: 50, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.02)' }}>
              <input 
                type="checkbox" 
                checked={selected.length === 0} 
                onChange={() => onChange([])}
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
`;
p = p.replace(
  `const selectStyle = {`,
  `${insertHelper}\n  const selectStyle = {`
);

// 3. Update Filtering logic
p = p.replace(
  `if (filterInStatus && r.status !== filterInStatus) return false;`,
  `if (filterInStatus.length > 0 && !filterInStatus.includes(r.status)) return false;`
);

p = p.replace(
  `return baseFilteredData.filter(r => r.source_type === 'BACKLOG');`,
  `return baseFilteredData.filter(r => {
      if (r.source_type !== 'BACKLOG') return false;
      if (filterBacklogBrand.length > 0 && !filterBacklogBrand.includes(r.brand)) return false;
      if (filterBacklogOfficer.length > 0 && !filterBacklogOfficer.includes(r.officer)) return false;
      return true;
    });`
);

// 4. Update ResetFilters
p = p.replace(
  `setFilterInStatus('');`,
  `setFilterInStatus([]); setFilterBacklogBrand([]); setFilterBacklogOfficer([]);`
);

// 5. Replace IN table dropdown
const oldInDropdown = `<select 
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#e2e8f0', padding: '0.3rem 0.6rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                  value={filterInStatus} 
                  onChange={e => { setFilterInStatus(e.target.value); setInCurrentPage(1); }}
                >
                  <option value="">Semua Status</option>
                  {opts.inStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>`;

const newInDropdown = `<MultiSelectDropdown 
                  title="Semua Status"
                  options={opts.inStatuses}
                  selected={filterInStatus}
                  onChange={val => { setFilterInStatus(val); setInCurrentPage(1); }}
                  isOpen={isFilterInStatusOpen}
                  setIsOpen={setIsFilterInStatusOpen}
                />`;
p = p.replace(oldInDropdown, newInDropdown);

// 6. Update BACKLOG table header to include Brand and Officer MultiSelectDropdowns
const oldBacklogHeader = `<h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Rincian Data KHUSUS BACKLOG ({backlogTableData.length} record)
                </h3>
              </div>`;
const newBacklogHeader = `<h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Rincian Data KHUSUS BACKLOG ({backlogTableData.length} record)
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <MultiSelectDropdown 
                    title="Semua Merek"
                    options={opts.brands}
                    selected={filterBacklogBrand}
                    onChange={val => { setFilterBacklogBrand(val); setBacklogCurrentPage(1); }}
                    isOpen={isFilterBacklogBrandOpen}
                    setIsOpen={setIsFilterBacklogBrandOpen}
                  />
                  <MultiSelectDropdown 
                    title="Semua Officer"
                    options={opts.officers}
                    selected={filterBacklogOfficer}
                    onChange={val => { setFilterBacklogOfficer(val); setBacklogCurrentPage(1); }}
                    isOpen={isFilterBacklogOfficerOpen}
                    setIsOpen={setIsFilterBacklogOfficerOpen}
                  />
                </div>
              </div>`;
p = p.replace(oldBacklogHeader, newBacklogHeader);

// 7. Update dates & columns in IN and BACKLOG
p = p.replace(
  `{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}`,
  `{formatDate(item.tanggal)}`
);
p = p.replace(
  `{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}`,
  `{formatDate(item.tanggal)}`
);

// 8. BACKLOG Columns: Replace 'Tgl In' with 'PH'
p = p.replace(
  `{['No. Reg', 'Nama', 'Dealer', 'Pengajuan', 'Merek', 'Tgl In', 'Officer'].map`,
  `{['No. Reg', 'Nama', 'Dealer', 'Pengajuan', 'Merek', 'PH', 'Officer'].map`
);

// Replace actual Tgl In data row with PH data row in Backlog table
const oldBacklogRow = `<td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{formatDate(item.tanggal)}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.officer}</td>`;

const newBacklogRow = `<td style={{ padding: '0.4rem 0.5rem', color: '#a78bfa', fontWeight: 600 }}>
                        {item.excel_id ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(item.excel_id)) : '-'}
                      </td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{item.officer}</td>`;
p = p.replace(oldBacklogRow, newBacklogRow);

fs.writeFileSync('src/app/page.js', p, 'utf8');
console.log("page.js updated");
