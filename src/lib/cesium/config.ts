/**
 * Cesium 설정 파일
 * Cesium 관련 상수 및 설정을 관리합니다.
 */

// Cesium Ion 토큰 (환경변수에서 가져오기)
export const CESIUM_ION_TOKEN = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || "";

// 기본 뷰 설정
export const DEFAULT_VIEW = {
  longitude: 127.5, // 서울
  latitude: 37.5,
  height: 10000000,
};

// 지형 제공자 설정
export const TERRAIN_PROVIDERS = {
  WORLD_TERRAIN: "world-terrain",
  OPEN_STREET_MAP: "openstreetmap",
} as const;

// 이미지 제공자 설정
export const IMAGERY_PROVIDERS = {
  OPEN_STREET_MAP: "openstreetmap",
  BING_MAPS: "bing",
  MAPBOX: "mapbox",
} as const;