import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cesium.js를 위한 webpack 설정
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // @zip.js/zip.js 호환성 문제 해결
    // Cesium이 요청하는 zip-no-worker.js가 최신 @zip.js/zip.js에 없으므로
    // 메인 모듈로 리다이렉트
    config.resolve.alias = {
      ...config.resolve.alias,
      "@zip.js/zip.js/lib/zip-no-worker.js": "@zip.js/zip.js",
    };

    return config;
  },
  // Cesium assets을 위한 설정
  output: "standalone",
  // Turbopack 경고 방지를 위한 빈 설정
  turbopack: {},
};

export default nextConfig;