import { createId } from "@/lib/game/createId";
import { probePanorama } from "@/lib/kakao/roadviewProbe";
import type { SeedRound } from "@/types/game";

const SOUTH_KOREA_BOUNDS = {
  minLat: 33.1,
  maxLat: 38.7,
  minLng: 124.6,
  maxLng: 131.0,
} as const;

const MAX_POSITION_ATTEMPTS = 500;
const PROBE_RADIUS_METERS = 200;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createRandomPosition() {
  return {
    lat: randomBetween(SOUTH_KOREA_BOUNDS.minLat, SOUTH_KOREA_BOUNDS.maxLat),
    lng: randomBetween(SOUTH_KOREA_BOUNDS.minLng, SOUTH_KOREA_BOUNDS.maxLng),
  };
}

function createRound(position: SeedRound["panorama"]["position"], panoId: string): SeedRound {
  return {
    id: createId(),
    panorama: {
      position,
      panoId,
      initialPov: {
        pan: randomBetween(-180, 180),
        tilt: randomBetween(-4, 9),
        fov: randomBetween(92, 100),
      },
    },
  };
}

async function createRandomRound() {
  for (let attempt = 0; attempt < MAX_POSITION_ATTEMPTS; attempt += 1) {
    const candidate = createRandomPosition();
    const probeResult = await probePanorama(candidate, PROBE_RADIUS_METERS);

    if (probeResult.status === "OK" && probeResult.panoId) {
      return createRound(candidate, probeResult.panoId);
    }
  }

  throw new Error("로드뷰 가능한 랜덤 위치를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.");
}

export async function selectRounds(count = 1): Promise<SeedRound[]> {
  const safeCount = Math.max(0, Math.floor(count));
  const rounds: SeedRound[] = [];

  while (rounds.length < safeCount) {
    rounds.push(await createRandomRound());
  }

  return rounds;
}
