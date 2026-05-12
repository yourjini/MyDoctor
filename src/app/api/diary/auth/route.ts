// Diary unlock — separate from app login. Requires the app session to be
// valid AND a correct DIARY_PASSWORD before issuing a short-lived diary cookie.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  DIARY_COOKIE,
  DIARY_MAX_AGE,
  checkDiaryPassword,
  makeDiaryToken,
  verifySessionToken,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  // App-login required first.
  const jar = await cookies();
  const appToken = jar.get(AUTH_COOKIE)?.value;
  if (!(await verifySessionToken(appToken))) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  let password: unknown;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    password = undefined;
  }

  if (typeof password !== "string" || !checkDiaryPassword(password)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = await makeDiaryToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DIARY_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DIARY_MAX_AGE,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(DIARY_COOKIE);
  return res;
}
