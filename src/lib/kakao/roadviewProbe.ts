import { loadKakaoMaps } from "@/lib/kakao/loadKakaoMaps";
import type { LatLng } from "@/types/game";

type ProbeResult = {
  panoId: string | null;
  resolvedPosition: LatLng | null;
  status: "OK" | "ERROR";
};

export async function probePanorama(candidate: LatLng): Promise<ProbeResult> {
  const kakao = await loadKakaoMaps();
  const rvClient = new kakao.maps.RoadviewClient();
  const position = new kakao.maps.LatLng(candidate.lat, candidate.lng);

  return new Promise((resolve) => {
    rvClient.getNearestPanoId(position, 50, (panoId: number | null) => {
      if (panoId === null) {
        resolve({ panoId: null, resolvedPosition: null, status: "ERROR" });
      } else {
        resolve({
          panoId: String(panoId),
          resolvedPosition: candidate,
          status: "OK",
        });
      }
    });
  });
}
