export type LatLng = {
  lat: number;
  lng: number;
};

export type PanoramaSeed = {
  panoId?: string;
  position: LatLng;
  resolvedPanoId?: string | null;
  resolvedPosition?: LatLng | null;
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
  guess: LatLng | null;
  answer: LatLng;
  distanceKm: number | null;
  score: number;
  elapsedMs: number;
  timedOut: boolean;
};

export type GameStatus = "idle" | "playing" | "result" | "finished";

export type GameSnapshot = {
  status: GameStatus;
  currentRoundIndex: number;
  totalRounds: number;
  totalScore: number;
  currentGuess: LatLng | null;
  currentRound: PublicRound | null;
  currentResult: RoundResult | null;
  history: RoundResult[];
  roundStartedAt: string | null;
  timeLimitSeconds: number | null;
};

export type GameSession = {
  sessionId: string;
  currentRoundIndex: number;
  totalScore: number;
  currentGuess: LatLng | null;
  rounds: SeedRound[];
  results: RoundResult[];
  startedAt: string;
  roundStartedAt: string | null;
  timeLimitSeconds: number | null;
};

export type ShareAction = "copy-link" | "kakao-map" | "kakao-result" | null;
