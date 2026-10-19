import type { Metadata, Viewport } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyDoctor",
  description: "내 병원 기록 관리",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nav 는 persistent — 라우트 전환 시 unmount 안 됨. PersonSwitcher 는
  // 자체적으로 쿠키 읽어 상태를 복원하므로 서버에서 current 를 넘길 필요
  // 없음 (그걸 넘기면 라우트별 캐시 차이로 사람 레이블이 번쩍거렸음).
  return (
    <html lang="ko">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
