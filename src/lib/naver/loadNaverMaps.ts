let naverMapsPromise: Promise<any> | null = null;

export function loadNaverMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("NAVER Maps can only be loaded in the browser."));
  }

  if (window.naver?.maps) {
    return Promise.resolve(window.naver);
  }

  if (naverMapsPromise) {
    return naverMapsPromise;
  }

  naverMapsPromise = new Promise((resolve, reject) => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;

    if (!clientId) {
      reject(new Error("NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID is missing."));
      return;
    }

    const existing = document.getElementById("naver-maps-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.naver), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load NAVER Maps.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "naver-maps-sdk";
    script.async = true;
    script.src =
      `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=panorama,geocoder`;
    script.addEventListener("load", () => resolve(window.naver), { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load NAVER Maps.")), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return naverMapsPromise;
}

