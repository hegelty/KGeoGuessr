"use client";

import { useEffect, useRef, useState } from "react";
import { loadNaverMaps } from "@/lib/naver/loadNaverMaps";
import type { LatLng } from "@/types/game";

type Props = {
  guess: LatLng | null;
  answer?: LatLng | null;
  interactive?: boolean;
  onGuessChange?: (guess: LatLng) => void;
};

export function GuessMap({ guess, answer = null, interactive = false, onGuessChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const naverRef = useRef<any>(null);
  const guessMarkerRef = useRef<any>(null);
  const answerMarkerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);
  const clickListenerRef = useRef<any>(null);
  const onGuessChangeRef = useRef(onGuessChange);
  const [error, setError] = useState<string | null>(null);

  onGuessChangeRef.current = onGuessChange;

  useEffect(() => {
    let disposed = false;

    async function mount() {
      try {
        const naver = await loadNaverMaps();
        if (!containerRef.current || disposed) return;

        naverRef.current = naver;
        const map = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(36.35, 127.75),
          zoom: 7,
        });

        mapRef.current = map;
        guessMarkerRef.current = new naver.maps.Marker({
          map,
          visible: false,
          icon: {
            content: '<div class="map-pin map-pin-guess"></div>',
          },
        });
        answerMarkerRef.current = new naver.maps.Marker({
          map,
          visible: false,
          icon: {
            content: '<div class="map-pin map-pin-answer"></div>',
          },
        });
        lineRef.current = new naver.maps.Polyline({
          map,
          path: [],
          strokeColor: "#e4572e",
          strokeWeight: 3,
          strokeOpacity: 0.9,
          visible: false,
        });
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to initialize map.");
      }
    }

    setError(null);
    void mount();

    return () => {
      disposed = true;
      if (clickListenerRef.current && naverRef.current) {
        naverRef.current.maps.Event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const naver = naverRef.current;
    const map = mapRef.current;

    if (!naver || !map) return;

    if (clickListenerRef.current) {
      naver.maps.Event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    if (!interactive) return;

    clickListenerRef.current = naver.maps.Event.addListener(map, "click", (event: any) => {
      const coord = event.coord;
      const nextGuess = { lat: coord.lat(), lng: coord.lng() };
      onGuessChangeRef.current?.(nextGuess);
    });
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    const naver = naverRef.current;
    const guessMarker = guessMarkerRef.current;
    const answerMarker = answerMarkerRef.current;
    const line = lineRef.current;

    if (!map || !naver || !guessMarker || !answerMarker || !line) return;

    if (guess) {
      const guessPosition = new naver.maps.LatLng(guess.lat, guess.lng);
      guessMarker.setPosition(guessPosition);
      guessMarker.setVisible(true);
      map.panTo(guessPosition);
    } else {
      guessMarker.setVisible(false);
    }

    if (answer) {
      const answerPosition = new naver.maps.LatLng(answer.lat, answer.lng);
      answerMarker.setPosition(answerPosition);
      answerMarker.setVisible(true);
    } else {
      answerMarker.setVisible(false);
    }

    if (guess && answer) {
      const bounds = new naver.maps.LatLngBounds();
      bounds.extend(new naver.maps.LatLng(guess.lat, guess.lng));
      bounds.extend(new naver.maps.LatLng(answer.lat, answer.lng));
      line.setPath([
        new naver.maps.LatLng(guess.lat, guess.lng),
        new naver.maps.LatLng(answer.lat, answer.lng),
      ]);
      line.setVisible(true);
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else {
      line.setVisible(false);
      line.setPath([]);
    }
  }, [guess, answer]);

  return (
    <div className="guess-map-shell">
      <div ref={containerRef} className="guess-map-canvas" />
      {error ? <div className="panel-error">{error}</div> : null}
    </div>
  );
}
