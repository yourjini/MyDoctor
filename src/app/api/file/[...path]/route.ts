import { NextRequest, NextResponse } from "next/server";
import { readFile } from "@/lib/github";

// Streams a file from the data repo, authenticated through the app session.
// This avoids exposing raw GitHub URLs (which would require a public repo
// or a token in the URL) and keeps medical data behind login.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await ctx.params;
  const path = parts.map(decodeURIComponent).join("/");
  if (!path.startsWith("data/")) {
    return new NextResponse("forbidden", { status: 403 });
  }
  const file = await readFile(path);
  if (!file) return new NextResponse("not found", { status: 404 });

  const ext = path.toLowerCase().split(".").pop() || "";
  const ct =
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

  // Return a fresh Uint8Array to satisfy BodyInit typing
  const body = new Uint8Array(file.content);
  return new NextResponse(body, {
    headers: {
      "Content-Type": ct,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
