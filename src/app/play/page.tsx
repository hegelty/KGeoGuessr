"use client";

import { useEffect, useState } from "react";
import { FinalSummary } from "@/components/game/FinalSummary";
import { GuessMap } from "@/components/game/GuessMap";
import { PanoramaViewer } from "@/components/game/PanoramaViewer";
import { ResultPanel } from "@/components/game/ResultPanel";
import { RoundHud } from "@/components/game/RoundHud";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGameSession } from "@/hooks/useGameSession";
import type { LatLng } from "@/types/game";

export default function PlayPage() {
  const { snapshot, loading, submitting, error, restart, submitGuess, goToNextRound } =
    useGameSession();
  const [guess, setGuess] = useState<LatLng | null>(null);

  const round = snapshot?.currentRound ?? null;
  const result = snapshot?.currentResult ?? null;
  const finished = snapshot?.status === "finished";
  const interactiveGuess = result ? result.guess : guess;

  useEffect(() => {
    if (!result) {
      setGuess(null);
    }
  }, [round?.id, result]);

  if (loading) {
    return (
      <main className="play-page">
        <Card className="center-card">
          <p className="eyebrow">Loading</p>
          <h2>게임 세션을 준비하는 중입니다.</h2>
        </Card>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="play-page">
        <Card className="center-card error-card">
          <p className="eyebrow">Startup Error</p>
          <h2>게임 세션을 준비하지 못했습니다.</h2>
          <p className="muted-text">{error ?? "알 수 없는 오류가 발생했습니다."}</p>
          <Button onClick={() => void restart()}>다시 시도</Button>
        </Card>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="play-page">
        <FinalSummary
          totalScore={snapshot.totalScore}
          history={snapshot.history}
          restarting={submitting}
          onRestart={() => {
            setGuess(null);
            void restart();
          }}
        />
      </main>
    );
  }

  if (!round) {
    return (
      <main className="play-page">
        <Card className="center-card">
          <p className="eyebrow">Session Error</p>
          <h2>현재 라운드 데이터를 찾지 못했습니다.</h2>
          <Button onClick={() => void restart()}>새 게임 시작</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="play-page">
      <section className="play-layout">
        <div className="play-stage">
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
          <Card className="stage-card">
            <div className="stage-header">
              <div>
                <p className="eyebrow">Panorama</p>
                <h2>{round.name}</h2>
              </div>
              <span className="stage-region">{round.region}</span>
            </div>
            <PanoramaViewer panorama={round.panorama} />
          </Card>
        </div>

        <aside className="play-sidebar">
          <Card className="map-card">
            <div className="stage-header">
              <div>
                <p className="eyebrow">Guess Map</p>
                <h2>{result ? "결과 지도" : "대한민국 지도"}</h2>
              </div>
            </div>
            <GuessMap
              guess={interactiveGuess}
              answer={result?.answer}
              interactive={!result}
              onGuessChange={(nextGuess) => setGuess(nextGuess)}
            />
            {!result ? (
              <p className="muted-text">지도를 클릭해 추측 위치를 찍은 뒤 제출하세요.</p>
            ) : null}
          </Card>

          {result ? (
            <ResultPanel
              result={result}
              isLastRound={round.roundNumber === round.totalRounds}
              busy={submitting}
              onNext={() => {
                setGuess(null);
                void goToNextRound();
              }}
            />
          ) : (
            <Card>
              <p className="eyebrow">Rule</p>
              <h3>이번 라운드에서 할 일</h3>
              <p className="muted-text">
                거리뷰 단서만 보고 위치를 추측하세요. MVP에서는 시간 제한 없이 5라운드를 진행합니다.
              </p>
            </Card>
          )}

          {error ? (
            <Card className="error-card">
              <p className="eyebrow">Network Error</p>
              <p>{error}</p>
            </Card>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
