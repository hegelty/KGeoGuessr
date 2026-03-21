import type { SeedRound } from "@/types/game";

type RandomAnchor = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  radiusKm: number;
  weight: number;
};

const ROUND_ID_SEPARATOR = "::";
const SOUTH_KOREA_BOUNDS = {
  minLat: 33.1,
  maxLat: 38.7,
  minLng: 124.6,
  maxLng: 131.0,
} as const;

const RANDOM_ANCHORS: RandomAnchor[] = [
  {
    id: "seoul-cityhall",
    name: "서울 시청권",
    region: "서울 중구",
    lat: 37.5663,
    lng: 126.9779,
    radiusKm: 2.6,
    weight: 1.7,
  },
  {
    id: "seoul-hongdae",
    name: "홍대 상권",
    region: "서울 마포구",
    lat: 37.5563,
    lng: 126.9236,
    radiusKm: 2.4,
    weight: 1.4,
  },
  {
    id: "seoul-gangnam",
    name: "강남 테헤란로권",
    region: "서울 강남구",
    lat: 37.4981,
    lng: 127.0276,
    radiusKm: 2.5,
    weight: 1.6,
  },
  {
    id: "seoul-jamsil",
    name: "잠실 생활권",
    region: "서울 송파구",
    lat: 37.5131,
    lng: 127.1026,
    radiusKm: 2.4,
    weight: 1.2,
  },
  {
    id: "seoul-seongsu",
    name: "성수 한강권",
    region: "서울 성동구",
    lat: 37.5446,
    lng: 127.0557,
    radiusKm: 2.1,
    weight: 1.1,
  },
  {
    id: "seoul-eunpyeong",
    name: "은평 도심권",
    region: "서울 은평구",
    lat: 37.6196,
    lng: 126.9271,
    radiusKm: 2.5,
    weight: 0.9,
  },
  {
    id: "incheon-bupyeong",
    name: "부평 상권",
    region: "인천 부평구",
    lat: 37.4895,
    lng: 126.7245,
    radiusKm: 2.5,
    weight: 1.1,
  },
  {
    id: "incheon-songdo",
    name: "송도 신도시",
    region: "인천 연수구",
    lat: 37.3925,
    lng: 126.6424,
    radiusKm: 2.8,
    weight: 1.0,
  },
  {
    id: "goyang-ilsan",
    name: "일산 신도시",
    region: "경기 고양",
    lat: 37.6584,
    lng: 126.7702,
    radiusKm: 3.0,
    weight: 1.0,
  },
  {
    id: "uijeongbu",
    name: "의정부 시가지",
    region: "경기 의정부",
    lat: 37.7381,
    lng: 127.0338,
    radiusKm: 2.6,
    weight: 0.8,
  },
  {
    id: "suwon",
    name: "수원 도심권",
    region: "경기 수원",
    lat: 37.2636,
    lng: 127.0286,
    radiusKm: 2.8,
    weight: 1.1,
  },
  {
    id: "bundang",
    name: "분당 신도시",
    region: "경기 성남",
    lat: 37.3786,
    lng: 127.1122,
    radiusKm: 2.8,
    weight: 1.0,
  },
  {
    id: "dongtan",
    name: "동탄 신도시",
    region: "경기 화성",
    lat: 37.2008,
    lng: 127.0954,
    radiusKm: 3.0,
    weight: 0.9,
  },
  {
    id: "anyang",
    name: "평촌 생활권",
    region: "경기 안양",
    lat: 37.3943,
    lng: 126.9568,
    radiusKm: 2.6,
    weight: 0.8,
  },
  {
    id: "cheonan",
    name: "천안 중심권",
    region: "충남 천안",
    lat: 36.8151,
    lng: 127.1139,
    radiusKm: 2.9,
    weight: 0.9,
  },
  {
    id: "chuncheon",
    name: "춘천 시가지",
    region: "강원 춘천",
    lat: 37.8813,
    lng: 127.7298,
    radiusKm: 3.0,
    weight: 0.8,
  },
  {
    id: "wonju",
    name: "원주 시가지",
    region: "강원 원주",
    lat: 37.3422,
    lng: 127.9202,
    radiusKm: 2.9,
    weight: 0.8,
  },
  {
    id: "gangneung",
    name: "강릉 생활권",
    region: "강원 강릉",
    lat: 37.7519,
    lng: 128.8761,
    radiusKm: 2.9,
    weight: 0.8,
  },
  {
    id: "sokcho",
    name: "속초 해안권",
    region: "강원 속초",
    lat: 38.207,
    lng: 128.5918,
    radiusKm: 2.3,
    weight: 0.5,
  },
  {
    id: "cheongju",
    name: "청주 도심권",
    region: "충북 청주",
    lat: 36.6424,
    lng: 127.489,
    radiusKm: 2.9,
    weight: 0.9,
  },
  {
    id: "sejong",
    name: "세종 행정타운권",
    region: "세종",
    lat: 36.48,
    lng: 127.289,
    radiusKm: 2.4,
    weight: 0.7,
  },
  {
    id: "daejeon",
    name: "대전 중심권",
    region: "대전 서구",
    lat: 36.3504,
    lng: 127.3845,
    radiusKm: 3.0,
    weight: 1.0,
  },
  {
    id: "jeonju",
    name: "전주 도심권",
    region: "전북 전주",
    lat: 35.8242,
    lng: 127.148,
    radiusKm: 2.9,
    weight: 0.9,
  },
  {
    id: "gunsan",
    name: "군산 생활권",
    region: "전북 군산",
    lat: 35.9676,
    lng: 126.7368,
    radiusKm: 2.7,
    weight: 0.6,
  },
  {
    id: "gwangju",
    name: "광주 도심권",
    region: "광주 서구",
    lat: 35.1595,
    lng: 126.8526,
    radiusKm: 3.0,
    weight: 1.0,
  },
  {
    id: "mokpo",
    name: "목포 항만권",
    region: "전남 목포",
    lat: 34.8118,
    lng: 126.3922,
    radiusKm: 2.5,
    weight: 0.5,
  },
  {
    id: "suncheon",
    name: "순천 시가지",
    region: "전남 순천",
    lat: 34.9507,
    lng: 127.4872,
    radiusKm: 2.8,
    weight: 0.7,
  },
  {
    id: "yeosu",
    name: "여수 해안권",
    region: "전남 여수",
    lat: 34.7604,
    lng: 127.6622,
    radiusKm: 2.6,
    weight: 0.6,
  },
  {
    id: "daegu",
    name: "대구 중심권",
    region: "대구 중구",
    lat: 35.8714,
    lng: 128.6014,
    radiusKm: 3.0,
    weight: 1.0,
  },
  {
    id: "andong",
    name: "안동 시가지",
    region: "경북 안동",
    lat: 36.5684,
    lng: 128.7294,
    radiusKm: 2.6,
    weight: 0.5,
  },
  {
    id: "pohang",
    name: "포항 해안권",
    region: "경북 포항",
    lat: 36.019,
    lng: 129.3435,
    radiusKm: 2.8,
    weight: 0.7,
  },
  {
    id: "gyeongju",
    name: "경주 생활권",
    region: "경북 경주",
    lat: 35.8562,
    lng: 129.2247,
    radiusKm: 2.7,
    weight: 0.6,
  },
  {
    id: "busan-seomyeon",
    name: "부산 서면권",
    region: "부산 부산진구",
    lat: 35.1579,
    lng: 129.0592,
    radiusKm: 2.4,
    weight: 1.1,
  },
  {
    id: "busan-haeundae",
    name: "부산 해운대권",
    region: "부산 해운대구",
    lat: 35.1632,
    lng: 129.1636,
    radiusKm: 2.4,
    weight: 0.9,
  },
  {
    id: "ulsan",
    name: "울산 삼산권",
    region: "울산 남구",
    lat: 35.5384,
    lng: 129.3114,
    radiusKm: 2.8,
    weight: 0.8,
  },
  {
    id: "changwon",
    name: "창원 중심권",
    region: "경남 창원",
    lat: 35.2279,
    lng: 128.6811,
    radiusKm: 2.8,
    weight: 0.8,
  },
  {
    id: "gimhae",
    name: "김해 시가지",
    region: "경남 김해",
    lat: 35.2283,
    lng: 128.8892,
    radiusKm: 2.7,
    weight: 0.7,
  },
  {
    id: "jinju",
    name: "진주 생활권",
    region: "경남 진주",
    lat: 35.1796,
    lng: 128.1076,
    radiusKm: 2.7,
    weight: 0.6,
  },
  {
    id: "geoje",
    name: "거제 해안권",
    region: "경남 거제",
    lat: 34.8806,
    lng: 128.6211,
    radiusKm: 2.4,
    weight: 0.4,
  },
  {
    id: "jeju-city",
    name: "제주시 생활권",
    region: "제주 제주시",
    lat: 33.4996,
    lng: 126.5312,
    radiusKm: 3.1,
    weight: 0.7,
  },
  {
    id: "seogwipo",
    name: "서귀포 생활권",
    region: "제주 서귀포",
    lat: 33.2541,
    lng: 126.5601,
    radiusKm: 2.8,
    weight: 0.5,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickRandomAnchor(anchors: RandomAnchor[]) {
  const totalWeight = anchors.reduce((sum, anchor) => sum + anchor.weight, 0);
  let remaining = Math.random() * totalWeight;

  for (const anchor of anchors) {
    remaining -= anchor.weight;
    if (remaining <= 0) {
      return anchor;
    }
  }

  return anchors[anchors.length - 1];
}

function createRoundId(anchorId: string) {
  return `${anchorId}${ROUND_ID_SEPARATOR}${crypto.randomUUID()}`;
}

function getAnchorIdFromRoundId(roundId: string) {
  const [anchorId] = roundId.split(ROUND_ID_SEPARATOR);
  return anchorId;
}

function createRandomPosition(anchor: RandomAnchor) {
  const distanceKm = Math.sqrt(Math.random()) * anchor.radiusKm;
  const bearing = randomBetween(0, Math.PI * 2);
  const latOffset = (distanceKm / 111.32) * Math.cos(bearing);
  const lngDivisor =
    111.32 * Math.max(0.2, Math.cos((anchor.lat * Math.PI) / 180));
  const lngOffset = (distanceKm / lngDivisor) * Math.sin(bearing);

  return {
    lat: clamp(
      anchor.lat + latOffset,
      SOUTH_KOREA_BOUNDS.minLat,
      SOUTH_KOREA_BOUNDS.maxLat,
    ),
    lng: clamp(
      anchor.lng + lngOffset,
      SOUTH_KOREA_BOUNDS.minLng,
      SOUTH_KOREA_BOUNDS.maxLng,
    ),
  };
}

function createRound(anchor: RandomAnchor): SeedRound {
  return {
    id: createRoundId(anchor.id),
    name: `${anchor.name} 랜덤 지점`,
    region: anchor.region,
    panorama: {
      position: createRandomPosition(anchor),
      initialPov: {
        pan: randomBetween(-180, 180),
        tilt: randomBetween(-4, 9),
        fov: randomBetween(92, 100),
      },
    },
  };
}

export function selectRounds(
  count = 1,
  excludedRoundIds: string[] = [],
): SeedRound[] {
  const excludedAnchorIds = new Set(
    excludedRoundIds.map(getAnchorIdFromRoundId),
  );
  const rounds: SeedRound[] = [];
  const usedAnchorIds = new Set<string>();

  while (rounds.length < count) {
    const availableAnchors = RANDOM_ANCHORS.filter(
      (anchor) =>
        !excludedAnchorIds.has(anchor.id) && !usedAnchorIds.has(anchor.id),
    );
    const sourceAnchors =
      availableAnchors.length > 0 ? availableAnchors : RANDOM_ANCHORS;
    const anchor = pickRandomAnchor(sourceAnchors);

    rounds.push(createRound(anchor));
    usedAnchorIds.add(anchor.id);
  }

  return rounds;
}
