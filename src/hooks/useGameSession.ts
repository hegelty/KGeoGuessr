"use client";

import { useEffect, useState } from "react";
import { createId } from "@/lib/game/createId";
import { haversineDistanceKm } from "@/lib/game/distance";
import { selectRounds } from "@/lib/game/roundSelector";
import { calculateRoundScore } from "@/lib/game/score";
import {
  buildSharedSessionUrl,
  parseSharedSessionFromUrl,
  stripSharedSessionFromUrl,
} from "@/lib/game/share";
import {
  formatElapsedMs,
  formatTimeLimitSeconds,
  getClampedElapsedMs,
  getRemainingMs,
  hasTimeLimit,
} from "@/lib/game/timer";
import {
  shareMapToKakaoTalk as sendMapShareToKakaoTalk,
  shareResultToKakaoTalk as sendResultShareToKakaoTalk,
} from "@/lib/kakao/share";
import { hasActiveRound, loadStoredSession, saveStoredSession } from "@/lib/game/sessionState";
import { isLatLng } from "@/lib/game/validators";
import { toGameSnapshot } from "@/lib/game/snapshot";
import type { GameSession, GameSnapshot, LatLng, RoundResult, ShareAction } from "@/types/game";

function createSession(excludedRoundIds: string[] = []): GameSession {
  const startedAt = new Date().toISOString();

  return {
    sessionId: createId(),
    currentRoundIndex: 0,
    totalScore: 0,
    currentGuess: null,
    rounds: selectRounds(1, excludedRoundIds),
    results: [],
    startedAt,
    roundStartedAt: null,
    timeLimitSeconds: null,
  };
}

function canResolveCurrentRound(session: GameSession) {
  return (
    session.currentRoundIndex < session.rounds.length && !session.results[session.currentRoundIndex]
  );
}

function finalizeCurrentRound(session: GameSession, forceTimedOut = false) {
  if (!canResolveCurrentRound(session)) {
    throw new Error("Current round already submitted.");
  }

  const round = session.rounds[session.currentRoundIndex];
  const answer = round.panorama.resolvedPosition ?? round.panorama.position;
  const elapsedMs = getClampedElapsedMs(session.roundStartedAt, session.timeLimitSeconds);
  const remainingMs = getRemainingMs(session.roundStartedAt, session.timeLimitSeconds);
  const timedOut = hasTimeLimit(session.timeLimitSeconds) && (forceTimedOut || remainingMs === 0);
  const guess = session.currentGuess;
  const distanceKm = guess ? haversineDistanceKm(guess, answer) : null;
  const score = calculateRoundScore(distanceKm, elapsedMs, session.timeLimitSeconds);

  const result: RoundResult = {
    roundId: round.id,
    roundNumber: session.currentRoundIndex + 1,
    guess,
    answer,
    distanceKm,
    score,
    elapsedMs,
    timedOut,
  };

  session.results.push(result);
  session.totalScore += score;
  session.currentGuess = null;

  return result;
}

