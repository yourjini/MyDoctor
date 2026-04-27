import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyDoctor",
  description: "내 병원 기록 관리",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
