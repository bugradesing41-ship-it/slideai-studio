import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  transpilePackages: ["@slideai/shared"],
};

export default nextConfig;
