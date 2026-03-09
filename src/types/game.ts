export type LatLng = {
  lat: number;
  lng: number;
};

export type PanoramaSeed = {
  panoId?: string;
  position: LatLng;
  initialPov?: {
    pan: number;
    tilt: number;
    fov: number;
  };
};

export type SeedRound = {
  id: string;
  name: string;
  region: string;
  panorama: PanoramaSeed;
};

export type PublicRound = {
  id: string;
  roundNumber: number;
  totalRounds: number;
  name: string;
  region: string;
  panorama: PanoramaSeed;
};

export type RoundResult = {
  roundId: string;
  roundNumber: number;
  guess: LatLng;
  answer: LatLng;
  distanceKm: number;
  score: number;
};

export type GameStatus = "idle" | "playing" | "result" | "finished";

export type GameSnapshot = {
  status: GameStatus;
  currentRoundIndex: number;
  totalRounds: number;
  totalScore: number;
  currentRound: PublicRound | null;
  currentResult: RoundResult | null;
  history: RoundResult[];
};

export type GameSession = {
  sessionId: string;
  currentRoundIndex: number;
  totalScore: number;
  rounds: SeedRound[];
  results: RoundResult[];
  startedAt: string;
};

