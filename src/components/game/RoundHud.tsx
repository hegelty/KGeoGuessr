import { ShareMenu } from "@/components/game/ShareMenu";
import { Button } from "@/components/ui/Button";
import { formatElapsedMs, formatRemainingMs, formatTimeLimitSeconds } from "@/lib/game/timer";
import type { ShareAction } from "@/types/game";

type Props = {
  totalScore: number;
  elapsedMs: number;
  remainingMs: number | null;
  timeLimitSeconds: number | null;
  roundStarted: boolean;
  canSubmit: boolean;
  submitting: boolean;
  sharing: boolean;
  shareAction: ShareAction;
  panoramaReady: boolean;
  hasGuess: boolean;
  shareMessage: string | null;
  onSubmit: () => void;
  onShareCopyLink: () => void;
  onShareKakao: () => void;
};

export function RoundHud({
  totalScore,
  elapsedMs,
  remainingMs,
  timeLimitSeconds,
  roundStarted,
  canSubmit,
  submitting,
  sharing,
  shareAction,
  panoramaReady,
  hasGuess,
  shareMessage,
  onSubmit,
  onShareCopyLink,
  onShareKakao,
}: Props) {
  const hasTimeLimit = timeLimitSeconds !== null && remainingMs !== null;
  const lowTime = hasTimeLimit && remainingMs <= 30_000;
  const timeText =
    timeLimitSeconds === null
      ? formatElapsedMs(elapsedMs)
      : `${formatElapsedMs(elapsedMs)} / ${formatTimeLimitSeconds(timeLimitSeconds)}`;
  const helperText = !roundStarted
    ? "제한 시간을 고르거나 제한 없이 바로 시작할 수 있습니다."
    : !panoramaReady
    ? "로드뷰 실제 위치를 확인하는 중입니다."
    : hasTimeLimit && remainingMs <= 0
      ? "제한 시간이 끝나 자동으로 결과를 정리하고 있습니다."
    : hasGuess
      ? "지도에서 다른 지점을 클릭하면 추측 위치를 다시 고를 수 있습니다."
      : hasTimeLimit
        ? "지도에서 추측 위치를 클릭해 제한 시간 안에 제출하세요."
        : "지도에서 추측 위치를 클릭해 제출하세요.";

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
      <div className="hud-item">
        <span className="hud-label">Time</span>
        <span className="hud-value">{timeText}</span>
      </div>
      {hasTimeLimit ? (
        <div className="hud-item">
          <span className="hud-label">Left</span>
          <span className={`hud-value${lowTime ? " hud-value-warning" : ""}`}>
            {formatRemainingMs(remainingMs)}
          </span>
        </div>
      ) : null}
      <p className="hud-copy">{helperText}</p>
      <div className="hud-actions">
        <ShareMenu
          sharing={sharing}
          shareAction={shareAction}
          kakaoAction="kakao-map"
          kakaoLabel="카카오톡 공유"
          onCopyLink={onShareCopyLink}
          onKakaoShare={onShareKakao}
          buttonClassName="button-secondary"
        />
        <Button className="button-primary" onClick={onSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "제출 중..." : "추측 제출"}
        </Button>
      </div>
      {shareMessage ? <p className="hud-share-feedback">{shareMessage}</p> : null}
    </div>
  );
}
