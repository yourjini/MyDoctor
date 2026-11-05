"use client";

// 업로드 전 클라이언트 측 이미지 압축.
// - 긴 변을 maxDim 로 리사이징 (비율 유지)
// - JPEG 재인코딩 (quality ~0.82)
// - PNG/HEIC/GIF/WebP 도 전부 JPEG 로 변환해 작게 떨어뜨림
// - 500KB 이하의 작은 이미지는 그대로 반환 (이미 작음)
// - HEIC 는 브라우저가 Canvas 로 못 그리는 경우가 많아, 서버측 변환을
//   유지하려면 여기서 패스 (서버 heic-convert 가 받음)
const MAX_DIM = 2048;
const JPEG_QUALITY = 0.82;
const SKIP_UNDER_BYTES = 500 * 1024;
const COMPRESSIBLE = /^image\/(jpeg|png|webp|bmp|tiff?)$/i;

export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type || !COMPRESSIBLE.test(file.type)) return file;
  if (file.size < SKIP_UNDER_BYTES) return file;

  try {
    const bmp = await loadBitmap(file);
    const { width, height } = fitInside(bmp.width, bmp.height, MAX_DIM);

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(width, height)
        : (() => {
            const c = document.createElement("canvas");
            c.width = width;
            c.height = height;
            return c;
          })();

    const ctx = (canvas as HTMLCanvasElement).getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) return file;
    (ctx as CanvasRenderingContext2D).drawImage(bmp, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
    if (!blob || blob.size >= file.size) return file; // 원본이 더 작으면 유지

    const name = file.name.replace(/\.(png|webp|bmp|tif[f]?)$/i, ".jpg");
    return new File([blob], name, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    // 실패 시 원본 사용
    return file;
  }
}

function fitInside(
  w: number,
  h: number,
  maxDim: number,
): { width: number; height: number } {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h };
  const ratio = w > h ? maxDim / w : maxDim / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

async function loadBitmap(
  file: File,
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fallthrough to HTMLImageElement
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: string,
  quality: number,
): Promise<Blob | null> {
  if ("convertToBlob" in canvas) {
    return await (canvas as OffscreenCanvas).convertToBlob({ type, quality });
  }
  return await new Promise<Blob | null>((resolve) => {
    (canvas as HTMLCanvasElement).toBlob((b) => resolve(b), type, quality);
  });
}
