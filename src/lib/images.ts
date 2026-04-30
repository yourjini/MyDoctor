// HEIC/HEIF photos from iPhones don't render in most browsers (Chrome,
// Firefox, Edge). Convert them to JPEG at upload time and as a fallback
// when serving already-stored files.

const HEIC_EXT_RE = /\.(heic|heif)$/i;
const HEIC_MIME_RE = /^image\/(heic|heif|heic-sequence|heif-sequence)$/i;

export function isHeic(filename: string, contentType?: string): boolean {
  if (contentType && HEIC_MIME_RE.test(contentType)) return true;
  return HEIC_EXT_RE.test(filename);
}

export async function heicToJpeg(buffer: Buffer): Promise<Buffer> {
  // heic-convert is heavy and only needed when actually converting,
  // so import it lazily.
  const mod = (await import("heic-convert")) as unknown as {
    default: (opts: {
      buffer: ArrayBuffer | Uint8Array;
      format: "JPEG";
      quality?: number;
    }) => Promise<ArrayBuffer>;
  };
  const out = await mod.default({
    buffer: new Uint8Array(buffer),
    format: "JPEG",
    quality: 0.9,
  });
  return Buffer.from(out);
}

export function jpegFilenameFor(filename: string): string {
  return filename.replace(HEIC_EXT_RE, ".jpg");
}
