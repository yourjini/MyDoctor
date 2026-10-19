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
  // Nav 를 레이아웃에 두면 라우트 전환 시 unmount 되지 않음. 그래야
  // PersonSwitcher state 가 유지돼 /conditions ↔ /checkups 탭 전환 때
  // 란하 선택이 깜빡이지 않는다.
  // (Nav 는 /login 경로에서는 자체적으로 null 반환.)
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
