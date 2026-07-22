import type { Filters } from "./store";

export async function exportToPdf(filters: Filters) {
  try {
    // 1. Ensure scripts are loaded dynamically to avoid bundle issues
    // Using html-to-image instead of html2canvas because html2canvas crashes on modern CSS colors like lab() and oklch()
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js", "htmlToImage");
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
    const pdfWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();

    let pageAdded = false;

    for (let i = 0; i < sections.length; i++) {
      const el = sections[i];
      if (!el) continue;

      // @ts-ignore
      const htmlToImage = window.htmlToImage;
      if (!htmlToImage) throw new Error("html-to-image failed to load properly.");

      const width = el.offsetWidth;
      const height = el.offsetHeight;
      
      const imgData = await htmlToImage.toPng(el, { 
        pixelRatio: 2, 
        backgroundColor: '#ffffff',
        width: width,
        height: height + 60, // Add safety margin to prevent any text clipping
        style: {
          width: `${width}px`,
          height: `${height + 60}px`,
          margin: '0',
          padding: '0',
          paddingBottom: '60px'
        }
      });

      // Calculate aspect ratio keeping width to 90% of page
      const margin = 20;
      const maxImgWidth = pdfWidth - (margin * 2);
      const maxImgHeight = pdfHeight - margin - 45; // Leave space for footer line and margins
      
      // We need to calculate height based on the image's original dimensions
      // Since toPng returns a base64 string, we can load it into an Image object to get dimensions
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      let imgWidth = maxImgWidth;
      let imgHeight = (img.height * imgWidth) / img.width;

      // If the image is too tall to fit the page, scale it down to fit the height
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = (img.width * imgHeight) / img.height;
      }

      // Center the image horizontally on the page
      const xOffset = margin + (maxImgWidth - imgWidth) / 2;

      if (pageAdded) doc.addPage();
      
      doc.addImage(imgData, "PNG", xOffset, margin, imgWidth, imgHeight);

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
