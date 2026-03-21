import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <p className="eyebrow">Kakao Roadview Game</p>
        <h1>KGeoGuessr</h1>
        <p className="hero-copy">
          카카오 로드뷰를 보고 대한민국 어디인지 맞히는 랜덤 한 판 웹
          게임입니다.
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
          <p>
            대한민국 여러 생활권을 기준으로 새 좌표를 즉석 생성해 매번 다른 랜덤
            한 판을 시작합니다.
          </p>
        </Card>
        <Card>
          <h3>정답 판정</h3>
          <p>
            실제 로드뷰가 시작된 좌표를 기준으로 서버에서 거리와 점수를
            계산합니다.
          </p>
        </Card>
        <Card>
          <h3>주소 공개</h3>
          <p>결과 화면에서만 Reverse Geocoding을 호출해 비용을 통제합니다.</p>
        </Card>
        <Card className="developer-card">
          <h3>개발자 정보</h3>
          <div className="developer-credit-list">
            <p>
              <strong>기획 / 개발 / 디자인</strong>
              <span>hegelty</span>
            </p>
            <p>
              <strong>AI 딸깍</strong>
              <span>임예찬</span>
            </p>
          </div>
          <div className="developer-link-row">
            <a
              href="https://github.com/hegelty"
              target="_blank"
              rel="noreferrer"
              className="developer-link"
            >
              GitHub
            </a>
            <a
              href="https://hegelty.me"
              target="_blank"
              rel="noreferrer"
              className="developer-link"
            >
              hegelty.me
            </a>
          </div>
        </Card>
      </section>
    </main>
  );
}
