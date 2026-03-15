# 네이버 지도 API에서 카카오 지도 API로 마이그레이션

이 애플리케이션은 현재 지도 렌더링([GuessMap](file:///Users/yechanlim/Desktop/Google%20Antigravity/KGeoGuessr/src/components/game/GuessMap.tsx#14-150)), 로드뷰/스트리트 뷰([PanoramaViewer](file:///Users/yechanlim/Desktop/Google%20Antigravity/KGeoGuessr/src/components/game/PanoramaViewer.tsx#11-63)), 유효성 검사(`panoramaProbe`), 그리고 좌표를 주소로 변환([reverseGeocode](file:///Users/yechanlim/Desktop/Google%20Antigravity/KGeoGuessr/src/lib/naver/reverseGeocode.ts#10-52))하는 작업에 네이버 지도를 사용하고 있습니다. 이를 모두 해당하는 카카오 지도 API로 교체할 예정입니다.

## 사용자 확인 필요

> [!CAUTION]
> 카카오 지도를 사용하려면 **JavaScript 앱 키(App Key)** 가 필요합니다. [카카오 개발자 콘솔(Kakao Developers Console)](https://developers.kakao.com/)에서 앱 키를 발급받고 로컬 및 프로덕션 도메인을 웹 플랫폼에 추가해야 합니다. 그 후 [.env.local](file:///Users/yechanlim/Desktop/Google%20Antigravity/KGeoGuessr/.env.local) 파일에 `NEXT_PUBLIC_KAKAO_MAPS_APP_KEY=<발급받은_키>` 형식으로 추가해 주셔야 합니다.

## 제안하는 변경 사항

### 환경 설정

#### [MODIFY] .env.local
- `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`를 삭제하고 `NEXT_PUBLIC_KAKAO_MAPS_APP_KEY`로 교체합니다.

#### [MODIFY] .env.local.example
- 위와 동일한 내용을 예시 파일에도 적용하여 교체합니다.

---

### 지도 로드 레이어 (Core)

#### [NEW] src/lib/kakao/loadKakaoMaps.ts
- 카카오 지도 SDK 스크립트(`dapi.kakao.com/v2/maps/sdk.js?appkey=...&autoload=false&libraries=services`)를 동적으로 주입하는 로더를 생성합니다.
- 스크립트와 라이브러리가 완전히 로드된 후에만 모든 로직이 실행되도록 `kakao.maps.load()`를 사용합니다.

#### [DELETE] src/lib/naver/loadNaverMaps.ts

---

### UI 컴포넌트

#### [MODIFY] src/components/game/GuessMap.tsx
- `naver.maps.Map`을 `kakao.maps.Map`으로 교체합니다.
- HTML 기반의 마커(`<div class="map-pin"></div>`)를 계속 사용하기 위해 `naver.maps.Marker`를 `kakao.maps.CustomOverlay`로 교체합니다.
- `naver.maps.Polyline`을 `kakao.maps.Polyline`으로 교체합니다.
- 지도 클릭 이벤트를 변경합니다: `kakao.maps.event.addListener(map, 'click', ...)`.
- 경계(Bounds) 처리 방식을 `kakao.maps.LatLngBounds`와 `map.setBounds()`로 업데이트합니다.

#### [MODIFY] src/components/game/PanoramaViewer.tsx
- `naver.maps.Panorama`를 `kakao.maps.Roadview`로 교체합니다.
- 로드뷰를 초기화하기 위해 `kakao.maps.RoadviewClient().getNearestPanoId()`를 사용합니다.
- pov 옵션을 카카오의 포맷(pan, tilt, zoom)에 맞게 조정합니다.

---

### 게임 로직 및 유틸리티 함수

#### [NEW] src/lib/kakao/roadviewProbe.ts
- `kakao.maps.RoadviewClient`를 사용하여 주어진 좌표에 유효한 로케이션/PanoId가 존재하는지 확인합니다.
- 네이버의 `pano_status` 로직을 `getNearestPanoId`로 대체합니다.

#### [DELETE] src/lib/naver/panoramaProbe.ts

#### [NEW] src/lib/kakao/reverseGeocode.ts
- `kakao.maps.services.Geocoder().coord2Address(lng, lat, callback)`를 사용하여 주소 변환(리버스 지오코딩) 로직을 구현합니다.
- 카카오 API의 응답을 기존 로직과 동일하게 깔끔하고 읽기 쉬운 주소 문자열로 포맷팅합니다.

#### [DELETE] src/lib/naver/reverseGeocode.ts

#### [MODIFY] src/hooks/useReverseGeocodeCache.ts
- import 경로를 네이버에서 카카오로 업데이트합니다.

#### [MODIFY] (기타 사용처)
- `panoramaProbe`나 네이버 관련 라이브러리 import를 참조하는 기타 스크립트들을 업데이트합니다.

---

## 검증 계획

### 자동화 테스트
1. 빌드 확인: 리팩토링으로 인해 발생하는 TypeScript 컴파일 오류가 없는지 확인하기 위해 `npm run typecheck`를 실행합니다.
2. 린트(Lint) 검사를 수행합니다.

### 수동 검증
1. 사용자에게 [.env.local](file:///Users/yechanlim/Desktop/Google%20Antigravity/KGeoGuessr/.env.local) 파일에 카카오 지도 API 키를 추가하도록 안내합니다.
2. 로컬 서버(`npm run dev`)를 시작하고 브라우저에서 애플리케이션으로 이동합니다.
3. Guess(추측) 화면에서 **Map 컴포넌트**가 올바르게 렌더링되는지 확인하고, 사용자가 클릭하여 마커를 배치할 수 있는지 확인합니다.
4. **Roadview(스트리트 뷰)**가 기존 Panorama를 대체하여 올바르게 렌더링되고, 원하는 위치를 보여주는지 확인합니다.
5. 라운드가 끝날 때나 트리거될 때마다 **Reverse Geocoder**가 좌표를 한국어 주소로 성공적으로 변환되는지 확인합니다.
