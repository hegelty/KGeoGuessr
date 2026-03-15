import { Button } from "@/components/ui/Button";

type Props = {
  totalScore: number;
  canSubmit: boolean;
  submitting: boolean;
  panoramaReady: boolean;
  hasGuess: boolean;
  onSubmit: () => void;
};

export function RoundHud({
  totalScore,
  canSubmit,
  submitting,
  panoramaReady,
  hasGuess,
  onSubmit,
}: Props) {
  const helperText = !panoramaReady
    ? "로드뷰 실제 위치를 확인하는 중입니다."
    : hasGuess
      ? "지도에서 다른 지점을 클릭하면 추측 위치를 다시 고를 수 있습니다."
      : "지도에서 추측 위치를 클릭해 한 판을 제출하세요.";

  return (
    <div className="glass-panel hud-bar">
      <div className="hud-item">
        <span className="hud-label">Mode</span>
        <span className="hud-value">랜덤 한 판</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">Score</span>
        <span className="hud-value">{totalScore.toLocaleString()}</span>
      </div>
      <p className="hud-copy">{helperText}</p>
      <div style={{ marginLeft: "auto" }}>
        <Button className="button-primary" onClick={onSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "제출 중..." : "추측 제출"}
        </Button>
      </div>
    </div>
  );
}
