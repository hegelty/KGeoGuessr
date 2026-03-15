import { NextResponse } from "next/server";
import { selectRounds } from "@/lib/game/roundSelector";
import { createSession, writeSession } from "@/lib/game/session";
import { toGameSnapshot } from "@/lib/game/snapshot";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const excludedRoundIds = Array.isArray(body?.excludedRoundIds)
    ? body.excludedRoundIds.filter((value: unknown): value is string => typeof value === "string")
    : [];

  try {
    const session = createSession(selectRounds(1, excludedRoundIds));
    await writeSession(session);
    return NextResponse.json(toGameSnapshot(session));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create a playable game session.";
    return NextResponse.json({ message }, { status: 409 });
  }
}
