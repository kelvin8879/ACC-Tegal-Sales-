const fs = require('fs');
let p = fs.readFileSync('src/app/page.js', 'utf8');

// 1. Add useRef to imports
p = p.replace(
  `import { useState, useEffect, useMemo } from 'react';`,
  `import { useState, useEffect, useMemo, useRef } from 'react';`
);

// 2. Modify MultiSelectDropdown
const oldMultiSelect = `const MultiSelectDropdown = ({ title, options, selected, onChange, isOpen, setIsOpen }) => {
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
  };`;

const newMultiSelect = `const MultiSelectDropdown = ({ title, options, selected, onChange, isOpen, setIsOpen }) => {
    const wrapperRef = useRef(null);
    useEffect(() => {
      function handleClickOutside(event) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [wrapperRef, setIsOpen]);

    return (
      <div ref={wrapperRef} style={{ position: 'relative', minWidth: '150px' }}>
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
                onChange={() => { onChange([]); setIsOpen(false); }}
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
  };`;
p = p.replace(oldMultiSelect, newMultiSelect);

const oldGlobalOfficer = `{/* Officer Multi-Select */}
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

const newGlobalOfficer = `{/* Officer Multi-Select */}
              <div style={{ flex: '1 1 130px' }}>
                <MultiSelectDropdown 
                  title="Semua Officer"
                  options={opts.officers}
                  selected={filterOfficer}
                  onChange={val => { setFilterOfficer(val); setCurrentPage(1); setInCurrentPage(1); setBacklogCurrentPage(1); }}
                  isOpen={isOfficerDropdownOpen}
                  setIsOpen={setIsOfficerDropdownOpen}
                />
              </div>`;
p = p.replace(oldGlobalOfficer, newGlobalOfficer);

const insertTotals = `
  const backlogTotalPH = useMemo(() => {
    return backlogTableData.reduce((sum, item) => sum + (Number(item.excel_id) || 0), 0);
  }, [backlogTableData]);
`;
p = p.replace(
  `const backlogTotalPages = Math.max(1, Math.ceil(backlogTableData.length / pageSize));`,
  `${insertTotals}\n  const backlogTotalPages = Math.max(1, Math.ceil(backlogTableData.length / pageSize));`
);

const oldBacklogTitle = `<h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Rincian Data KHUSUS BACKLOG ({backlogTableData.length} record)
                </h3>`;

const newBacklogTitle = `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Rincian Data KHUSUS BACKLOG
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#a78bfa', fontWeight: 600 }}>
                    <span>Total Unit: {backlogTableData.length}</span>
                    <span>Total PH: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(backlogTotalPH)}</span>
                  </div>
                </div>`;
p = p.replace(oldBacklogTitle, newBacklogTitle);

fs.writeFileSync('src/app/page.js', p, 'utf8');
console.log('Done!');
