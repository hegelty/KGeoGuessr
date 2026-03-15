"use client";

import { useEffect, useState, useRef } from "react";
import type { GameSnapshot, LatLng } from "@/types/game";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function useGameSession() {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initRef = useRef(false);

  async function syncOrStart() {
    if (initRef.current) return;
    initRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const state = await fetch("/api/game/state", { cache: "no-store" });

      if (state.status === 404) {
        const created = await request<GameSnapshot>("/api/game/start", { method: "POST" });
        setSnapshot(created);
      } else if (state.ok) {
        setSnapshot((await state.json()) as GameSnapshot);
      } else {
        const payload = (await state.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Failed to load game state.");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to initialize game.");
    } finally {
      setLoading(false);
    }
  }

  async function restart() {
    setSubmitting(true);
    setError(null);

    try {
      const nextSnapshot = await request<GameSnapshot>("/api/game/start", { method: "POST" });
      setSnapshot(nextSnapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to restart game.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitGuess(guess: LatLng) {
    setSubmitting(true);
    setError(null);

    try {
      const nextSnapshot = await request<GameSnapshot>("/api/game/submit", {
        method: "POST",
        body: JSON.stringify({ guess }),
      });
      setSnapshot(nextSnapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to submit guess.");
    } finally {
      setSubmitting(false);
    }
  }

  async function goToNextRound() {
    setSubmitting(true);
    setError(null);

    try {
      const nextSnapshot = await request<GameSnapshot>("/api/game/next", {
        method: "POST",
      });
      setSnapshot(nextSnapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load next round.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    void syncOrStart();
  }, []);

  return {
    snapshot,
    loading,
    submitting,
    error,
    restart,
    submitGuess,
    goToNextRound,
  };
}

