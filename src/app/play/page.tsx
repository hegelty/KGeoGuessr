"use client";

import { useEffect, useRef, useState } from "react";
import {
  GUESS_MAP_ASPECT_RATIO,
  GuessMap,
  type GuessMapSize,
} from "@/components/game/GuessMap";
import { PanoramaViewer } from "@/components/game/PanoramaViewer";
import { ResultPanel } from "@/components/game/ResultPanel";
import { RoundHud } from "@/components/game/RoundHud";
import { Button } from "@/components/ui/Button";
import { useGameSession } from "@/hooks/useGameSession";
import type { LatLng } from "@/types/game";

type MapSizeBounds = {
  min: GuessMapSize;
  max: GuessMapSize;
  collapsedSize: GuessMapSize;
  defaultSize: GuessMapSize;
};

const FALLBACK_COLLAPSED_MAP_WIDTH = 440;
const FALLBACK_DEFAULT_MAP_WIDTH = 500;
const FALLBACK_COLLAPSED_MAP_SIZE: GuessMapSize = {
  width: FALLBACK_COLLAPSED_MAP_WIDTH,
  height: Math.round(FALLBACK_COLLAPSED_MAP_WIDTH / GUESS_MAP_ASPECT_RATIO),
};
const FALLBACK_DEFAULT_MAP_SIZE: GuessMapSize = {
  width: FALLBACK_DEFAULT_MAP_WIDTH,
  height: Math.round(FALLBACK_DEFAULT_MAP_WIDTH / GUESS_MAP_ASPECT_RATIO),
};
const FALLBACK_MAP_BOUNDS: MapSizeBounds = {
  min: { width: 320, height: Math.round(320 / GUESS_MAP_ASPECT_RATIO) },
  max: { width: 920, height: Math.round(920 / GUESS_MAP_ASPECT_RATIO) },
  collapsedSize: FALLBACK_COLLAPSED_MAP_SIZE,
  defaultSize: FALLBACK_DEFAULT_MAP_SIZE,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toMapSize(width: number): GuessMapSize {
  return {
    width: Math.round(width),
    height: Math.round(width / GUESS_MAP_ASPECT_RATIO),
  };
}

function clampMapSize(size: GuessMapSize, min: GuessMapSize, max: GuessMapSize): GuessMapSize {
  return toMapSize(clamp(size.width, min.width, max.width));
}

function getMapSizeBounds(viewportWidth: number, viewportHeight: number): MapSizeBounds {
  const isMobile = viewportWidth <= 768;
  const availableWidth = Math.max(220, viewportWidth - 32);
  const widthCap = isMobile ? availableWidth : Math.min(viewportWidth * 0.6, 920);
  const heightCap = isMobile
    ? Math.min(viewportHeight * 0.42, 430)
    : Math.min(viewportHeight * 0.62, 620);
  const maxWidth = Math.max(220, Math.min(widthCap, heightCap * GUESS_MAP_ASPECT_RATIO));
  const minWidthTarget = isMobile ? Math.min(240, availableWidth) : 320;
  const minWidth = Math.min(maxWidth, minWidthTarget);
  const collapsedWidthTarget = isMobile
    ? Math.min(availableWidth, 300)
    : Math.min(viewportWidth * 0.34, 440);
  const defaultWidthTarget = isMobile
    ? Math.min(availableWidth, 340)
    : Math.min(viewportWidth * 0.42, 520);
  const collapsedWidth = clamp(collapsedWidthTarget, minWidth, maxWidth);
  const defaultWidth = clamp(defaultWidthTarget, collapsedWidth, maxWidth);

  return {
    min: toMapSize(minWidth),
    max: toMapSize(maxWidth),
    collapsedSize: toMapSize(collapsedWidth),
    defaultSize: toMapSize(defaultWidth),
  };
}

export default function PlayPage() {
  const { snapshot, loading, submitting, error, restart, submitGuess, resolvePanorama } =
    useGameSession();
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [dismissedRule, setDismissedRule] = useState(false);
  const [mapSizeBounds, setMapSizeBounds] = useState<MapSizeBounds>(FALLBACK_MAP_BOUNDS);
  const [mapSize, setMapSize] = useState<GuessMapSize>(FALLBACK_COLLAPSED_MAP_SIZE);
  const [restoredMapSize, setRestoredMapSize] = useState<GuessMapSize>(FALLBACK_DEFAULT_MAP_SIZE);
  const [panoramaReady, setPanoramaReady] = useState(false);
  const [retryingPanorama, setRetryingPanorama] = useState(false);
  const failedRoundIdsRef = useRef<string[]>([]);
  const retryingPanoramaRef = useRef(false);

  const round = snapshot?.currentRound ?? null;
  const result = snapshot?.currentResult ?? null;
  const finished = snapshot?.status === "finished";
  const interactiveGuess = result ? result.guess : guess;

  useEffect(() => {
    function syncMapBounds(preserveCurrentSize: boolean) {
      const nextBounds = getMapSizeBounds(window.innerWidth, window.innerHeight);
      setMapSizeBounds(nextBounds);
      setRestoredMapSize((currentSize) =>
        preserveCurrentSize
          ? clampMapSize(currentSize, nextBounds.collapsedSize, nextBounds.max)
          : nextBounds.defaultSize,
      );
      setMapSize((currentSize) =>
        preserveCurrentSize
          ? clampMapSize(currentSize, nextBounds.min, nextBounds.max)
          : nextBounds.collapsedSize,
      );
    }

    syncMapBounds(false);
    const handleResize = () => syncMapBounds(true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setGuess(result?.guess ?? null);
    setDismissedRule(Boolean(result));
    setPanoramaReady(Boolean(result));
    setRetryingPanorama(false);
    retryingPanoramaRef.current = false;
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
            <Button className="button-primary" onClick={() => void restart()}>
              다시 시도
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="play-page">
        <div className="center-overlay glass-panel card">
          <p className="eyebrow">Game Finished</p>
          <h2>이번 게임은 종료되었습니다.</h2>
          <p className="muted-text">새 랜덤 위치로 바로 다시 시작할 수 있습니다.</p>
          <div className="button-block">
            <Button className="button-primary" onClick={() => void restart()}>
              새 랜덤 장소 시작
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!round) {
    return (
      <main className="play-page">
        <div className="center-overlay glass-panel card error-border">
          <p className="eyebrow">Session Error</p>
          <h2>현재 게임 데이터를 찾지 못했습니다.</h2>
          <div className="button-block">
            <Button className="button-primary" onClick={() => void restart()}>
              새 게임 시작
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="play-page">
      <div className="panorama-bg-layer">
        <PanoramaViewer
          panorama={round.panorama}
          onInitialLocationResolved={({ panoId, position }) => {
            setPanoramaReady(true);
            setRetryingPanorama(false);
            retryingPanoramaRef.current = false;
            failedRoundIdsRef.current = [];
            void resolvePanorama(round.id, panoId, position);
          }}
          onInitialLocationUnavailable={() => {
            if (retryingPanoramaRef.current) return;

            retryingPanoramaRef.current = true;
            setRetryingPanorama(true);
            setPanoramaReady(false);
            setGuess(null);
            setDismissedRule(true);

            const nextExcludedRoundIds = failedRoundIdsRef.current.includes(round.id)
              ? failedRoundIdsRef.current
              : [...failedRoundIdsRef.current, round.id];

            failedRoundIdsRef.current = nextExcludedRoundIds;

            void restart(nextExcludedRoundIds).finally(() => {
              setRetryingPanorama(false);
              retryingPanoramaRef.current = false;
            });
          }}
        />
      </div>

      <div className="ui-overlay-layer">
        <div className="top-hud-container">
          <div className="ui-element-interactive">
            <RoundHud
              totalScore={snapshot.totalScore}
              panoramaReady={panoramaReady}
              hasGuess={Boolean(guess)}
              canSubmit={!result && Boolean(guess) && panoramaReady}
              submitting={submitting}
              onSubmit={() => {
                if (!guess) return;
                void submitGuess(guess);
              }}
            />
          </div>
        </div>

        {!result && !guess && !dismissedRule ? (
          <div
            className="center-overlay glass-panel card"
            style={{ pointerEvents: "auto", textAlign: "center" }}
          >
            <p className="eyebrow">Game Rule</p>
            <h3>랜덤 위치 한 판 시작!</h3>
            <p className="muted-text" style={{ marginBottom: "2rem" }}>
              배경의 로드뷰를 이리저리 드래그하며 단서를 찾아보세요.
              <br />
              위치를 알아냈다면, <strong>우측 하단의 지도</strong>를 클릭해서 추측 위치를 찍어주세요.
              <br />
              실제 로드뷰가 찍힌 시작 좌표를 기준으로 점수를 계산합니다.
            </p>
            <Button className="button-primary button-block" onClick={() => setDismissedRule(true)}>
              확인했습니다 (로드뷰 보기)
            </Button>
          </div>
        ) : null}

        {error ? (
          <div
            className="center-overlay glass-panel card error-border"
            style={{ top: "30%", pointerEvents: "auto" }}
          >
            <p className="eyebrow">Error</p>
            <p className="muted-text m-0">{error}</p>
          </div>
        ) : null}

        {retryingPanorama ? (
          <div
            className="center-overlay glass-panel card"
            style={{ pointerEvents: "auto", textAlign: "center" }}
          >
            <p className="eyebrow">Searching</p>
            <h3>로드뷰 가능한 장소를 다시 찾는 중...</h3>
            <p className="muted-text">유효한 로드뷰가 나올 때까지 자동으로 다른 랜덤 위치를 시도합니다.</p>
          </div>
        ) : null}

        <div className="bottom-actions-container">
          <div className="ui-element-interactive">
            {result ? (
              <ResultPanel
                result={result}
                busy={submitting}
                onNext={() => {
                  setGuess(null);
                  setPanoramaReady(false);
                  void restart();
                }}
              />
            ) : null}
          </div>

          <div className="ui-element-interactive minimap-dock">
            <div className="minimap-container">
              <GuessMap
                guess={interactiveGuess}
                answer={result?.answer}
                interactive={!result}
                onGuessChange={(nextGuess) => setGuess(nextGuess)}
                size={mapSize}
                collapsedSize={mapSizeBounds.collapsedSize}
                restoredSize={restoredMapSize}
                minSize={mapSizeBounds.min}
                maxSize={mapSizeBounds.max}
                onSizeChange={(nextSize, reason) => {
                  const clampedVisibleSize = clampMapSize(nextSize, mapSizeBounds.min, mapSizeBounds.max);
                  setMapSize(clampedVisibleSize);

                  if (
                    (reason === "resize" || reason === "restore") &&
                    clampedVisibleSize.width > mapSizeBounds.collapsedSize.width
                  ) {
                    setRestoredMapSize(
                      clampMapSize(clampedVisibleSize, mapSizeBounds.collapsedSize, mapSizeBounds.max),
                    );
                  }
                }}
              />
              {submitting && !result ? (
                <div className="minimap-submit-overlay">
                  {retryingPanorama ? "로드뷰 가능한 장소 찾는 중..." : "API로 결과 확인중..."}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
