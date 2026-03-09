import type { LatLng } from "@/types/game";

export function isLatLng(value: unknown): value is LatLng {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.lat === "number" &&
    typeof candidate.lng === "number" &&
    candidate.lat >= -90 &&
    candidate.lat <= 90 &&
    candidate.lng >= -180 &&
    candidate.lng <= 180
  );
}

