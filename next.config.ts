import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
    // 클라이언트 Router Cache 를 비활성 (dynamic·static 모두 0s). 이 캐시가
    // 켜져 있으면 /conditions ↔ /checkups 탭 전환 시 각 탭을 이전 subject
    // 결과로 번쩍 보여주고 뒤이어 새 데이터로 교체되어 "이전 사람 레이블
    // 깜빡임" 이 생김. 데이터는 Blob 아니고 작은 JSON 이라 매번 서버
    // fetch 해도 체감 성능엔 영향 적음.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // 의료 데이터 — 검색엔진 인덱싱 차단
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          // 응답이 다른 사이트에서 iframe으로 임베드되지 않도록
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
