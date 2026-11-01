import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@slideai/shared"],
  webpack(config) {
    // PptxGenJS 4.x marks Node built-ins as browser-false, but some
    // Webpack/Next combinations do not apply the browser map to node: URIs.
    // Normalize the scheme first so "node:fs" resolves to the browser stub.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );
    return config;
  },
};

export default nextConfig;
