import { NextResponse } from "next/server";
import { readSession, writeSession } from "@/lib/game/session";
import { toGameSnapshot } from "@/lib/game/snapshot";

export async function POST() {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ message: "No active game session." }, { status: 404 });
  }

  if (session.currentRoundIndex >= session.rounds.length) {
    return NextResponse.json(toGameSnapshot(session));
  }

  if (!session.results[session.currentRoundIndex]) {
    return NextResponse.json({ message: "Submit the current round first." }, { status: 400 });
  }

  session.currentRoundIndex += 1;
  await writeSession(session);

  return NextResponse.json(toGameSnapshot(session));
}
