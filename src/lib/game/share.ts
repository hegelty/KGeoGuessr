import { sanitizeSession } from "@/lib/game/sessionState";
import type { GameSession } from "@/types/game";

const SHARE_SESSION_QUERY_PARAM = "session";
const SHARE_STATE_HASH_PARAM = "state";

type SharedSessionParseResult =
  | { kind: "none" }
  | { kind: "ready"; session: GameSession }
  | { kind: "invalid"; message: string };

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function readHashParams(hash: string) {
  return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
}

export function buildSharedSessionUrl(session: GameSession, currentHref: string) {
  const url = new URL(currentHref);
  const hashParams = readHashParams(url.hash);

  url.searchParams.set(SHARE_SESSION_QUERY_PARAM, session.sessionId);
  hashParams.set(SHARE_STATE_HASH_PARAM, encodeBase64Url(JSON.stringify(session)));
  url.hash = hashParams.toString();

  return url.toString();
}

export function parseSharedSessionFromUrl(currentHref: string): SharedSessionParseResult {
  const url = new URL(currentHref);
  const sessionId = url.searchParams.get(SHARE_SESSION_QUERY_PARAM);
  const encodedState = readHashParams(url.hash).get(SHARE_STATE_HASH_PARAM);

  if (!sessionId && !encodedState) {
    return { kind: "none" };
  }

  if (!sessionId || !encodedState) {
    return { kind: "invalid", message: "공유 링크 형식이 올바르지 않습니다." };
  }

  try {
    const session = sanitizeSession(JSON.parse(decodeBase64Url(encodedState)));

    if (!session || session.sessionId !== sessionId) {
      return { kind: "invalid", message: "공유 링크가 손상되었거나 만료되었습니다." };
    }

    return { kind: "ready", session };
  } catch {
    return { kind: "invalid", message: "공유 링크를 해석하지 못했습니다." };
  }
}

export function stripSharedSessionFromUrl(currentHref: string) {
  const url = new URL(currentHref);
  const hashParams = readHashParams(url.hash);

  url.searchParams.delete(SHARE_SESSION_QUERY_PARAM);
  hashParams.delete(SHARE_STATE_HASH_PARAM);
  url.hash = hashParams.toString();

  return `${url.pathname}${url.search}${url.hash}`;
}
