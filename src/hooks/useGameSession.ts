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
  shareMapToKakaoTalk as sendMapShareToKakaoTalk,
  shareResultToKakaoTalk as sendResultShareToKakaoTalk,
} from "@/lib/kakao/share";
import { hasActiveRound, loadStoredSession, saveStoredSession } from "@/lib/game/sessionState";
import { isLatLng } from "@/lib/game/validators";
import { toGameSnapshot } from "@/lib/game/snapshot";
import type { GameSession, GameSnapshot, LatLng, RoundResult, ShareAction } from "@/types/game";

function createSession(excludedRoundIds: string[] = []): GameSession {
  return {
    sessionId: createId(),
    currentRoundIndex: 0,
    totalScore: 0,
    rounds: selectRounds(1, excludedRoundIds),
    results: [],
    startedAt: new Date().toISOString(),
  };
}

export function useGameSession() {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shareAction, setShareAction] = useState<ShareAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const sharing = shareAction !== null;

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

      saveStoredSession(session);
      setSnapshot(toGameSnapshot(session));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to initialize game.");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  async function restart(excludedRoundIds: string[] = []): Promise<GameSnapshot | null> {
    setSubmitting(true);
    setError(null);

    try {
      const session = createSession(excludedRoundIds);
      saveStoredSession(session);
      const nextSnapshot = toGameSnapshot(session);
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to restart game.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function submitGuess(guess: LatLng) {
    setSubmitting(true);
    setError(null);

    try {
      if (!isLatLng(guess)) {
        throw new Error("Invalid guess coordinates.");
      }

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

      const round = session.rounds[session.currentRoundIndex];
      const answer = round.panorama.resolvedPosition ?? round.panorama.position;
      const distanceKm = haversineDistanceKm(guess, answer);
      const score = calculateRoundScore(distanceKm);

      session.results.push({
        roundId: round.id,
        roundNumber: session.currentRoundIndex + 1,
        guess,
        answer,
        distanceKm,
        score,
      });
      session.totalScore += score;

      saveStoredSession(session);
      setSnapshot(toGameSnapshot(session));
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
      const { sharePath, shareUrl } = getShareContext();

      await sendMapShareToKakaoTalk({
        sharePath,
        shareUrl,
        title: "KGeoGuessr 같이 한 판 할래?",
        contents:
          "카카오 로드뷰를 보고 대한민국 어디인지 맞히는 랜덤 한 판 게임이에요. 같은 맵으로 바로 들어와서 같이 맞혀보세요.",
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
      const distanceText = `${result.distanceKm.toFixed(2)}km`;

      await sendResultShareToKakaoTalk({
        sharePath,
        shareUrl,
        title: `KGeoGuessr 결과: ${totalScoreText}`,
        contents: `이번 기록은 ${totalScoreText}, 오차 ${distanceText}였어요. 같은 맵을 바로 열어서 도전해보세요.`,
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
    restart,
    submitGuess,
    resolvePanorama,
    copyShareLink,
    shareGameToKakaoTalk,
    shareResultToKakaoTalk,
  };
}
