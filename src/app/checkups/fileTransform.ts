"use client";

import { isPdf, pdfToImages } from "@/lib/pdf-to-images";

// Vercel 4.5MB body 제한 회피용 — 한 PDF가 이 값을 넘으면 페이지별 JPEG로 변환해 저장.
const PDF_SIZE_THRESHOLD = 3 * 1024 * 1024;
// 변환된 JPEG들의 총 합계 한도 (4.5MB 제한 + 텍스트 필드 + multipart 오버헤드 여유)
const CONVERTED_BUDGET = 3.5 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

export async function maybeConvertLargePdfs(
  incoming: File[],
  setProgress: (label: string | null) => void,
): Promise<File[]> {
  const out: File[] = [];
  const warnings: string[] = [];
  for (const f of incoming) {
    if (isPdf(f) && f.size > PDF_SIZE_THRESHOLD) {
      setProgress(`${f.name} 변환 준비 중…`);
      const result = await pdfToImages(f, {
        maxTotalBytes: CONVERTED_BUDGET,
        onProgress: (rendered, total, bytes) => {
          setProgress(
            `${f.name} ${rendered}/${total}페이지 (${formatBytes(bytes)})`,
          );
        },
      });
      out.push(...result.files);
      if (result.truncated) {
        warnings.push(
          `${f.name}: ${result.totalPages}페이지 중 ${result.renderedPages}페이지만 저장됨 (서버 업로드 한도)`,
        );
      }
    } else {
      out.push(f);
    }
  }
  if (warnings.length > 0) {
    setProgress(warnings.join(" / "));
    await new Promise((r) => setTimeout(r, 4000));
  }
  return out;
}
