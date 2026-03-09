import { NextResponse } from "next/server";
import { selectRounds } from "@/lib/game/roundSelector";
import { createSession, writeSession } from "@/lib/game/session";
import { toGameSnapshot } from "@/lib/game/snapshot";

export async function POST() {
  const session = createSession(selectRounds(5));
  await writeSession(session);
  return NextResponse.json(toGameSnapshot(session));
}

