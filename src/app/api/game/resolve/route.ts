import { NextResponse } from "next/server";
import { readSession, writeSession } from "@/lib/game/session";
import type { LatLng } from "@/types/game";

function parseCoordinate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseLatLng(value: unknown): LatLng | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const lat = parseCoordinate(candidate.lat ?? candidate.La);
  const lng = parseCoordinate(candidate.lng ?? candidate.Ma);

  if (
    lat === null ||
    lng === null ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

export async function POST(request: Request) {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ ok: true });
  }

  if (session.currentRoundIndex >= session.rounds.length) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.json().catch(() => null);
  const roundId = typeof body?.roundId === "string" ? body.roundId : null;
  const panoId =
    typeof body?.panoId === "string" || typeof body?.panoId === "number"
      ? String(body.panoId)
      : null;
  const position = parseLatLng(body?.position);

  if (!roundId || !panoId || !position) {
    return NextResponse.json({ ok: true });
  }

  const round = session.rounds[session.currentRoundIndex];

  if (!round || round.id !== roundId || session.results[session.currentRoundIndex]) {
    return NextResponse.json({ ok: true });
  }

  const currentPosition = round.panorama.resolvedPosition;
  const unchanged =
    round.panorama.resolvedPanoId === panoId &&
    currentPosition?.lat === position.lat &&
    currentPosition?.lng === position.lng;

  if (!unchanged) {
    round.panorama.resolvedPanoId = panoId;
    round.panorama.resolvedPosition = position;
    await writeSession(session);
  }

  return NextResponse.json({ ok: true });
}
