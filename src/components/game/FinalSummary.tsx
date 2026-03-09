import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { RoundResult } from "@/types/game";

type Props = {
  totalScore: number;
  history: RoundResult[];
  restarting: boolean;
  onRestart: () => void;
};

export function FinalSummary({ totalScore, history, restarting, onRestart }: Props) {
  const averageDistance =
    history.length === 0
      ? 0
      : history.reduce((sum, result) => sum + result.distanceKm, 0) / history.length;

  return (
    <Card className="final-summary">
      <p className="eyebrow">Game Complete</p>
      <h2 className="hero-score">{totalScore.toLocaleString()} / 25,000</h2>
      <p className="muted-text">평균 오차 {averageDistance.toFixed(2)} km</p>
      <div className="history-list">
        {history.map((result) => (
          <div key={result.roundId} className="history-row">
            <span>Round {result.roundNumber}</span>
            <span>{result.score.toLocaleString()}점</span>
            <span>{result.distanceKm.toFixed(1)} km</span>
          </div>
        ))}
      </div>
      <Button onClick={onRestart} disabled={restarting} block>
        {restarting ? "새 게임 준비 중..." : "다시 시작"}
      </Button>
    </Card>
  );
}

