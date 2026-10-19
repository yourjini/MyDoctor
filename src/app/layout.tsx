import type { Metadata, Viewport } from "next";
import { Nav } from "@/components/Nav";
import { currentSubject } from "@/lib/current-subject";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nav 는 persistent (layout 에 1회 렌더). 서버에서 쿠키 current 를 읽어
  // PersonSwitcher 의 initial render 를 올바른 사람 하이라이트로 시작하게
  // 함. hydration 후엔 client state 가 쿠키 "진실" 로 유지되므로 라우트
  // 전환 시 서버 current 가 뭘 보내든 영향 없음.
  const person = await currentSubject();
  return (
    <html lang="ko">
      <body>
        <Nav currentPerson={person} />
        {children}
      </body>
    </html>
  );
}
