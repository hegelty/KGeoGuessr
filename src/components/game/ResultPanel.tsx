"use client";

import { Button } from "@/components/ui/Button";
import { useReverseGeocodeCache } from "@/hooks/useReverseGeocodeCache";
import type { RoundResult } from "@/types/game";

type Props = {
  result: RoundResult;
  busy: boolean;
  onNext: () => void;
};

export function ResultPanel({ result, busy, onNext }: Props) {
  const { address, loading, error } = useReverseGeocodeCache(result.answer);

  return (
    <div className="glass-panel card" style={{ width: "100%", maxWidth: "400px", zIndex: 50 }}>
      <p className="eyebrow">Game Result</p>
      <h3 className="result-score">+{result.score.toLocaleString()}</h3>
      
      <div className="result-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <span className="result-label">오차 거리</span>
          <strong style={{ fontSize: "1.2rem", display: "block" }}>{result.distanceKm.toFixed(2)} km</strong>
        </div>
        <div>
          <span className="result-label">실제 로드뷰 좌표</span>
          <strong style={{ fontSize: "0.9rem", display: "block" }}>
            {result.answer.lat.toFixed(4)}, {result.answer.lng.toFixed(4)}
          </strong>
        </div>
      </div>
      
      <div className="result-address" style={{ marginTop: "1.5rem" }}>
        <span className="result-label" style={{ marginBottom: "0.25rem" }}>실제 주소</span>
        <strong style={{ fontSize: "1.1rem" }}>
          {loading ? "조회 중..." : address ?? "결과없음"}
        </strong>
        {error ? <p className="muted-text" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>{error}</p> : null}
      </div>
      
      <Button className="button-primary button-block" onClick={onNext} disabled={busy}>
        {busy ? "처리 중..." : "다음 랜덤 장소"}
      </Button>
    </div>
  );
}
