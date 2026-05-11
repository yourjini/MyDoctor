// 디버그 전용 — BLOB_READ_WRITE_TOKEN이 가리키는 스토어가 실제로 살아있는지 확인.
// 로그인한 사람만 접근 가능. 확인되면 삭제 예정.

import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  if (!cookieStore.get("mydoctor-auth")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ tokenPresent: false }, { status: 500 });
  }

  const parts = token.split("_");
  const tokenInfo = {
    tokenPresent: true,
    prefix: parts.slice(0, 2).join("_"),
    storeId: parts[3] ?? null,
    tail: token.slice(-6),
  };

  try {
    const result = await list({ limit: 1, token });
    return NextResponse.json({
      ...tokenInfo,
      listOk: true,
      hasBlobs: result.blobs.length > 0,
      sampleUrl: result.blobs[0]?.url ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.constructor.name : typeof err;
    return NextResponse.json(
      { ...tokenInfo, listOk: false, error: msg, errorName: name },
      { status: 200 },
    );
  }
}
