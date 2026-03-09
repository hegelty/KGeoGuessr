import { NextResponse } from "next/server";
import { readSession } from "@/lib/game/session";
import { toGameSnapshot } from "@/lib/game/snapshot";

export async function GET() {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ message: "No active game session." }, { status: 404 });
  }

  return NextResponse.json(toGameSnapshot(session));
}

