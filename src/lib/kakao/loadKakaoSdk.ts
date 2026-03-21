const KAKAO_SDK_VERSION = "2.8.0";

let kakaoSdkPromise: Promise<any> | null = null;

function getJavascriptKey() {
  return process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY ?? process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY;
}

function ensureKakaoInitialized() {
  const key = getJavascriptKey();

  if (!key) {
    throw new Error("카카오 JavaScript 키가 없습니다.");
  }

  if (!window.Kakao) {
    throw new Error("카카오 SDK를 찾지 못했습니다.");
  }

  if (!window.Kakao.isInitialized?.()) {
    window.Kakao.init(key);
  }

  return window.Kakao;
}

export function loadKakaoSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("카카오 SDK는 브라우저에서만 사용할 수 있습니다."));
  }

  if (window.Kakao?.isInitialized?.()) {
    return Promise.resolve(window.Kakao);
  }

  if (kakaoSdkPromise) {
    return kakaoSdkPromise;
  }

  kakaoSdkPromise = new Promise((resolve, reject) => {
    const key = getJavascriptKey();

    if (!key) {
      reject(new Error("NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY가 없습니다."));
      return;
    }

    const initialize = () => {
      try {
        resolve(ensureKakaoInitialized());
      } catch (error) {
        reject(error instanceof Error ? error : new Error("카카오 SDK 초기화에 실패했습니다."));
      }
    };

    const existing = document.getElementById("kakao-js-sdk") as HTMLScriptElement | null;

    if (existing) {
      if (window.Kakao) {
        initialize();
        return;
      }

      existing.addEventListener("load", initialize, { once: true });
      existing.addEventListener("error", () => reject(new Error("카카오 SDK를 불러오지 못했습니다.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-js-sdk";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://t1.kakaocdn.net/kakao_js_sdk/${KAKAO_SDK_VERSION}/kakao.min.js`;
    script.addEventListener("load", initialize, { once: true });
    script.addEventListener("error", () => reject(new Error("카카오 SDK를 불러오지 못했습니다.")), {
      once: true,
    });
    document.head.appendChild(script);
  }).catch((error) => {
    kakaoSdkPromise = null;
    throw error;
  });

  return kakaoSdkPromise;
}
