# KGeoGuessr MVP

대한민국 대상 GeoGuessr MVP입니다. `Next.js App Router + TypeScript + NAVER Maps JavaScript API` 기준으로 구성했습니다.

## 핵심 구현 포인트

- 5라운드 세션 기반 게임 진행
- NAVER Panorama로 문제 화면 렌더링
- NAVER Map 클릭으로 추측 핀 입력
- 서버에서 거리 계산 및 점수 계산
- 결과 화면에서만 Reverse Geocoding 호출

## 실행 전제

현재 워크스페이스에서는 `node`와 `npm`이 `PATH`에 없어서 설치와 실행 검증은 수행하지 못했습니다.

1. Node.js 20 이상 설치
2. `.env.local.example`를 `.env.local`로 복사 후 값 입력
3. `npm install`
4. `npm run dev`

## 중요한 운영 메모

- 현재 샘플 데이터는 `src/data/verified-pano-points.json`의 좌표 기반입니다.
- 실제 운영에서는 이 파일을 파노라마 검증 완료 데이터로 교체해야 합니다.
- 정답 노출을 더 줄이려면 `position` 대신 `panoId` 중심 데이터셋으로 전환하는 것이 좋습니다.

