"use client";

import { useEffect, useState } from "react";
import { FinalSummary } from "@/components/game/FinalSummary";
import { GuessMap } from "@/components/game/GuessMap";
import { PanoramaViewer } from "@/components/game/PanoramaViewer";
import { ResultPanel } from "@/components/game/ResultPanel";
import { RoundHud } from "@/components/game/RoundHud";
import { Button } from "@/components/ui/Button";
import { useGameSession } from "@/hooks/useGameSession";
import type { LatLng } from "@/types/game";

export default function PlayPage() {
  const { snapshot, loading, submitting, error, restart, submitGuess, goToNextRound } =
    useGameSession();
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [dismissedRule, setDismissedRule] = useState(false);

  const round = snapshot?.currentRound ?? null;
  const result = snapshot?.currentResult ?? null;
  const finished = snapshot?.status === "finished";
  const interactiveGuess = result ? result.guess : guess;

  useEffect(() => {
    if (!result) {
      setGuess(null);
      setDismissedRule(false); // Reset rule popup for new rounds if desired, or keep it dismissed
    }
  }, [round?.id, result]);

  if (loading) {
    return (
      <main className="play-page">
        <div className="center-overlay glass-panel card">
          <p className="eyebrow">Loading</p>
          <h2>세션 불러오는 중...</h2>
        </div>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="play-page">
        <div className="center-overlay glass-panel card error-border">
          <p className="eyebrow">Startup Error</p>
          <h2>게임 세션을 준비하지 못했습니다.</h2>
          <p className="muted-text">{error ?? "알 수 없는 오류가 발생했습니다."}</p>
          <div className="button-block">
            <Button className="button-primary" onClick={() => void restart()}>다시 시도</Button>
          </div>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="play-page">
        {/* We still show the last panorama in the background, but mostly covered by the final summary */}
        {round && (
          <div className="panorama-bg-layer">
            <PanoramaViewer panorama={round.panorama} />
          </div>
        )}
        <div className="final-summary-overlay">
          <FinalSummary
            totalScore={snapshot.totalScore}
            history={snapshot.history}
            restarting={submitting}
            onRestart={() => {
              setGuess(null);
              void restart();
            }}
          />
        </div>
      </main>
    );
  }

  if (!round) {
    return (
      <main className="play-page">
        <div className="center-overlay glass-panel card error-border">
          <p className="eyebrow">Session Error</p>
          <h2>현재 라운드 데이터를 찾지 못했습니다.</h2>
          <div className="button-block">
            <Button className="button-primary" onClick={() => void restart()}>새 게임 시작</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="play-page">
      {/* 1. Background Layer (Kakao Roadview) */}
      <div className="panorama-bg-layer">
        <PanoramaViewer panorama={round.panorama} />
      </div>

      {/* 2. UI Overlay Layer */}
      <div className="ui-overlay-layer">
        
        {/* Top HUD */}
        <div className="top-hud-container">
          <div className="ui-element-interactive">
            <RoundHud
              roundNumber={round.roundNumber}
              totalRounds={round.totalRounds}
              totalScore={snapshot.totalScore}
              canSubmit={!result && Boolean(guess)}
              submitting={submitting}
              onSubmit={() => {
                if (!guess) return;
                void submitGuess(guess);
              }}
            />
          </div>
        </div>

        {/* Center Prompt (Only when no guess AND no result) */}
        {!result && !guess && !dismissedRule && (
          <div className="center-overlay glass-panel card" style={{ pointerEvents: 'auto', textAlign: 'center' }}>
            <p className="eyebrow">Round Rule</p>
            <h3>라운드 {round.roundNumber} 시작!</h3>
            <p className="muted-text" style={{ marginBottom: "2rem" }}>
              배경의 로드뷰를 이리저리 드래그하며 단서를 찾아보세요.<br/>
              위치를 알아냈다면, <strong>우측 하단의 미니맵</strong>을 클릭해서 정답 위치를 찍어주세요!
            </p>
            <Button className="button-primary button-block" onClick={() => setDismissedRule(true)}>
              확인했습니다 (로드뷰 보기)
            </Button>
          </div>
        )}

        {/* Center Error Toast (if any) */}
        {error && (
          <div className="center-overlay glass-panel card error-border" style={{ top: '30%', pointerEvents: 'auto' }}>
            <p className="eyebrow">Error</p>
            <p className="muted-text m-0">{error}</p>
          </div>
        )}

        {/* Bottom Area (Result Panel & Minimap) */}
        <div className="bottom-actions-container">
          
          <div className="ui-element-interactive">
            {result && (
              <ResultPanel
                result={result}
                isLastRound={round.roundNumber === round.totalRounds}
                busy={submitting}
                onNext={() => {
                  setGuess(null);
                  void goToNextRound();
                }}
              />
            )}
          </div>
          
          {/* Minimap (Guesses) */}
          <div className={`ui-element-interactive minimap-container ${!result ? 'is-interactive' : 'is-expanded'}`}>
            <GuessMap
              guess={interactiveGuess}
              answer={result?.answer}
              interactive={!result}
              onGuessChange={(nextGuess) => setGuess(nextGuess)}
            />
            {submitting && !result && (
              <div className="minimap-submit-overlay">
                API로 결과 확인중...
              </div>
            )}
          </div>
          
        </div>

      </div>
    </main>
  );
}
