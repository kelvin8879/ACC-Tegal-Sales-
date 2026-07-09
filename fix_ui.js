const fs = require('fs');
let p = fs.readFileSync('src/app/page.js', 'utf8');

const oldHeader = `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Rincian Data KHUSUS BACKLOG
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#a78bfa', fontWeight: 600 }}>
                    <span>Total Unit: {backlogTableData.length}</span>
                    <span>Total PH: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(backlogTotalPH)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <MultiSelectDropdown 
                    title="Semua Merek"
                    options={localOpts.brands}
                    selected={filterBacklogBrand}
                    onChange={val => { setFilterBacklogBrand(val); setBacklogCurrentPage(1); }}
                    isOpen={isFilterBacklogBrandOpen}
                    setIsOpen={setIsFilterBacklogBrandOpen}
                  />
                  <MultiSelectDropdown 
                    title="Semua Officer"
                    options={localOpts.officers}
                    selected={filterBacklogOfficer}
                    onChange={val => { setFilterBacklogOfficer(val); setBacklogCurrentPage(1); }}
                    isOpen={isFilterBacklogOfficerOpen}
                    setIsOpen={setIsFilterBacklogOfficerOpen}
                  />
                </div>`;

const newHeader = `<h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Rincian Data KHUSUS BACKLOG
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <MultiSelectDropdown 
                    title="Semua Merek"
                    options={localOpts.brands}
                    selected={filterBacklogBrand}
                    onChange={val => { setFilterBacklogBrand(val); setBacklogCurrentPage(1); }}
                    isOpen={isFilterBacklogBrandOpen}
                    setIsOpen={setIsFilterBacklogBrandOpen}
                  />
                  <MultiSelectDropdown 
                    title="Semua Officer"
                    options={localOpts.officers}
                    selected={filterBacklogOfficer}
                    onChange={val => { setFilterBacklogOfficer(val); setBacklogCurrentPage(1); }}
                    isOpen={isFilterBacklogOfficerOpen}
                    setIsOpen={setIsFilterBacklogOfficerOpen}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1.1rem', color: '#facc15', fontWeight: 800, background: 'rgba(250, 204, 21, 0.1)', padding: '0.4rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(250, 204, 21, 0.2)', marginLeft: 'auto' }}>
                  <span>Unit: {backlogTableData.length}</span>
                  <span>PH: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(backlogTotalPH)}</span>
                </div>`;

p = p.replace(oldHeader, newHeader);

// Adjust the flex wrapper to allow 'marginLeft: auto' to push pagination slightly if needed,
// but actually, we should just let it be part of the flex container.
// The wrapper is: <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
// Let's make sure that wrapper wraps on small screens properly.
p = p.replace(
  `<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Rincian Data KHUSUS BACKLOG
                </h3>`,
  `<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Rincian Data KHUSUS BACKLOG
                </h3>`
);

fs.writeFileSync('src/app/page.js', p, 'utf8');
console.log('done!');
