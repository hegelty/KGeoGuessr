const MAX_SCORE = 5000;
const DISTANCE_DECAY_KM = 70;
const MAX_TIME_PENALTY_RATIO = 0.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateRoundScore(
  distanceKm: number | null,
  elapsedMs: number,
  timeLimitSeconds: number | null,
) {
  if (distanceKm === null) {
    return 0;
  }

  const distanceScore = MAX_SCORE * Math.exp(-distanceKm / DISTANCE_DECAY_KM);
  if (timeLimitSeconds === null) {
    return Math.max(0, Math.round(distanceScore));
  }

  const timeLimitMs = Math.max(1, timeLimitSeconds) * 1000;
  const elapsedRatio = clamp(elapsedMs / timeLimitMs, 0, 1);
  const timeMultiplier = 1 - elapsedRatio * MAX_TIME_PENALTY_RATIO;
  const score = distanceScore * timeMultiplier;

  return Math.max(0, Math.round(score));
}
