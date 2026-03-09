export function calculateRoundScore(distanceKm: number) {
  const score = 5000 * Math.exp(-distanceKm / 70);
  return Math.max(0, Math.round(score));
}

