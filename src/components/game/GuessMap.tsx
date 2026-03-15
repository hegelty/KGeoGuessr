"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao/loadKakaoMaps";
import type { LatLng } from "@/types/game";

export const GUESS_MAP_ASPECT_RATIO = 1.45;

export type GuessMapSize = {
  width: number;
  height: number;
};

type Props = {
  guess: LatLng | null;
  answer?: LatLng | null;
  interactive?: boolean;
  onGuessChange?: (guess: LatLng) => void;
  size: GuessMapSize;
  minSize: GuessMapSize;
  maxSize: GuessMapSize;
  onSizeChange?: (size: GuessMapSize) => void;
};

type ResizeState = {
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
};

type BaseMapType = "ROADMAP" | "SKYVIEW" | "HYBRID";

const MAP_TYPE_OPTIONS: Array<{ id: BaseMapType; label: string }> = [
  { id: "ROADMAP", label: "지도" },
  { id: "SKYVIEW", label: "위성" },
  { id: "HYBRID", label: "하이브리드" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function GuessMap({
  guess,
  answer = null,
  interactive = false,
  onGuessChange,
  size,
  minSize,
  maxSize,
  onSizeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const kakaoRef = useRef<any>(null);
  const guessMarkerRef = useRef<any>(null);
  const answerMarkerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);
  const clickListenerRef = useRef<any>(null);
  const onGuessChangeRef = useRef(onGuessChange);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [baseMapType, setBaseMapType] = useState<BaseMapType>("ROADMAP");
  const [terrainEnabled, setTerrainEnabled] = useState(false);

  onGuessChangeRef.current = onGuessChange;

  function setMapInteractionEnabled(enabled: boolean) {
    if (!mapRef.current) return;
    mapRef.current.setDraggable(enabled);
    mapRef.current.setZoomable(enabled);
  }

  useEffect(() => {
    let disposed = false;

    async function mount() {
      try {
        const kakao = await loadKakaoMaps();
        if (!containerRef.current || disposed) return;

        kakaoRef.current = kakao;
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(36.35, 127.75),
          level: 13,
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
          strokeStyle: "dashed",
        });
        setMapReady(true);
      } catch (nextError) {
        if (disposed) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to initialize map.");
        setMapReady(false);
      }
    }

    setError(null);
    setMapReady(false);
    void mount();

    return () => {
      disposed = true;
      if (clickListenerRef.current && kakaoRef.current && mapRef.current) {
        kakaoRef.current.maps.event.removeListener(mapRef.current, "click", clickListenerRef.current);
        clickListenerRef.current = null;
      }
      mapRef.current = null;
      kakaoRef.current = null;
      guessMarkerRef.current = null;
      answerMarkerRef.current = null;
      lineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;

    if (!kakao || !map) return;

    if (clickListenerRef.current) {
      kakao.maps.event.removeListener(map, "click", clickListenerRef.current);
      clickListenerRef.current = null;
    }

    if (!mapReady || !interactive || isResizing) {
      setMapInteractionEnabled(false);
      return;
    }

    setMapInteractionEnabled(true);

    clickListenerRef.current = (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      const nextGuess = { lat: latlng.getLat(), lng: latlng.getLng() };
      onGuessChangeRef.current?.(nextGuess);
    };

    kakao.maps.event.addListener(map, "click", clickListenerRef.current);
  }, [interactive, isResizing, mapReady]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (!mapRef.current) return;
      const center = mapRef.current.getCenter?.();
      mapRef.current.relayout();
      if (center) {
        mapRef.current.setCenter(center);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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

  useEffect(() => {
    const map = mapRef.current;
    const kakao = kakaoRef.current;

    if (!mapReady || !map || !kakao) return;

    map.setMapTypeId(kakao.maps.MapTypeId[baseMapType]);

    if (terrainEnabled) {
      map.addOverlayMapTypeId(kakao.maps.MapTypeId.TERRAIN);
    } else {
      map.removeOverlayMapTypeId(kakao.maps.MapTypeId.TERRAIN);
    }
  }, [baseMapType, mapReady, terrainEnabled]);

  const canResize = Boolean(onSizeChange);

  function updateSize(clientX: number, clientY: number) {
    const resizeState = resizeStateRef.current;
    if (!resizeState || !onSizeChange) return;

    const widthDeltaFromX = resizeState.startX - clientX;
    const widthDeltaFromY = (resizeState.startY - clientY) * GUESS_MAP_ASPECT_RATIO;
    const widthDelta =
      Math.abs(widthDeltaFromX) > Math.abs(widthDeltaFromY) ? widthDeltaFromX : widthDeltaFromY;
    const nextWidth = clamp(resizeState.startWidth + widthDelta, minSize.width, maxSize.width);

    onSizeChange({
      width: Math.round(nextWidth),
      height: Math.round(nextWidth / GUESS_MAP_ASPECT_RATIO),
    });
  }

  function endResize(target: HTMLButtonElement, pointerId: number) {
    if (resizeStateRef.current?.pointerId != pointerId) return;
    resizeStateRef.current = null;
    setIsResizing(false);
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
    if (interactive) {
      setMapInteractionEnabled(true);
    }
  }

  function handleResizePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!canResize) return;

    event.preventDefault();
    event.stopPropagation();
    resizeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: size.width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
    setMapInteractionEnabled(false);
  }

  function handleResizePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!canResize || resizeStateRef.current?.pointerId !== event.pointerId) return;

    event.preventDefault();
    updateSize(event.clientX, event.clientY);
  }

  function handleResizePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    endResize(event.currentTarget, event.pointerId);
  }

  function handleResizePointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    endResize(event.currentTarget, event.pointerId);
  }

  return (
    <div
      className={`guess-map-shell ${interactive ? "is-interactive" : "is-static"} ${isResizing ? "is-resizing" : ""}`}
      style={{ width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="guess-map-chrome">
        <div className="guess-map-badge">추측 지도</div>
        <div className="guess-map-maptype-controls" role="group" aria-label="지도 보기 선택">
          {MAP_TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`guess-map-maptype-button ${baseMapType === option.id ? "is-active" : ""}`}
              onClick={() => setBaseMapType(option.id)}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className={`guess-map-maptype-button ${terrainEnabled ? "is-active" : ""}`}
            onClick={() => setTerrainEnabled((current) => !current)}
          >
            지형
          </button>
        </div>
        <div className="guess-map-hint">
          {interactive ? "좌상단 핸들로 크기 조절" : "결과 지도를 보고 있습니다"}
        </div>
      </div>
      {canResize ? (
        <button
          type="button"
          className="guess-map-resize-handle"
          aria-label="지도 크기 조절"
          title="드래그해서 지도 크기 조절"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerCancel}
        />
      ) : null}
      <div className="guess-map-canvas" ref={containerRef} />
      {error ? <div className="panel-error">{error}</div> : null}
    </div>
  );
}
