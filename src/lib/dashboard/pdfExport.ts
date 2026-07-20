import type { Filters } from "./store";

export async function exportToPdf(filters: Filters) {
  // 1. Ensure scripts are loaded dynamically to avoid bundle issues
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

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
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "pt", "a4"); // Landscape for wide charts

  let pageAdded = false;

  for (let i = 0; i < sections.length; i++) {
    const el = sections[i];
    if (!el) continue;

    // @ts-ignore
    const canvas = await window.html2canvas(el, { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: getComputedStyle(document.body).backgroundColor 
    });
    
    const imgData = canvas.toDataURL("image/png");

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    
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
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script load error for ${src}`));
    document.head.appendChild(script);
  });
}