export function useGameSession() {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shareAction, setShareAction] = useState<ShareAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const sharing = shareAction !== null;
  const currentElapsedMs = snapshot
    ? snapshot.currentResult?.elapsedMs ??
      getClampedElapsedMs(snapshot.roundStartedAt, snapshot.timeLimitSeconds, now)
    : 0;
  const remainingMs = snapshot?.currentResult
    ? null
    : snapshot
      ? getRemainingMs(snapshot.roundStartedAt, snapshot.timeLimitSeconds, now)
      : null;

  useEffect(() => {
    if (!shareMessage) return;

    const timeoutId = window.setTimeout(() => {
      setShareMessage(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shareMessage]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const sharedSessionResult = parseSharedSessionFromUrl(window.location.href);
      let session = loadStoredSession();

      if (sharedSessionResult.kind === "ready") {
        session = sharedSessionResult.session;
        window.history.replaceState(null, "", stripSharedSessionFromUrl(window.location.href));
        setShareMessage("공유 링크에서 현재 게임을 불러왔습니다.");
      } else if (sharedSessionResult.kind === "invalid") {
        window.history.replaceState(null, "", stripSharedSessionFromUrl(window.location.href));
        setShareMessage(sharedSessionResult.message);
      }

      if (!session || !hasActiveRound(session)) {
        session = createSession();
      }

      if (
        canResolveCurrentRound(session) &&
        hasTimeLimit(session.timeLimitSeconds) &&
        getRemainingMs(session.roundStartedAt, session.timeLimitSeconds) === 0
      ) {
        finalizeCurrentRound(session, true);
      }

      saveStoredSession(session);
      setSnapshot(toGameSnapshot(session));
      setNow(Date.now());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to initialize game.");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!snapshot?.currentRound || snapshot.currentResult || !snapshot.roundStartedAt) {
      return;
    }

    const syncNow = () => {
      setNow(Date.now());
    };

    syncNow();

    const intervalId = window.setInterval(syncNow, 250);
    const nextRemainingMs = getRemainingMs(snapshot.roundStartedAt, snapshot.timeLimitSeconds);
    const timeoutId =
      nextRemainingMs === null
        ? null
        : window.setTimeout(() => {
            void submitGuess(true);
          }, nextRemainingMs + 25);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [snapshot?.currentRound?.id, snapshot?.currentResult, snapshot?.roundStartedAt, snapshot?.timeLimitSeconds]);

  async function restart(excludedRoundIds: string[] = []): Promise<GameSnapshot | null> {
    setSubmitting(true);
    setError(null);

    try {
      const session = createSession(excludedRoundIds);
      saveStoredSession(session);
      const nextSnapshot = toGameSnapshot(session);
      setSnapshot(nextSnapshot);
      setNow(Date.now());
      return nextSnapshot;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to restart game.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  function startRound(timeLimitSeconds: number | null) {
    setError(null);

    try {
      const session = loadStoredSession();
      if (!session || !canResolveCurrentRound(session) || session.roundStartedAt) {
        return;
      }

      session.currentGuess = null;
      session.roundStartedAt = new Date().toISOString();
      session.timeLimitSeconds = timeLimitSeconds;

      saveStoredSession(session);
      setSnapshot(toGameSnapshot(session));
      setNow(Date.now());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to start round.");
    }
  }

  function updateCurrentGuess(guess: LatLng | null) {
    setError(null);

    try {
      if (guess !== null && !isLatLng(guess)) {
        throw new Error("Invalid guess coordinates.");
      }

      const session = loadStoredSession();
      if (!session || !canResolveCurrentRound(session) || !session.roundStartedAt) {
        return;
      }

      session.currentGuess = guess;
      saveStoredSession(session);
      setSnapshot(toGameSnapshot(session));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update guess.");
    }
  }

  async function submitGuess(forceTimedOut = false) {
    setSubmitting(true);
    setError(null);

    try {
      const session = loadStoredSession();
      if (!session) {
        throw new Error("No active game session.");
      }

      if (session.currentRoundIndex >= session.rounds.length) {
        throw new Error("Game already finished.");
      }

      if (session.results[session.currentRoundIndex]) {
        throw new Error("Current round already submitted.");
      }

      if (!session.roundStartedAt) {
        throw new Error("먼저 게임을 시작해 주세요.");
      }

      if (!forceTimedOut && !session.currentGuess) {
        throw new Error("지도에서 추측 위치를 먼저 선택해 주세요.");
      }

      finalizeCurrentRound(session, forceTimedOut);
      saveStoredSession(session);
      setSnapshot(toGameSnapshot(session));
      setNow(Date.now());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to submit guess.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resolvePanorama(roundId: string, panoId: string, position: LatLng) {
    try {
      const session = loadStoredSession();
      if (!session || session.currentRoundIndex >= session.rounds.length) return;

      const round = session.rounds[session.currentRoundIndex];
      if (!round || round.id !== roundId || session.results[session.currentRoundIndex]) return;

      round.panorama.resolvedPanoId = panoId;
      round.panorama.resolvedPosition = position;

      saveStoredSession(session);
    } catch {
      // Best-effort sync only. Guess scoring still falls back to the seed position.
    }
  }

  function getShareContext() {
    const session = loadStoredSession();

    if (!session || !hasActiveRound(session)) {
      throw new Error("공유할 진행 중 게임이 없습니다.");
    }

    const shareUrl = buildSharedSessionUrl(session, window.location.href);
    const sharePath = (() => {
      const url = new URL(shareUrl);
      return `${url.pathname}${url.search}${url.hash}`.replace(/^\/+/, "");
    })();

    return { session, sharePath, shareUrl };
  }

  async function copyShareLink() {
    setShareAction("copy-link");
    setShareMessage(null);

    try {
      const { shareUrl } = getShareContext();

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareMessage("공유 링크를 클립보드에 복사했습니다.");
          return shareUrl;
        } catch {
          // Fall through to the prompt below.
        }
      }

      window.prompt("이 링크를 복사해 공유하세요.", shareUrl);
      setShareMessage("공유 링크를 표시했습니다.");
      return shareUrl;
    } catch (nextError) {
      setShareMessage(nextError instanceof Error ? nextError.message : "공유 링크를 만들지 못했습니다.");
      return null;
    } finally {
      setShareAction(null);
    }
  }

  async function shareGameToKakaoTalk() {
    setShareAction("kakao-map");
    setShareMessage(null);

    try {
      const { session, sharePath, shareUrl } = getShareContext();
      const timeLimitDescription = hasTimeLimit(session.timeLimitSeconds)
        ? `제한 시간은 ${formatTimeLimitSeconds(session.timeLimitSeconds)}이고, `
        : "제한 시간 없이 ";

      await sendMapShareToKakaoTalk({
        sharePath,
        shareUrl,
        title: "KGeoGuessr 같이 한 판 할래?",
        contents:
          `카카오 로드뷰를 보고 대한민국 어디인지 맞히는 랜덤 한 판 게임이에요. ${timeLimitDescription}같은 맵으로 바로 들어와서 같이 맞혀볼 수 있어요.`,
      });
      setShareMessage("카카오톡 공유 창을 열었습니다.");
      return shareUrl;
    } catch (nextError) {
      setShareMessage(nextError instanceof Error ? nextError.message : "카카오톡 공유를 열지 못했습니다.");
      return null;
    } finally {
      setShareAction(null);
    }
  }

  async function shareResultToKakaoTalk(result: RoundResult) {
    setShareAction("kakao-result");
    setShareMessage(null);

    try {
      const { sharePath, shareUrl, session } = getShareContext();
      const totalScoreText = `${session.totalScore.toLocaleString()}점`;
      const elapsedText = formatElapsedMs(result.elapsedMs);
      const performanceText =
        result.distanceKm === null
          ? `${totalScoreText}, 걸린 시간 ${elapsedText}이었고 추측을 남기지 못했어요`
          : `${totalScoreText}, 걸린 시간 ${elapsedText}, 오차 ${result.distanceKm.toFixed(2)}km였어요`;
      const timeoutText = result.timedOut ? " 시간 초과로 자동 제출되었고, " : " ";

      await sendResultShareToKakaoTalk({
        sharePath,
        shareUrl,
        title: `KGeoGuessr 결과: ${totalScoreText}`,
        contents: `이번 기록은 ${performanceText}.${timeoutText}같은 맵을 바로 열어서 도전해보세요.`,
      });
      setShareMessage("카카오톡 결과 공유 창을 열었습니다.");
      return shareUrl;
    } catch (nextError) {
      setShareMessage(nextError instanceof Error ? nextError.message : "카카오톡 결과 공유를 열지 못했습니다.");
      return null;
    } finally {
      setShareAction(null);
    }
  }

  return {
    snapshot,
    loading,
    submitting,
    sharing,
    shareAction,
    error,
    shareMessage,
    currentElapsedMs,
    remainingMs,
    timeLimitSeconds: snapshot?.timeLimitSeconds ?? null,
    restart,
    startRound,
    updateCurrentGuess,
    submitGuess,
    resolvePanorama,
    copyShareLink,
    shareGameToKakaoTalk,
    shareResultToKakaoTalk,
  };
}
