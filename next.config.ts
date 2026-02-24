import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

// 개발 모드에서는 서비스 워커 빌드 생략 (Windows에서 public/sw.js 파일 잠금 에러 방지)
const withSerwistSafe =
  process.env.NODE_ENV === "production" ? withSerwist : ((c: NextConfig) => c) as typeof withSerwist;

const nextConfig: NextConfig = {
  // NextAuth CLIENT_FETCH_ERROR 방지: NEXTAUTH_URL이 없으면 dev에서 localhost:3001 사용
  env: {
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined),
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Reduce chance of "Unexpected end of JSON input" from loadManifest (empty/corrupt cache)
  webpack: (config, { dev }) => {
    if (dev && config.cache) {
      config.cache = false;
    }
    return config;
  },
};

export default withSerwistSafe(nextConfig);
