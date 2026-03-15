let kakaoMapsPromise: Promise<any> | null = null;

export function loadKakaoMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao Maps can only be loaded in the browser."));
  }

  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao);
  }

  if (kakaoMapsPromise) {
    return kakaoMapsPromise;
  }

  kakaoMapsPromise = new Promise((resolve, reject) => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY;

    if (!appKey) {
      reject(new Error("NEXT_PUBLIC_KAKAO_MAPS_APP_KEY is missing."));
      return;
    }

    const existing = document.getElementById("kakao-maps-sdk");
    if (existing) {
      existing.addEventListener("load", () => {
        window.kakao.maps.load(() => resolve(window.kakao));
      }, { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Kakao Maps.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.addEventListener("load", () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load Kakao Maps.")), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return kakaoMapsPromise;
}
