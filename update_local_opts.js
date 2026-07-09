const fs = require('fs');

let p = fs.readFileSync('src/app/page.js', 'utf8');

const insertLocalOpts = `  const localOpts = useMemo(() => {
    const brands = new Set();
    const officers = new Set();
    const inStatuses = new Set();
    baseFilteredData.forEach(r => {
      if (r.brand && r.source_type === 'BACKLOG') brands.add(r.brand);
      if (r.officer && r.source_type === 'BACKLOG') officers.add(r.officer);
      if (r.status && r.source_type === 'IN') inStatuses.add(r.status);
    });
    return {
      brands: [...brands].sort(),
      officers: [...officers].sort(),
      inStatuses: [...inStatuses].sort(),
    };
  }, [baseFilteredData]);
`;

p = p.replace(
  `// ── Separate Table Data ──────────────`,
  `${insertLocalOpts}\n  // ── Separate Table Data ──────────────`
);

p = p.replace(`options={opts.inStatuses}`, `options={localOpts.inStatuses}`);
p = p.replace(`options={opts.brands}`, `options={localOpts.brands}`);
p = p.replace(`options={opts.officers}`, `options={localOpts.officers}`);

// Oh wait, the Backlog officer options used opts.officers, but global officer filter ALSO uses opts.officers.
// I only want to replace the second occurence, or just replace the ones in the MultiSelectDropdown.
// Since the global filter uses a different component structure now? No, wait!
// The global Officer filter uses opts.officers in the <MultiSelectDropdown /> wait, I haven't changed the global filter to MultiSelectDropdown component yet!
// Ah, the global Officer filter is NOT a <MultiSelectDropdown> component, I manually wrote the JSX for it earlier!
// Let me double check if `options={opts.officers}` only exists for the BACKLOG filter.
// If it does, `replace` will hit it. If not, I can just do a precise replace.

// I'll check occurrences
let count = (p.match(/options=\{opts\.officers\}/g) || []).length;
console.log("opts.officers count:", count);

fs.writeFileSync('src/app/page.js', p, 'utf8');
