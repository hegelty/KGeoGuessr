import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "KGeoGuessr",
  description: "NAVER Panorama-based Korea GeoGuessr MVP",
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

