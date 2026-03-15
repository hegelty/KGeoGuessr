"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao/loadKakaoMaps";
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
  const kakaoRef = useRef<any>(null);
  const guessMarkerRef = useRef<any>(null);
  const answerMarkerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);
  const clickListenerRef = useRef<any>(null);
  const onGuessChangeRef = useRef(onGuessChange);
  const [error, setError] = useState<string | null>(null);

  onGuessChangeRef.current = onGuessChange;

  // Mount logic
  useEffect(() => {
    let disposed = false;

    async function mount() {
      try {
        const kakao = await loadKakaoMaps();
        if (!containerRef.current || disposed) return;

        kakaoRef.current = kakao;
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(36.35, 127.75), // Center of Korea
          level: 13, // Appropriate zoom for full country view
        });

        mapRef.current = map;
        guessMarkerRef.current = new kakao.maps.CustomOverlay({
          map: null,
          content: '<div class="map-pin map-pin-guess"></div>',
        });
        answerMarkerRef.current = new kakao.maps.CustomOverlay({
          map: null,
          content: '<div class="map-pin map-pin-answer"></div>',
        });
        lineRef.current = new kakao.maps.Polyline({
          map: null,
          path: [],
          strokeColor: "#ffffff",
          strokeWeight: 2,
          strokeOpacity: 0.8,
          strokeStyle: "dashed"
        });
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to initialize map.");
      }
    }

    setError(null);
    void mount();

    return () => {
      disposed = true;
      if (clickListenerRef.current && kakaoRef.current) {
        kakaoRef.current.maps.event.removeListener(mapRef.current, "click", clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  }, []);

  // Set up interaction
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;

    if (!kakao || !map) return;

    if (clickListenerRef.current) {
      kakao.maps.event.removeListener(map, "click", clickListenerRef.current);
      clickListenerRef.current = null;
    }

    if (!interactive) {
      // Disable map interactions if not interactive (e.g. showing result)
      map.setDraggable(false);
      map.setZoomable(false);
      return;
    }

    // Enable map interactions
    map.setDraggable(true);
    map.setZoomable(true);

    clickListenerRef.current = (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      const nextGuess = { lat: latlng.getLat(), lng: latlng.getLng() };
      onGuessChangeRef.current?.(nextGuess);
    };

    kakao.maps.event.addListener(map, "click", clickListenerRef.current);
  }, [interactive]);

  // Handle map resizing effectively without flickering because CSS transitions are applied
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.relayout();
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    const kakao = kakaoRef.current;
    const guessMarker = guessMarkerRef.current;
    const answerMarker = answerMarkerRef.current;
    const line = lineRef.current;

    if (!map || !kakao || !guessMarker || !answerMarker || !line) return;

    if (guess) {
      const guessPosition = new kakao.maps.LatLng(guess.lat, guess.lng);
      guessMarker.setPosition(guessPosition);
      guessMarker.setMap(map);
    } else {
      guessMarker.setMap(null);
    }

    if (answer) {
      const answerPosition = new kakao.maps.LatLng(answer.lat, answer.lng);
      answerMarker.setPosition(answerPosition);
      answerMarker.setMap(map);
    } else {
      answerMarker.setMap(null);
    }

    if (guess && answer) {
      const bounds = new kakao.maps.LatLngBounds();
      bounds.extend(new kakao.maps.LatLng(guess.lat, guess.lng));
      bounds.extend(new kakao.maps.LatLng(answer.lat, answer.lng));
      line.setPath([
        new kakao.maps.LatLng(guess.lat, guess.lng),
        new kakao.maps.LatLng(answer.lat, answer.lng),
      ]);
      line.setMap(map);
      
      // Delay fitting bounds slightly to ensure resize has finished
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.setBounds(bounds, 60, 60, 60, 60);
        }
      }, 350);
    } else {
      line.setMap(null);
      line.setPath([]);
    }
  }, [guess, answer]);

  return (
    <>
      <div className="guess-map-canvas" ref={containerRef} />
      {error ? <div className="panel-error">{error}</div> : null}
    </>
  );
}
