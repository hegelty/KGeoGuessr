import { loadNaverMaps } from "@/lib/naver/loadNaverMaps";
import type { LatLng } from "@/types/game";

const addressCache = new Map<string, string>();

function cacheKey({ lat, lng }: LatLng) {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export async function reverseGeocode(location: LatLng) {
  const key = cacheKey(location);
  const cached = addressCache.get(key);

  if (cached) {
    return cached;
  }

  const naver = await loadNaverMaps();

  const address = await new Promise<string>((resolve, reject) => {
    naver.maps.Service.reverseGeocode(
      {
        location: new naver.maps.LatLng(location.lat, location.lng),
      },
      (status: string, response: any) => {
        if (status !== naver.maps.Service.Status.OK) {
          reject(new Error("Reverse geocoding failed."));
          return;
        }

        const items = response?.result?.items ?? [];
        const best = items.find((item: any) => item.isRoadAddress) ?? items[0];

        if (!best?.addrdetail) {
          reject(new Error("No reverse geocoding result."));
          return;
        }

        const detail = best.addrdetail;
        resolve(
          [detail.sido, detail.sigugun, detail.dongmyun, detail.rest]
            .filter(Boolean)
            .join(" "),
        );
      },
    );
  });

  addressCache.set(key, address);
  return address;
}

