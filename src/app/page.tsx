import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <p className="eyebrow">NAVER Maps MVP</p>
        <h1>KGeoGuessr</h1>
        <p className="hero-copy">
          네이버 거리뷰를 보고 대한민국 어디인지 맞히는 5라운드 웹 게임입니다.
        </p>
        <div className="landing-actions">
          <Link href="/play" className="button button-primary">
            게임 시작
          </Link>
        </div>
      </section>

      <section className="landing-grid">
        <Card>
          <h3>문제 출제</h3>
          <p>사전 검증한 파노라마 포인트를 5개 샘플링해 런타임 API 낭비를 줄입니다.</p>
        </Card>
        <Card>
          <h3>정답 판정</h3>
          <p>서버에서 거리와 점수를 계산하고, 클라이언트는 결과 렌더링만 담당합니다.</p>
        </Card>
        <Card>
          <h3>주소 공개</h3>
          <p>결과 화면에서만 Reverse Geocoding을 호출해 비용을 통제합니다.</p>
        </Card>
      </section>
    </main>
  );
}
