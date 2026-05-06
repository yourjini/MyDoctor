// Browser-only: PDF → JPEG 페이지별 변환.
// 4.5MB Vercel body limit 우회용 — AI 분석 요청 시 사용.
// 원본 PDF는 그대로 보존되며 첨부로 업로드된다.

type PdfJsModule = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfjs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`;
      return mod;
    });
  }
  return pdfjsPromise;
}

export type PdfRenderOptions = {
  maxPages?: number; // 너무 긴 PDF 방어
  scale?: number; // 1.5 ≈ 144 DPI, 2.0 ≈ 192 DPI
  quality?: number; // 0~1 JPEG quality
};

export async function pdfToImages(
  file: File,
  options: PdfRenderOptions = {},
): Promise<File[]> {
  const { maxPages = 20, scale = 1.5, quality = 0.75 } = options;
  const pdfjs = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const baseName = file.name.replace(/\.pdf$/i, "");

  const out: File[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        "image/jpeg",
        quality,
      ),
    );
    out.push(
      new File([blob], `${baseName}-page${String(i).padStart(2, "0")}.jpg`, {
        type: "image/jpeg",
      }),
    );
    page.cleanup();
  }
  await pdf.cleanup();
  return out;
}

export function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" || /\.pdf$/i.test(file.name)
  );
}
