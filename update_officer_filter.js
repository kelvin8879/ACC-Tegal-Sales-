const fs = require('fs');
let content = fs.readFileSync('src/app/page.js', 'utf8');

// 1. State changes
content = content.replace(
  `const [filterOfficer, setFilterOfficer] = useState('');`,
  `const [filterOfficer, setFilterOfficer] = useState([]);\n  const [isOfficerDropdownOpen, setIsOfficerDropdownOpen] = useState(false);`
);

// 2. filtering logic
content = content.replace(
  `if (filterOfficer && r.officer !== filterOfficer) return false;`,
  `if (filterOfficer.length > 0 && !filterOfficer.includes(r.officer)) return false;`
);

// 3. hasActiveFilters
content = content.replace(
  `|| filterOfficer || filterAcp || filterKondisi || searchNama || searchNoReg;`,
  `|| filterOfficer.length > 0 || filterAcp || filterKondisi || searchNama || searchNoReg;`
);

// 4. resetFilters
content = content.replace(
  `setFilterDealer(''); setFilterOfficer('');`,
  `setFilterDealer(''); setFilterOfficer([]);`
);

// 5. Replace Officer <select> with custom multi-select UI
const oldSelect = `{/* Officer */}
              <select style={selectStyle} value={filterOfficer} onChange={e => { setFilterOfficer(e.target.value); setCurrentPage(1); }}>
                <option value="">Semua Officer</option>
                {opts.officers.map(o => <option key={o} value={o}>{o.split(' ').slice(0, 3).join(' ')}</option>)}
              </select>`;

const newSelect = `{/* Officer Multi-Select */}
              <div style={{ position: 'relative', flex: '1 1 130px' }}>
                <div 
                  style={{...selectStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none'}}
                  onClick={() => setIsOfficerDropdownOpen(p => !p)}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {filterOfficer.length === 0 ? 'Semua Officer' : \`\${filterOfficer.length} Officer Dipilih\`}
                  </span>
                  <span>▼</span>
                </div>
                {isOfficerDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.25rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', maxHeight: '200px', overflowY: 'auto', zIndex: 50, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.02)' }}>
                      <input 
                        type="checkbox" 
                        checked={filterOfficer.length === 0} 
                        onChange={() => { setFilterOfficer([]); setInCurrentPage(1); setBacklogCurrentPage(1); setIsOfficerDropdownOpen(false); }}
                      />
                      Semua Officer
                    </label>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />
                    {opts.officers.map(o => (
                      <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.02)' }}>
                        <input 
                          type="checkbox" 
                          checked={filterOfficer.includes(o)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterOfficer(prev => [...prev, o]);
                            } else {
                              setFilterOfficer(prev => prev.filter(v => v !== o));
                            }
                            setInCurrentPage(1);
                            setBacklogCurrentPage(1);
                          }}
                        />
                        {o.split(' ').slice(0, 3).join(' ')}
                      </label>
                    ))}
                  </div>
                )}
              </div>`;

content = content.replace(oldSelect, newSelect);

fs.writeFileSync('src/app/page.js', content, 'utf8');
console.log("Officer filter updated.");
