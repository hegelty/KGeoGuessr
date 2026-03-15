import { NextResponse } from "next/server";
import { haversineDistanceKm } from "@/lib/game/distance";
import { calculateRoundScore } from "@/lib/game/score";
import { readSession, writeSession } from "@/lib/game/session";
import { toGameSnapshot } from "@/lib/game/snapshot";
import { isLatLng } from "@/lib/game/validators";

export async function POST(request: Request) {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ message: "No active game session." }, { status: 404 });
  }

  if (session.currentRoundIndex >= session.rounds.length) {
    return NextResponse.json({ message: "Game already finished." }, { status: 400 });
  }

  if (session.results[session.currentRoundIndex]) {
    return NextResponse.json({ message: "Current round already submitted." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !isLatLng(body.guess)) {
    return NextResponse.json({ message: "Invalid guess coordinates." }, { status: 400 });
  }

  const round = session.rounds[session.currentRoundIndex];
  const answer = round.panorama.resolvedPosition ?? round.panorama.position;
  const distanceKm = haversineDistanceKm(body.guess, answer);
  const score = calculateRoundScore(distanceKm);

  session.results.push({
    roundId: round.id,
    roundNumber: session.currentRoundIndex + 1,
    guess: body.guess,
    answer,
    distanceKm,
    score,
  });
  session.totalScore += score;

  await writeSession(session);

  return NextResponse.json(toGameSnapshot(session));
}
