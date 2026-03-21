import { loadKakaoMaps } from "@/lib/kakao/loadKakaoMaps";
import type { LatLng } from "@/types/game";

type ProbeResult = {
  panoId: string | null;
  status: "OK" | "ERROR";
};

export async function probePanorama(candidate: LatLng, radiusMeters = 200): Promise<ProbeResult> {
  const kakao = await loadKakaoMaps();
  const rvClient = new kakao.maps.RoadviewClient();
  const position = new kakao.maps.LatLng(candidate.lat, candidate.lng);

  return new Promise((resolve) => {
    rvClient.getNearestPanoId(position, radiusMeters, (panoId: number | null) => {
      if (panoId === null) {
        resolve({ panoId: null, status: "ERROR" });
      } else {
        resolve({
          panoId: String(panoId),
          status: "OK",
        });
      }
    });
  });
}
