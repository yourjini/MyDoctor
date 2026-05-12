import { NextRequest, NextResponse } from "next/server";
import { readFile } from "@/lib/github";
import { heicToJpeg, isHeic } from "@/lib/images";

// Streams a file from the data repo, authenticated through the app session.
// This avoids exposing raw GitHub URLs (which would require a public repo
// or a token in the URL) and keeps medical data behind login.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await ctx.params;
  const path = parts.map(decodeURIComponent).join("/");
  // data/ 안으로 한정. 추가로 .. 세그먼트가 끼어들면 거부.
  if (!path.startsWith("data/") || parts.includes("..")) {
    return new NextResponse("forbidden", { status: 403 });
  }
  const file = await readFile(path);
  if (!file) return new NextResponse("not found", { status: 404 });

  let buf = file.content;
  let ct: string;

  if (isHeic(path)) {
    // Files uploaded before HEIC→JPEG conversion was wired up. Convert
    // on the fly so they render in browsers that don't support HEIC.
    try {
      buf = await heicToJpeg(buf);
      ct = "image/jpeg";
    } catch {
      ct = "image/heic";
    }
  } else {
    const ext = path.toLowerCase().split(".").pop() || "";
    ct =
      ext === "pdf"
        ? "application/pdf"
        : ext === "png"
          ? "image/png"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : ext === "gif"
              ? "image/gif"
              : ext === "webp"
                ? "image/webp"
                : "application/octet-stream";
  }

  const url = new URL(_req.url);
  const isDownload = url.searchParams.get("download") === "1";
  const filenameParam = url.searchParams.get("filename");
  const fallbackName = path.split("/").pop() || "file";
  const downloadName = filenameParam || fallbackName;

  const headers: Record<string, string> = {
    "Content-Type": ct,
    "Cache-Control": "private, max-age=3600",
  };
  if (isDownload) {
    // RFC 5987 — encode UTF-8 filename for non-ASCII (한글 등)
    const encoded = encodeURIComponent(downloadName);
    headers["Content-Disposition"] = `attachment; filename*=UTF-8''${encoded}`;
  } else {
    const encoded = encodeURIComponent(downloadName);
    headers["Content-Disposition"] = `inline; filename*=UTF-8''${encoded}`;
  }

  const body = new Uint8Array(buf);
  return new NextResponse(body, { headers });
}
