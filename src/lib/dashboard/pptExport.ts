import type { Filters } from "./store";

export async function exportToPpt(filters: Filters) {
  try {
    // 1. Ensure scripts are loaded dynamically
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js", "htmlToImage");
    await loadScript("https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@3.12.0/dist/pptxgen.bundle.js", "PptxGenJS");

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
    const PptxGen = window.PptxGenJS;
    if (!PptxGen) throw new Error("PptxGenJS failed to load properly.");

    const pptx = new PptxGen();
    pptx.layout = "LAYOUT_16x9"; // Widescreen 10" x 5.625"

    let slideAdded = false;

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
        backgroundColor: "#ffffff",
        width: width,
        height: height + 60,
        style: {
          width: `${width}px`,
          height: `${height + 60}px`,
          margin: "0",
          padding: "0",
          paddingBottom: "60px",
        },
      });

      // Load image to get original dimensions
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Slide dimensions: 10 in wide x 5.625 in tall
      const maxW = 9.5; // in inches
      const maxH = 4.6; // in inches

      let imgW = maxW;
      let imgH = (img.height * imgW) / img.width;

      if (imgH > maxH) {
        imgH = maxH;
        imgW = (img.width * imgH) / img.height;
      }

      const xOffset = 0.25 + (maxW - imgW) / 2;

      const slide = pptx.addSlide();
      slide.addImage({ data: imgData, x: xOffset, y: 0.25, w: imgW, h: imgH });

      // Add bottom line & filter text
      slide.addShape(pptx.ShapeType.line, {
        x: 0.25,
        y: 5.15,
        w: 9.5,
        h: 0,
        line: { color: "CCCCCC", width: 1 },
      });

      slide.addText(filterText, {
        x: 0.25,
        y: 5.2,
        w: 9.5,
        h: 0.3,
        fontSize: 8,
        color: "666666",
      });

      slideAdded = true;
    }

    if (slideAdded) {
      await pptx.writeFile({ fileName: "dashboard_export.pptx" });
    } else {
      throw new Error("No sections found to export.");
    }
  } catch (error: any) {
    console.error("PPT Export failed:", error);
    alert(`PPT Export failed: ${error?.message || error}`);
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
      script.addEventListener("load", () => resolve());
      script.addEventListener("error", () => reject(new Error(`Script load error for ${src}`)));
      return;
    }

    script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script load error for ${src}`));
    document.head.appendChild(script);
  });
}
