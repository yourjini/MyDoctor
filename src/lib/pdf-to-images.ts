// Browser-only: PDF → JPEG 페이지별 변환.
// 4.5MB Vercel body limit 우회용 — AI 분석 요청 시 사용.
// 원본 PDF는 그대로 보존되며 첨부로 업로드된다.

type PdfJsModule = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfjs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      // Self-hosted from /public (copied from node_modules/pdfjs-dist/build).
      // pdfjs-dist 버전 업데이트 시 public/pdf.worker.min.mjs 도 같이 교체할 것.
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return pdfjsPromise;
}

export type PdfRenderOptions = {
  maxPages?: number;
  scale?: number; // 1.2 ≈ 115 DPI, 1.5 ≈ 144 DPI
  quality?: number; // 0~1 JPEG quality
  maxTotalBytes?: number; // 누적 용량 한도 (Vercel 4.5MB body 제한 회피)
  onProgress?: (rendered: number, total: number, totalBytes: number) => void;
};

export type PdfRenderResult = {
  files: File[];
  truncated: boolean; // 페이지 수 또는 용량 한도로 잘렸는지
  totalPages: number; // 원본 PDF 페이지 수
  renderedPages: number; // 실제 변환된 페이지 수
  totalBytes: number;
};

export async function pdfToImages(
  file: File,
  options: PdfRenderOptions = {},
): Promise<PdfRenderResult> {
  const {
    maxPages = 25,
    scale = 1.2,
    quality = 0.7,
    maxTotalBytes = 3.8 * 1024 * 1024, // 4.5MB 한도에 multipart 오버헤드 여유
    onProgress,
  } = options;
  const pdfjs = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pageCount = Math.min(totalPages, maxPages);
  const baseName = file.name.replace(/\.pdf$/i, "");

  const out: File[] = [];
  let totalBytes = 0;
  let truncated = totalPages > maxPages;

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

    if (totalBytes + blob.size > maxTotalBytes && out.length > 0) {
      truncated = true;
      page.cleanup();
      break;
    }

    out.push(
      new File([blob], `${baseName}-page${String(i).padStart(2, "0")}.jpg`, {
        type: "image/jpeg",
      }),
    );
    totalBytes += blob.size;
    page.cleanup();
    onProgress?.(out.length, pageCount, totalBytes);
  }
  await pdf.cleanup();

  return {
    files: out,
    truncated,
    totalPages,
    renderedPages: out.length,
    totalBytes,
  };
}

export function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" || /\.pdf$/i.test(file.name)
  );
}
