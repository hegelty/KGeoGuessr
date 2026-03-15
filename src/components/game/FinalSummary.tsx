import { Button } from "@/components/ui/Button";
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
    <div className="glass-panel final-summary-content">
      <p className="eyebrow" style={{ fontSize: "1rem" }}>Game Complete</p>
      <h2 className="final-score">{totalScore.toLocaleString()}</h2>
      <p className="muted-text" style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
        평균 오차 거리: <strong style={{ color: "var(--text)" }}>{averageDistance.toFixed(2)} km</strong>
      </p>
      
      <div className="history-list" style={{ textAlign: "left", marginBottom: "3rem" }}>
        {history.map((result) => (
          <div key={result.roundId} className="history-row" style={{ display: "flex", justifyContent: "space-between", padding: "1rem 1.5rem", background: "rgba(255,255,255,0.05)", border: "none", borderBottom: "1px solid var(--line)", borderRadius: 0 }}>
            <span style={{ fontWeight: 800, color: "var(--muted)" }}>Round {result.roundNumber}</span>
            <span style={{ fontWeight: 700, color: "var(--secondary)" }}>+{result.score.toLocaleString()}점</span>
            <span style={{ color: "var(--muted)" }}>{result.distanceKm.toFixed(1)} km</span>
          </div>
        ))}
      </div>
      
      <Button 
        className="button-primary button-massive" 
        onClick={onRestart} 
        disabled={restarting} 
        style={{ width: "100%" }}
      >
        {restarting ? "새 게임 생성 중..." : "다시 플레이하기 ✨"}
      </Button>
    </div>
  );
}
