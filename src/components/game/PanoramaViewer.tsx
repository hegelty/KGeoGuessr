"use client";

import { useEffect, useRef, useState } from "react";
import { loadNaverMaps } from "@/lib/naver/loadNaverMaps";
import type { PanoramaSeed } from "@/types/game";

type Props = {
  panorama: PanoramaSeed;
};

export function PanoramaViewer({ panorama }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let panoramaInstance: any = null;
    let disposed = false;

    async function mount() {
      try {
        const naver = await loadNaverMaps();
        if (!containerRef.current || disposed) return;

        const options: Record<string, unknown> = {
          size: new naver.maps.Size(containerRef.current.clientWidth, containerRef.current.clientHeight),
          pov: panorama.initialPov ?? { pan: 0, tilt: 0, fov: 100 },
        };

        if (panorama.panoId) {
          options.panoId = panorama.panoId;
        } else {
          options.position = new naver.maps.LatLng(panorama.position.lat, panorama.position.lng);
        }

        panoramaInstance = new naver.maps.Panorama(containerRef.current, options);

        naver.maps.Event.addListener(panoramaInstance, "pano_status", (status: string) => {
          if (status !== "OK") {
            setError("파노라마를 불러오지 못했습니다. 다른 라운드 데이터로 교체가 필요합니다.");
          }
        });
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "NAVER Maps load failed.");
      }
    }

    setError(null);
    void mount();

    return () => {
      disposed = true;
      panoramaInstance?.destroy?.();
    };
  }, [panorama]);

  return (
    <div className="panorama-shell">
      <div ref={containerRef} className="panorama-canvas" />
      {error ? <div className="panel-error">{error}</div> : null}
    </div>
  );
}

