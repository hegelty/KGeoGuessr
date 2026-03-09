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
    <div className="hud">
      <div>
        <p className="eyebrow">Round</p>
        <h2 className="hud-value">
          {roundNumber} / {totalRounds}
        </h2>
      </div>
      <div>
        <p className="eyebrow">Total Score</p>
        <h2 className="hud-value">{totalScore.toLocaleString()}</h2>
      </div>
      <Button onClick={onSubmit} disabled={!canSubmit || submitting}>
        {submitting ? "제출 중..." : "추측 제출"}
      </Button>
    </div>
  );
}

