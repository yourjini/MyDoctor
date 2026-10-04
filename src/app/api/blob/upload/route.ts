// Vercel Blob 클라이언트 업로드용 — 서버는 토큰만 발급, 실제 데이터는
// 브라우저 → Blob 으로 직접 흐른다. 4.5MB Vercel 함수 본문 제한 회피.
//
// 환경변수 BLOB_READ_WRITE_TOKEN 필요 (Vercel 대시보드에서 Blob 스토어 연결 시 자동 주입).

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  // 로그인 세션 확인 — 비인가 업로드 차단. middleware도 같은 검사를 하지만
  // defense-in-depth로 한 번 더 검증한다 (HMAC 서명까지 확인).
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("[blob/upload] BLOB_READ_WRITE_TOKEN is not set");
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN 환경변수가 설정되지 않음. Vercel Storage에서 Blob 스토어 연결 후 재배포 필요.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // The store is private; `access: "private"` must be embedded in the
      // client token so Vercel doesn't 400 the upload. SDK's Pick type omits
      // `access` from this callback's return, so we cast.
      onBeforeGenerateToken: (async () => ({
        access: "private",
        allowedContentTypes: [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/heic",
          "image/heif",
          "image/webp",
          "image/gif",
          // 음성 메모 — 녹음기 앱이 뱉는 흔한 포맷들
          "audio/mpeg",
          "audio/mp3",
          "audio/mp4",
          "audio/m4a",
          "audio/x-m4a",
          "audio/aac",
          "audio/wav",
          "audio/x-wav",
          "audio/webm",
          "audio/ogg",
          "audio/3gpp",
          "audio/amr",
        ],
        maximumSizeInBytes: 100 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({}),
      })) as Parameters<typeof handleUpload>[0]["onBeforeGenerateToken"],
      onUploadCompleted: async () => {
        // 서버가 GitHub로 옮긴 뒤 del()로 정리하므로 여기는 비움
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("[blob/upload] handleUpload error:", err);
    const msg = err instanceof Error ? err.message : "blob upload error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
