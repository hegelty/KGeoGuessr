import { loadKakaoMaps } from "@/lib/kakao/loadKakaoMaps";
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

  const kakao = await loadKakaoMaps();
  const geocoder = new kakao.maps.services.Geocoder();

  const address = await new Promise<string>((resolve, reject) => {
    geocoder.coord2Address(location.lng, location.lat, (result: any, status: any) => {
      if (status === kakao.maps.services.Status.OK) {
        const item = result[0];
        const addr = item.road_address ? item.road_address.address_name : item.address.address_name;
        resolve(addr);
      } else {
        reject(new Error("Reverse geocoding failed."));
      }
    });
  });

  addressCache.set(key, address);
  return address;
}
