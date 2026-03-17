"use client";

import { useEffect, useState } from "react";
import { haversineDistanceKm } from "@/lib/game/distance";
import { selectRounds } from "@/lib/game/roundSelector";
import { calculateRoundScore } from "@/lib/game/score";
import { toGameSnapshot } from "@/lib/game/snapshot";
import type { GameSession, GameSnapshot, LatLng } from "@/types/game";

const STORAGE_KEY = "kgeoguessr_session";

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

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

function loadSession(): GameSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as GameSession;
  } catch {
    return null;
  }
}

function isLatLng(value: LatLng | null): value is LatLng {
  if (!value) return false;

  return Number.isFinite(value.lat) && Number.isFinite(value.lng);
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
