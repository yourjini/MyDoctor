// Vercel Blob 클라이언트 업로드용 — 서버는 토큰만 발급, 실제 데이터는
// 브라우저 → Blob 으로 직접 흐른다. 4.5MB Vercel 함수 본문 제한 회피.
//
// 환경변수 BLOB_READ_WRITE_TOKEN 필요 (Vercel 대시보드에서 Blob 스토어 연결 시 자동 주입).

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request): Promise<NextResponse> {
  // 로그인 세션 확인 — 비인가 업로드 차단
  const cookieStore = await cookies();
  const auth = cookieStore.get("mydoctor-auth");
  if (!auth) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/heic",
          "image/heif",
          "image/webp",
          "image/gif",
        ],
        // 100MB 정도면 종합검진 PDF 충분 (Blob 자체는 더 큰 것도 가능)
        maximumSizeInBytes: 100 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({}),
      }),
      onUploadCompleted: async () => {
        // 서버가 GitHub로 옮긴 뒤 직접 del() 호출하므로 여기는 비워둠
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "blob upload error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
