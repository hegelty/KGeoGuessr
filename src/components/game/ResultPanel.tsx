"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useReverseGeocodeCache } from "@/hooks/useReverseGeocodeCache";
import type { RoundResult } from "@/types/game";

type Props = {
  result: RoundResult;
  isLastRound: boolean;
  busy: boolean;
  onNext: () => void;
};

export function ResultPanel({ result, isLastRound, busy, onNext }: Props) {
  const { address, loading, error } = useReverseGeocodeCache(result.answer);

  return (
    <Card className="result-panel">
      <p className="eyebrow">Round Result</p>
      <h3 className="result-score">{result.score.toLocaleString()}점</h3>
      <div className="result-grid">
        <div>
          <span className="result-label">거리</span>
          <strong>{result.distanceKm.toFixed(2)} km</strong>
        </div>
        <div>
          <span className="result-label">정답 좌표</span>
          <strong>
            {result.answer.lat.toFixed(5)}, {result.answer.lng.toFixed(5)}
          </strong>
        </div>
        <div>
          <span className="result-label">추측 좌표</span>
          <strong>
            {result.guess.lat.toFixed(5)}, {result.guess.lng.toFixed(5)}
          </strong>
        </div>
      </div>
      <div className="result-address">
        <span className="result-label">정답 주소</span>
        <strong>
          {loading ? "주소 조회 중..." : address ?? "주소를 불러오지 못했습니다."}
        </strong>
        {error ? <p className="muted-text">{error}</p> : null}
      </div>
      <Button onClick={onNext} disabled={busy} block>
        {busy ? "처리 중..." : isLastRound ? "최종 결과 보기" : "다음 라운드"}
      </Button>
    </Card>
  );
}

