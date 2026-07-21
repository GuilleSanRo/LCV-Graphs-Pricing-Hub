import type { Filters } from "./store";

export async function exportToPdf(filters: Filters) {
  try {
    // 1. Ensure scripts are loaded dynamically to avoid bundle issues
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", "html2canvas");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "jspdf");

    // 2. Prepare filter text
    const filterText = `Filters: Markets: ${filters.markets.join(', ') || 'All'} | Waves: ${filters.waves.join(', ') || 'All'} | Fuels: ${filters.fuels.join(', ') || 'All'} | Segments: ${filters.segments.join(', ') || 'All'}`;

    // 3. Elements to capture
    const sections = [
      document.getElementById("section-tp"),
      document.getElementById("section-dsc"),
      document.getElementById("section-mp"),
      document.getElementById("section-summary"),
    ];

    // @ts-ignore
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDF) throw new Error("jsPDF failed to load properly.");
    const doc = new jsPDF("l", "pt", "a4"); // Landscape for wide charts

    let pageAdded = false;

    for (let i = 0; i < sections.length; i++) {
      const el = sections[i];
      if (!el) continue;

      // @ts-ignore
      const html2c = window.html2canvas;
      if (!html2c) throw new Error("html2canvas failed to load properly.");

      const canvas = await html2c(el, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL("image/png");

      const pdfWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
      
      // Calculate aspect ratio keeping width to 90% of page
      const margin = 20;
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (pageAdded) doc.addPage();
      
      doc.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);

      // Add filter footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, pdfHeight - 25, pdfWidth - margin, pdfHeight - 25);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(filterText, margin, pdfHeight - 10);
      
      pageAdded = true;
    }

    if (pageAdded) {
      doc.save("dashboard_export.pdf");
    } else {
      throw new Error("No sections found to export.");
    }
  } catch (error: any) {
    console.error("PDF Export failed:", error);
    alert(`PDF Export failed: ${error?.message || error}`);
  }
}

function loadScript(src: string, globalVar: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any)[globalVar]) {
      resolve();
      return;
    }
    
    let script = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
    if (script) {
      // Script tag exists but global variable isn't ready. Wait for it to finish.
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => reject(new Error(`Script load error for ${src}`)));
      return;
    }

    script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script load error for ${src}`));
    document.head.appendChild(script);
  });
}
