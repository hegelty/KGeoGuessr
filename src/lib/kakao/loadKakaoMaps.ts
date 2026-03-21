let kakaoMapsPromise: Promise<any> | null = null;

function getKakaoLoadError() {
  return new Error(
    "Kakao Maps SDK did not initialize. Check NEXT_PUBLIC_KAKAO_MAPS_APP_KEY and allowed localhost domains.",
  );
}

function waitForKakaoMapsReady(resolve: (value: any) => void, reject: (reason?: unknown) => void) {
  const kakao = window.kakao;

  if (!kakao?.maps?.load) {
    reject(getKakaoLoadError());
    return;
  }

  try {
    kakao.maps.load(() => resolve(window.kakao));
  } catch (error) {
    reject(error instanceof Error ? error : getKakaoLoadError());
  }
}

export function loadKakaoMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao Maps can only be loaded in the browser."));
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

    const finishLoad = () => waitForKakaoMapsReady(resolve, reject);
    const existing = document.getElementById("kakao-maps-sdk") as HTMLScriptElement | null;

    if (existing) {
      if (window.kakao?.maps?.load) {
        finishLoad();
        return;
      }

      existing.addEventListener("load", finishLoad, { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Kakao Maps.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.addEventListener("load", finishLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load Kakao Maps.")), {
      once: true,
    });
    document.head.appendChild(script);
  }).catch((error) => {
    kakaoMapsPromise = null;
    throw error;
  });

  return kakaoMapsPromise;
}
