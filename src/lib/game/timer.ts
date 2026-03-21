export const ROUND_TIME_LIMIT_OPTIONS = [60, 120, 180] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function hasTimeLimit(timeLimitSeconds: number | null): timeLimitSeconds is number {
  return typeof timeLimitSeconds === "number" && Number.isFinite(timeLimitSeconds) && timeLimitSeconds > 0;
}

function formatDurationSeconds(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getTimeLimitMs(timeLimitSeconds: number | null) {
  if (!hasTimeLimit(timeLimitSeconds)) {
    return null;
  }

  return Math.max(1, timeLimitSeconds) * 1000;
}

export function getElapsedMs(roundStartedAt: string | null, now = Date.now()) {
  if (!roundStartedAt) {
    return 0;
  }

  const startedAt = Date.parse(roundStartedAt);

  if (!Number.isFinite(startedAt)) {
    return 0;
  }

  return Math.max(0, now - startedAt);
}

export function clampElapsedMs(elapsedMs: number, timeLimitSeconds: number | null) {
  const timeLimitMs = getTimeLimitMs(timeLimitSeconds);

  if (timeLimitMs === null) {
    return Math.max(0, elapsedMs);
  }

  return clamp(elapsedMs, 0, timeLimitMs);
}

export function getClampedElapsedMs(roundStartedAt: string | null, timeLimitSeconds: number | null, now = Date.now()) {
  return clampElapsedMs(getElapsedMs(roundStartedAt, now), timeLimitSeconds);
}

export function getRemainingMs(roundStartedAt: string | null, timeLimitSeconds: number | null, now = Date.now()) {
  const timeLimitMs = getTimeLimitMs(timeLimitSeconds);

  if (timeLimitMs === null || !roundStartedAt) {
    return null;
  }

  return Math.max(0, timeLimitMs - getElapsedMs(roundStartedAt, now));
}

export function formatElapsedMs(elapsedMs: number) {
  return formatDurationSeconds(Math.floor(Math.max(0, elapsedMs) / 1000));
}

export function formatRemainingMs(remainingMs: number) {
  return formatDurationSeconds(Math.ceil(Math.max(0, remainingMs) / 1000));
}

export function formatTimeLimitSeconds(timeLimitSeconds: number | null) {
  if (!hasTimeLimit(timeLimitSeconds)) {
    return "없음";
  }

  return formatDurationSeconds(Math.max(0, timeLimitSeconds));
}
