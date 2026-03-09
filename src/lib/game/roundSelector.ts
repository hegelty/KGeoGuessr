import seedRounds from "@/data/verified-pano-points.json";
import type { SeedRound } from "@/types/game";

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function selectRounds(count = 5): SeedRound[] {
  const rounds = shuffle(seedRounds as SeedRound[]);

  if (rounds.length < count) {
    throw new Error("Not enough panorama seeds to start the game.");
  }

  return rounds.slice(0, count);
}

