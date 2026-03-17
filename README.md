# KGeoGuessr MVP

대한민국 대상 GeoGuessr MVP입니다. `Next.js App Router + TypeScript + Kakao Maps JavaScript API` 기준으로 구성했습니다.

## 핵심 구현 포인트

- 1라운드 랜덤 게임 진행 (브라우저 localStorage 세션)
- Kakao Roadview로 문제 화면 렌더링
- Kakao Map 클릭으로 추측 핀 입력
- 브라우저에서 거리 계산 및 점수 계산
- 결과 화면에서만 Reverse Geocoding 호출

## 실행 전제

현재 워크스페이스에서는 `node`와 `npm`이 `PATH`에 없어서 호스트 기준 설치와 실행 검증은 수행하지 못했습니다.

1. Node.js 20 이상 설치
2. `.env.local.example`를 `.env.local`로 복사 후 값 입력
3. `npm install`
4. `npm run dev`

## Dev Container

`.devcontainer` 구성을 추가했습니다. VS Code에서 `Dev Containers: Reopen in Container`를 실행하면 됩니다.

- Node.js 20 개발 환경으로 열립니다.
- 첫 생성 시 `.env.local`이 없으면 `.env.local.example`를 복사합니다.
- 첫 생성 시 `npm ci`를 자동 실행합니다.
- 포트 `3000`이 자동 포워딩됩니다.

컨테이너에 들어온 뒤 개발 서버는 아래처럼 실행하면 됩니다.

```bash
npm run dev
```

## GitHub Pages 배포 (정적 호스팅)

이 프로젝트는 `next export` 기반 정적 빌드로 GitHub Pages에 배포할 수 있도록 구성했습니다.

1. `.env.local.example`를 `.env.local`로 복사하고 `NEXT_PUBLIC_KAKAO_MAPS_APP_KEY`를 채웁니다.
2. 정적 빌드 생성

```bash
npm run build
```

3. 결과물은 `out/` 디렉터리에 생성됩니다.
4. GitHub Pages 설정에서 배포 소스를 `gh-pages` 브랜치(또는 Actions)로 지정하면 됩니다.

> 참고: 정적 호스팅 환경에서는 서버 API 라우트를 사용할 수 없어서 게임 세션/점수 계산은 브라우저(localStorage)에서 처리합니다.

## 중요한 운영 메모

- 현재 샘플 데이터는 `src/data/verified-pano-points.json`의 좌표 기반입니다.
- 실제 운영에서는 이 파일을 파노라마 검증 완료 데이터로 교체해야 합니다.
- 정답 노출을 더 줄이려면 `position` 대신 `panoId` 중심 데이터셋으로 전환하는 것이 좋습니다.
