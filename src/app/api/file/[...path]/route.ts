import { NextRequest, NextResponse } from "next/server";
import { readFile } from "@/lib/github";
import { heicToJpeg, isHeic } from "@/lib/images";

// 큰 파일 (수십 MB PDF) 을 GitHub 에서 받아 응답 바디로 다시 흘려보내므로
// 기본 10s 로는 모자람. 60s 로 올림.
export const maxDuration = 60;

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
    const map: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      // 오디오: 녹음기 앱이 뱉는 흔한 포맷
      mp3: "audio/mpeg",
      m4a: "audio/mp4",
      aac: "audio/aac",
      wav: "audio/wav",
      ogg: "audio/ogg",
      oga: "audio/ogg",
      webm: "audio/webm",
      "3gp": "audio/3gpp",
      "3gpp": "audio/3gpp",
      amr: "audio/amr",
    };
    ct = map[ext] ?? "application/octet-stream";
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

  // Streaming response — Vercel 서버리스는 non-streaming 응답 바디에 4.5MB
  // 상한이 있어서 19MB PDF 같은 큰 파일이 거부당함 ("연결 거부"). 1MB chunk
  // 로 쪼개서 ReadableStream 으로 넘기면 streaming 응답으로 처리되어 상한이
  // 적용되지 않음.
  const CHUNK = 1024 * 1024;
  const data = new Uint8Array(buf);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < data.byteLength; i += CHUNK) {
        controller.enqueue(data.subarray(i, Math.min(i + CHUNK, data.byteLength)));
      }
      controller.close();
    },
  });
  return new NextResponse(stream, { headers });
}
