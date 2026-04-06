import type { NextConfig } from "next";

const distDir =
  process.env.NEXT_DIST_DIR ?? (process.env.VERCEL === "1" ? undefined : ".next-build");

const nextConfig: NextConfig = {
  ...(distDir ? { distDir } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
