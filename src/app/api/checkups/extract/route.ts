import { NextRequest, NextResponse } from "next/server";
import { extractCheckup } from "@/lib/extract";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const files = form.getAll("files") as File[];
  const buffers: { contentType: string; data: Buffer; filename: string }[] = [];
  for (const f of files) {
    if (!(f instanceof File) || f.size === 0) continue;
    const data = Buffer.from(await f.arrayBuffer());
    buffers.push({
      filename: f.name,
      contentType: f.type || "application/octet-stream",
      data,
    });
  }
  if (buffers.length === 0) {
    return NextResponse.json({ error: "no files" }, { status: 400 });
  }
  try {
    const result = await extractCheckup(buffers);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "extraction failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
