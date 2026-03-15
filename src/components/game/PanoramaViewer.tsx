"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakao/loadKakaoMaps";
import type { PanoramaSeed } from "@/types/game";

type Props = {
  panorama: PanoramaSeed;
};

export function PanoramaViewer({ panorama }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    async function mount() {
      try {
        const kakao = await loadKakaoMaps();
        if (!containerRef.current || disposed) return;

        const rv = new kakao.maps.Roadview(containerRef.current);
        const rvClient = new kakao.maps.RoadviewClient();
        const position = new kakao.maps.LatLng(panorama.position.lat, panorama.position.lng);

        const pov = panorama.initialPov ?? { pan: 0, tilt: 0, fov: 100 };
        // Kakao uses zoom instead of fov roughly. 0 is default.
        const viewpoint = { pan: pov.pan, tilt: pov.tilt, zoom: 0 };

        if (panorama.panoId) {
          rv.setPanoId(Number(panorama.panoId), position);
          rv.setViewpoint(viewpoint);
        } else {
          rvClient.getNearestPanoId(position, 50, (panoId: number | null) => {
            if (panoId === null) {
              setError("파노라마를 불러오지 못했습니다. 다른 라운드 데이터로 교체가 필요합니다.");
            } else {
              rv.setPanoId(panoId, position);
              rv.setViewpoint(viewpoint);
            }
          });
        }

        // Add a slight delay then relayout, just in case container size was quirky on mount
        setTimeout(() => {
          if (!disposed && rv) {
            rv.relayout();
          }
        }, 100);

      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Kakao Maps load failed.");
      }
    }

    setError(null);
    void mount();

    return () => {
      disposed = true;
    };
  }, [panorama]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div 
        ref={containerRef} 
        style={{ width: "100%", height: "100%" }} 
      />
      {error ? <div className="panel-error">{error}</div> : null}
    </div>
  );
}
