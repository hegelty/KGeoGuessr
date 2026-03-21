"use client";

import { useEffect, useState } from "react";
import { createId } from "@/lib/game/createId";
import { haversineDistanceKm } from "@/lib/game/distance";
import { selectRounds } from "@/lib/game/roundSelector";
import { calculateRoundScore } from "@/lib/game/score";
import { isLatLng } from "@/lib/game/validators";
import { toGameSnapshot } from "@/lib/game/snapshot";
import type { GameSession, GameSnapshot, LatLng, RoundResult, SeedRound } from "@/types/game";

const STORAGE_KEY = "kgeoguessr_session";

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

function saveSession(session: GameSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeRound(round: unknown): SeedRound | null {
  if (!round || typeof round !== "object") return null;

  const candidate = round as Record<string, unknown>;
  const panorama =
    candidate.panorama && typeof candidate.panorama === "object"
      ? (candidate.panorama as Record<string, unknown>)
      : null;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.region !== "string" ||
    !panorama ||
    !isLatLng(panorama.position)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    region: candidate.region,
    panorama: {
      position: panorama.position,
      panoId: typeof panorama.panoId === "string" ? panorama.panoId : undefined,
      resolvedPanoId: typeof panorama.resolvedPanoId === "string" ? panorama.resolvedPanoId : null,
      resolvedPosition: isLatLng(panorama.resolvedPosition) ? panorama.resolvedPosition : null,
      initialPov:
        panorama.initialPov &&
        typeof panorama.initialPov === "object" &&
        isFiniteNumber((panorama.initialPov as Record<string, unknown>).pan) &&
        isFiniteNumber((panorama.initialPov as Record<string, unknown>).tilt) &&
        isFiniteNumber((panorama.initialPov as Record<string, unknown>).fov)
          ? {
              pan: (panorama.initialPov as Record<string, number>).pan,
              tilt: (panorama.initialPov as Record<string, number>).tilt,
              fov: (panorama.initialPov as Record<string, number>).fov,
            }
          : undefined,
    },
  };
}

function sanitizeResult(result: unknown): RoundResult | null {
  if (!result || typeof result !== "object") return null;

  const candidate = result as Record<string, unknown>;
  if (
    typeof candidate.roundId !== "string" ||
    !isFiniteNumber(candidate.roundNumber) ||
    !isLatLng(candidate.guess) ||
    !isLatLng(candidate.answer) ||
    !isFiniteNumber(candidate.distanceKm) ||
    !isFiniteNumber(candidate.score)
  ) {
    return null;
  }

  return {
    roundId: candidate.roundId,
    roundNumber: candidate.roundNumber,
    guess: candidate.guess,
    answer: candidate.answer,
    distanceKm: candidate.distanceKm,
    score: candidate.score,
  };
}

function sanitizeSession(value: unknown): GameSession | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const rounds = Array.isArray(candidate.rounds)
    ? candidate.rounds.map(sanitizeRound).filter((round): round is SeedRound => round !== null)
    : [];

  if (
    typeof candidate.sessionId !== "string" ||
    !isFiniteNumber(candidate.currentRoundIndex) ||
    !isFiniteNumber(candidate.totalScore) ||
    typeof candidate.startedAt !== "string" ||
    rounds.length === 0
  ) {
    return null;
  }

  const results = Array.isArray(candidate.results)
    ? candidate.results.map(sanitizeResult).filter((result): result is RoundResult => result !== null)
    : [];
  const maxRoundIndex = rounds.length - 1;
  const currentRoundIndex = Math.max(0, Math.min(candidate.currentRoundIndex, maxRoundIndex));

  return {
    sessionId: candidate.sessionId,
    currentRoundIndex,
    totalScore: candidate.totalScore,
    rounds,
    results: results.slice(0, rounds.length),
    startedAt: candidate.startedAt,
  };
}

function loadSession(): GameSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return sanitizeSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function useGameSession() {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const existing = loadSession();
      const session =
        existing && existing.rounds.length === 1 && existing.currentRoundIndex < existing.rounds.length
          ? existing
          : createSession();

      saveSession(session);
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
      saveSession(session);
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

      const session = loadSession();
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

      saveSession(session);
      setSnapshot(toGameSnapshot(session));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to submit guess.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resolvePanorama(roundId: string, panoId: string, position: LatLng) {
    try {
      const session = loadSession();
      if (!session || session.currentRoundIndex >= session.rounds.length) return;

      const round = session.rounds[session.currentRoundIndex];
      if (!round || round.id !== roundId || session.results[session.currentRoundIndex]) return;

      round.panorama.resolvedPanoId = panoId;
      round.panorama.resolvedPosition = position;

      saveSession(session);
    } catch {
      // Best-effort sync only. Guess scoring still falls back to the seed position.
    }
  }

  return {
    snapshot,
    loading,
    submitting,
    error,
    restart,
    submitGuess,
    resolvePanorama,
  };
}
