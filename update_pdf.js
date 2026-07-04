const fs = require('fs');

const path = 'src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  "import {",
  "import html2canvas from 'html2canvas';\nimport { jsPDF } from 'jspdf';\nimport {"
);
content = content.replace(
  "Upload, RefreshCw, Search, ChevronLeft, ChevronRight, SlidersHorizontal, X",
  "Upload, RefreshCw, Search, ChevronLeft, ChevronRight, SlidersHorizontal, X, Download"
);

// 2. Add export function inside HomePage component
const exportFunc = `
  const exportToPDF = async () => {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4 (297 x 210 mm)
    const pageWidth = 297;
    const pageHeight = 210;
    const padding = 10;

    const addElementToPdf = async (elementId, startY = padding, newPage = false) => {
      const el = document.getElementById(elementId);
      if (!el) return startY;
      if (newPage) pdf.addPage();
      
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate width and height to fit width
      const imgWidth = pageWidth - (padding * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If height is too big, scale it down to fit page
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      if (imgHeight > (pageHeight - startY - padding)) {
        finalHeight = pageHeight - startY - padding;
        finalWidth = (canvas.width * finalHeight) / canvas.height;
      }
      
      // Center horizontally if scaled down
      const xPos = padding + (imgWidth - finalWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xPos, startY, finalWidth, finalHeight);
      return startY + finalHeight + padding;
    };

    // Show loading state or similar if needed...
    const originalBodyBg = document.body.style.background;
    
    try {
      // Page 1: KPI & Trend
      let currentY = padding;
      
      // Add Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(15, 23, 42); // match background
      pdf.rect(0, 0, pageWidth, pageHeight, 'F'); 
      pdf.setFontSize(16);
      pdf.text(\`Laporan Penjualan - Tab \${activeTab}\`, padding, currentY + 5);
      currentY += 15;

      currentY = await addElementToPdf('pdf-kpi', currentY, false);
      await addElementToPdf('pdf-trend', currentY, false);
      
      // Page 2: Distribution Charts
      pdf.addPage();
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      currentY = padding;
      currentY = await addElementToPdf('pdf-brand', currentY, false);
      await addElementToPdf('pdf-composed', currentY, false);

      // Page 3: Tables
      pdf.addPage();
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      currentY = padding;
      currentY = await addElementToPdf('pdf-performance', currentY, false);
      
      const detailEl = document.getElementById('pdf-detail-table');
      if (detailEl) {
          // If enough space, add without new page
          if (currentY > pageHeight / 2) {
             pdf.addPage();
             pdf.setFillColor(15, 23, 42);
             pdf.rect(0, 0, pageWidth, pageHeight, 'F');
             currentY = padding;
          }
          await addElementToPdf('pdf-detail-table', currentY, false);
      }

      pdf.save(\`Laporan_Penjualan_\${activeTab}_\${new Date().toISOString().split('T')[0]}.pdf\`);
    } catch (e) {
      console.error(e);
      alert('Gagal mengekspor PDF');
    }
  };
`;

content = content.replace(
  "const [activeTab, setActiveTab] = useState('Overall'); // Overall, IN, VALID, BACKLOG",
  "const [activeTab, setActiveTab] = useState('Overall'); // Overall, IN, VALID, BACKLOG\n" + exportFunc
);

// 3. Add Export Button
const tabsHeader = `
      {/* ── 4 Tabs Navigation & Export ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          padding: '0.25rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '0.75rem',
          width: 'fit-content',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {['Overall', 'IN', 'VALID', 'BACKLOG'].map(tab => {
            const isActive = activeTab === tab;
            const theme = tabColors[tab];
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.5rem 1.6rem',
                  borderRadius: '0.6rem',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive ? theme.bg : 'transparent',
                  color: isActive ? theme.text : 'var(--text-secondary)',
                  boxShadow: isActive ? \`0 4px 14px \${theme.shadow}\` : 'none',
                  transform: isActive ? 'scale(1.02)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={exportToPDF}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.55rem 1.25rem',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Download size={18} />
          Unduh PDF
        </button>
      </div>
`;

// Replace old tabs div
content = content.replace(
  /\{\/\* ── 4 Tabs Navigation ────────────────────────────────────────────── \*\/\}\n\s*<div style=\{\{[\s\S]*?<\/div>/,
  tabsHeader.trim()
);

// 4. Add IDs to components
content = content.replace("<KpiCards data={baseFilteredData} activeTab={activeTab} />", "<div id=\"pdf-kpi\"><KpiCards data={baseFilteredData} activeTab={activeTab} /></div>");
content = content.replace("<TrendChart data={baseFilteredData} activeTab={activeTab} />", "<div id=\"pdf-trend\"><TrendChart data={baseFilteredData} activeTab={activeTab} /></div>");
content = content.replace("<BrandChart data={baseFilteredData} sourceFilter={activeTab === 'Overall' ? 'ALL' : activeTab} />", "<div id=\"pdf-brand\"><BrandChart data={baseFilteredData} sourceFilter={activeTab === 'Overall' ? 'ALL' : activeTab} /></div>");
content = content.replace("<DistributionComposedChart data={baseFilteredData} />", "<div id=\"pdf-composed\"><DistributionComposedChart data={baseFilteredData} /></div>");
content = content.replace("<PerformanceTables", "<div id=\"pdf-performance\"><PerformanceTables");
content = content.replace("activeTabFilter={activeTab}\n        />", "activeTabFilter={activeTab}\n        /></div>");

content = content.replace("<div className=\"glass-card\" style={{ padding: '1.25rem' }}>", "<div id=\"pdf-detail-table\" className=\"glass-card\" style={{ padding: '1.25rem' }}>");

fs.writeFileSync(path, content);
console.log('Update complete');
