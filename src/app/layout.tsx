import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "KGeoGuessr",
  description: "카카오 로드뷰로 대한민국 어디인지 맞히는 랜덤 한 판 웹 게임",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, width: "100vw", height: "100vh", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}

