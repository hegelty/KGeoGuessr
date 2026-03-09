import { loadNaverMaps } from "@/lib/naver/loadNaverMaps";
import type { LatLng } from "@/types/game";

type ProbeResult = {
  panoId: string | null;
  resolvedPosition: LatLng | null;
  status: "OK" | "ERROR";
};

export async function probePanorama(candidate: LatLng): Promise<ProbeResult> {
  const naver = await loadNaverMaps();

  return new Promise((resolve) => {
    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed",
      left: "-9999px",
      top: "-9999px",
      width: "1px",
      height: "1px",
    });
    document.body.appendChild(container);

    const panorama = new naver.maps.Panorama(container, {
      position: new naver.maps.LatLng(candidate.lat, candidate.lng),
      size: new naver.maps.Size(1, 1),
    });

    naver.maps.Event.addListener(panorama, "pano_status", (status: "OK" | "ERROR") => {
      if (status !== "OK") {
        panorama.destroy?.();
        container.remove();
        resolve({ panoId: null, resolvedPosition: null, status });
        return;
      }

      const location = panorama.getLocation?.();
      const resolvedPosition = location?.coord
        ? {
            lat: location.coord.lat(),
            lng: location.coord.lng(),
          }
        : null;

      panorama.destroy?.();
      container.remove();
      resolve({
        panoId: location?.panoId ?? null,
        resolvedPosition,
        status,
      });
    });
  });
}
