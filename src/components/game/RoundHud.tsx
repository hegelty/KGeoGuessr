import { Button } from "@/components/ui/Button";

type Props = {
  roundNumber: number;
  totalRounds: number;
  totalScore: number;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
};

export function RoundHud({
  roundNumber,
  totalRounds,
  totalScore,
  canSubmit,
  submitting,
  onSubmit,
}: Props) {
  return (
    <div className="glass-panel hud-bar">
      <div className="hud-item">
        <span className="hud-label">Round</span>
        <span className="hud-value">
          {roundNumber} / {totalRounds}
        </span>
      </div>
      <div className="hud-item">
        <span className="hud-label">Score</span>
        <span className="hud-value">{totalScore.toLocaleString()}</span>
      </div>
      <div style={{ marginLeft: "auto" }}>
        <Button 
          className="button-primary" 
          onClick={onSubmit} 
          disabled={!canSubmit || submitting}
        >
          {submitting ? "제출 중..." : "추측 제출"}
        </Button>
      </div>
    </div>
  );
}
