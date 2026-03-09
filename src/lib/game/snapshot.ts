import type { GameSession, GameSnapshot, PublicRound, RoundResult } from "@/types/game";

function toPublicRound(session: GameSession, index: number): PublicRound | null {
  const round = session.rounds[index];

  if (!round) return null;

  return {
    id: round.id,
    roundNumber: index + 1,
    totalRounds: session.rounds.length,
    name: round.name,
    region: round.region,
    panorama: round.panorama,
  };
}

function currentResult(session: GameSession): RoundResult | null {
  return session.results[session.currentRoundIndex] ?? null;
}

export function toGameSnapshot(session: GameSession): GameSnapshot {
  const finished = session.currentRoundIndex >= session.rounds.length;

  return {
    status: finished
      ? "finished"
      : currentResult(session)
        ? "result"
        : "playing",
    currentRoundIndex: session.currentRoundIndex,
    totalRounds: session.rounds.length,
    totalScore: session.totalScore,
    currentRound: finished ? null : toPublicRound(session, session.currentRoundIndex),
    currentResult: finished ? null : currentResult(session),
    history: session.results,
  };
}

