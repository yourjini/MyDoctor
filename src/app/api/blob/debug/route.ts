// 디버그 전용 — BLOB_READ_WRITE_TOKEN으로 list / put(public) / put(private) 시도.
// 로그인한 사람만 접근 가능. 확인되면 삭제 예정.

import { put, del, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type StepResult = {
  ok: boolean;
  error?: string;
  errorName?: string;
  url?: string;
};

async function tryPut(
  access: "public" | "private",
  token: string,
): Promise<StepResult> {
  const probeName = `__debug-probe-${access}-${Date.now()}.txt`;
  try {
    const blob = await put(probeName, "ping", {
      access,
      token,
      addRandomSuffix: true,
      allowOverwrite: false,
    } as Parameters<typeof put>[2]);
    try {
      await del(blob.url, { token });
    } catch {
      /* ignore cleanup failure */
    }
    return { ok: true, url: blob.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.constructor.name : typeof err;
    return { ok: false, error: msg, errorName: name };
  }
}

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

  let listStep: StepResult;
  try {
    await list({ limit: 1, token });
    listStep = { ok: true };
  } catch (err) {
    listStep = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      errorName: err instanceof Error ? err.constructor.name : typeof err,
    };
  }

  const putPublic = await tryPut("public", token);
  const putPrivate = await tryPut("private", token);

  return NextResponse.json({
    ...tokenInfo,
    list: listStep,
    putPublic,
    putPrivate,
  });
}
