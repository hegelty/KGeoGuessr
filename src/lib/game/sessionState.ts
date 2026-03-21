import { isLatLng } from "@/lib/game/validators";
import type { GameSession, RoundResult, SeedRound } from "@/types/game";

export const STORAGE_KEY = "kgeoguessr_session";

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
    (candidate.guess !== null && !isLatLng(candidate.guess)) ||
    !isLatLng(candidate.answer) ||
    (candidate.distanceKm !== null && !isFiniteNumber(candidate.distanceKm)) ||
    !isFiniteNumber(candidate.score)
  ) {
    return null;
  }

  return {
    roundId: candidate.roundId,
    roundNumber: candidate.roundNumber,
    guess: candidate.guess === null ? null : candidate.guess,
    answer: candidate.answer,
    distanceKm: candidate.distanceKm === null ? null : candidate.distanceKm,
    score: candidate.score,
    elapsedMs: isFiniteNumber(candidate.elapsedMs) ? candidate.elapsedMs : 0,
    timedOut: candidate.timedOut === true,
  };
}

export function sanitizeSession(value: unknown): GameSession | null {
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
  const hasRoundStartedAt = Object.prototype.hasOwnProperty.call(candidate, "roundStartedAt");
  const hasTimeLimitSeconds = Object.prototype.hasOwnProperty.call(candidate, "timeLimitSeconds");

  return {
    sessionId: candidate.sessionId,
    currentRoundIndex,
    totalScore: candidate.totalScore,
    currentGuess: isLatLng(candidate.currentGuess) ? candidate.currentGuess : null,
    rounds,
    results: results.slice(0, rounds.length),
    startedAt: candidate.startedAt,
    roundStartedAt:
      hasRoundStartedAt
        ? typeof candidate.roundStartedAt === "string"
          ? candidate.roundStartedAt
          : null
        : candidate.startedAt,
    timeLimitSeconds:
      hasTimeLimitSeconds && isFiniteNumber(candidate.timeLimitSeconds) && candidate.timeLimitSeconds > 0
        ? candidate.timeLimitSeconds
        : null,
  };
}

export function loadStoredSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return sanitizeSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveStoredSession(session: GameSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function hasActiveRound(session: GameSession) {
  return session.rounds.length > 0 && session.currentRoundIndex < session.rounds.length;
}
