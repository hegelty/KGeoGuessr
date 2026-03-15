"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { loadKakaoMaps } from "@/lib/kakao/loadKakaoMaps";
import type { LatLng, PanoramaSeed } from "@/types/game";

type ResolvedPanoramaPayload = {
  panoId: string;
  position: LatLng;
};

type Props = {
  panorama: PanoramaSeed;
  onInitialLocationResolved?: (payload: ResolvedPanoramaPayload) => void;
  onInitialLocationUnavailable?: () => void;
};

export function PanoramaViewer({
  panorama,
  onInitialLocationResolved,
  onInitialLocationUnavailable,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const roadviewRef = useRef<any>(null);
  const initialPanoIdRef = useRef<number | null>(null);
  const initialPositionRef = useRef<any>(null);
  const initialViewpointRef = useRef<any>(null);
  const onInitialLocationResolvedRef = useRef(onInitialLocationResolved);
  const onInitialLocationUnavailableRef = useRef(onInitialLocationUnavailable);
  const reportedInitialLocationRef = useRef(false);
  const reportedUnavailableRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  onInitialLocationResolvedRef.current = onInitialLocationResolved;
  onInitialLocationUnavailableRef.current = onInitialLocationUnavailable;

  useEffect(() => {
    let disposed = false;
    let cleanupListeners: (() => void) | undefined;

    async function mount() {
      try {
        const kakao = await loadKakaoMaps();
        if (!containerRef.current || disposed) return;

        containerRef.current.innerHTML = "";

        const rv = new kakao.maps.Roadview(containerRef.current);
        const rvClient = new kakao.maps.RoadviewClient();
        const requestedPosition = new kakao.maps.LatLng(panorama.position.lat, panorama.position.lng);
        const pov = panorama.initialPov ?? { pan: 0, tilt: 0, fov: 100 };
        const viewpoint = { pan: pov.pan, tilt: pov.tilt, zoom: 0 };

        roadviewRef.current = rv;
        initialPositionRef.current = requestedPosition;
        initialViewpointRef.current = viewpoint;

        const captureInitialLocation = () => {
          if (disposed || reportedInitialLocationRef.current || roadviewRef.current !== rv) {
            return;
          }

          const nextPosition = rv.getPosition?.();
          const nextViewpoint = rv.getViewpointWithPanoId?.();
          const lat = nextPosition?.getLat?.();
          const lng = nextPosition?.getLng?.();
          const panoId = nextViewpoint?.panoId;

          if (
            typeof lat !== "number" ||
            typeof lng !== "number" ||
            typeof panoId !== "number" ||
            !Number.isFinite(panoId)
          ) {
            return;
          }

          reportedInitialLocationRef.current = true;
          initialPanoIdRef.current = panoId;
          initialPositionRef.current = nextPosition;
          onInitialLocationResolvedRef.current?.({
            panoId: String(panoId),
            position: { lat, lng },
          });
        };

        const reportUnavailable = () => {
          if (disposed || reportedUnavailableRef.current) return;
          reportedUnavailableRef.current = true;
          setReady(false);
          onInitialLocationUnavailableRef.current?.();
        };

        const initHandler = () => captureInitialLocation();
        const panoHandler = () => captureInitialLocation();
        const positionHandler = () => captureInitialLocation();

        kakao.maps.event.addListener(rv, "init", initHandler);
        kakao.maps.event.addListener(rv, "panoid_changed", panoHandler);
        kakao.maps.event.addListener(rv, "position_changed", positionHandler);

        cleanupListeners = () => {
          kakao.maps.event.removeListener(rv, "init", initHandler);
          kakao.maps.event.removeListener(rv, "panoid_changed", panoHandler);
          kakao.maps.event.removeListener(rv, "position_changed", positionHandler);
        };

        const applyInitialView = (panoId: number) => {
          if (disposed) return;
          initialPanoIdRef.current = panoId;
          rv.setPanoId(panoId, requestedPosition);
          rv.setViewpoint(viewpoint);
          setReady(true);
        };

        if (panorama.panoId) {
          const parsedPanoId = Number(panorama.panoId);
          if (Number.isFinite(parsedPanoId)) {
            applyInitialView(parsedPanoId);
          } else {
            reportUnavailable();
          }
        } else {
          rvClient.getNearestPanoId(requestedPosition, 50, (panoId: number | null) => {
            if (disposed) return;
            if (panoId === null) {
              reportUnavailable();
            } else {
              applyInitialView(panoId);
            }
          });
        }

        setTimeout(() => {
          if (!disposed && roadviewRef.current === rv) {
            rv.relayout();
            captureInitialLocation();
          }
        }, 100);
      } catch (nextError) {
        if (disposed) return;
        setError(nextError instanceof Error ? nextError.message : "Kakao Maps load failed.");
        setReady(false);
      }
    }

    setError(null);
    setReady(false);
    reportedInitialLocationRef.current = false;
    reportedUnavailableRef.current = false;
    roadviewRef.current = null;
    initialPanoIdRef.current = null;
    initialPositionRef.current = null;
    initialViewpointRef.current = null;
    void mount();

    return () => {
      disposed = true;
      cleanupListeners?.();
      roadviewRef.current = null;
      initialPanoIdRef.current = null;
      initialPositionRef.current = null;
      initialViewpointRef.current = null;
    };
  }, [
    panorama.initialPov?.fov,
    panorama.initialPov?.pan,
    panorama.initialPov?.tilt,
    panorama.panoId,
    panorama.position.lat,
    panorama.position.lng,
  ]);

  function handleResetView() {
    if (
      !ready ||
      !roadviewRef.current ||
      initialPanoIdRef.current === null ||
      !initialPositionRef.current ||
      !initialViewpointRef.current
    ) {
      return;
    }

    roadviewRef.current.setPanoId(initialPanoIdRef.current, initialPositionRef.current);
    roadviewRef.current.setViewpoint(initialViewpointRef.current);
  }

  return (
    <div className="panorama-viewer">
      <div ref={containerRef} className="panorama-viewer-canvas" />
      <div className="panorama-controls">
        <Button
          className="button-ghost roadview-reset-button"
          onClick={handleResetView}
          disabled={!ready}
        >
          원래 위치
        </Button>
      </div>
      {error ? <div className="panel-error">{error}</div> : null}
    </div>
  );
}
