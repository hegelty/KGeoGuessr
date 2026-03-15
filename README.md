# KGeoGuessr MVP

대한민국 대상 GeoGuessr MVP입니다. `Next.js App Router + TypeScript + Kakao Maps JavaScript API` 기준으로 구성했습니다.

## 핵심 구현 포인트

- 5라운드 세션 기반 게임 진행
- Kakao Roadview로 문제 화면 렌더링
- Kakao Map 클릭으로 추측 핀 입력
- 서버에서 거리 계산 및 점수 계산
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

## Production Container

운영용 컨테이너는 멀티스테이지 `Dockerfile`과 `compose.yaml`로 구성했습니다. Next.js `standalone` 출력을 사용하므로 런타임 이미지가 작고 단순합니다.

1. `.env.local.example`를 `.env.local`로 복사하고 값을 채웁니다.
2. 아래 명령으로 이미지 빌드와 실행을 함께 진행합니다.

```bash
docker compose --env-file .env.local up --build
```

직접 `docker build`와 `docker run`을 쓰고 싶다면 아래처럼 실행할 수 있습니다.

```bash
docker build \
  --build-arg NEXT_PUBLIC_KAKAO_MAPS_APP_KEY=your_kakao_maps_app_key \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  -t kgeoguessr .

docker run \
  --env-file .env.local \
  -p 3000:3000 \
  kgeoguessr
```

`NEXT_PUBLIC_*` 계열 값은 클라이언트 번들에 포함되므로 값이 바뀌면 이미지를 다시 빌드해야 합니다. `GAME_SESSION_SECRET`은 런타임 환경변수로 주입하면 됩니다.

## 중요한 운영 메모

- 현재 샘플 데이터는 `src/data/verified-pano-points.json`의 좌표 기반입니다.
- 실제 운영에서는 이 파일을 파노라마 검증 완료 데이터로 교체해야 합니다.
- 정답 노출을 더 줄이려면 `position` 대신 `panoId` 중심 데이터셋으로 전환하는 것이 좋습니다.
