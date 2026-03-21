import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { GameSession } from "@/types/game";

const COOKIE_NAME = "kgeoguessr_session";

function getSecret() {
  const secret = process.env.GAME_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing GAME_SESSION_SECRET");
  }

  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function serializeSession(session: GameSession) {
  const payload = encodeBase64Url(JSON.stringify(session));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function parseSession(value: string): GameSession | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as GameSession;
  } catch {
    return null;
  }
}

export function createSession(rounds: GameSession["rounds"]): GameSession {
  const startedAt = new Date().toISOString();

  return {
    sessionId: randomUUID(),
    currentRoundIndex: 0,
    totalScore: 0,
    currentGuess: null,
    rounds,
    results: [],
    startedAt,
    roundStartedAt: null,
    timeLimitSeconds: null,
  };
}

export async function readSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return parseSession(raw);
}

export async function writeSession(session: GameSession) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, serializeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
