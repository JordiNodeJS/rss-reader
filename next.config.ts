import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow external images from any HTTPS host used by RSS feeds.
    // Using a wildcard is acceptable for a local/offline RSS reader but can be
    // narrowed to specific hostnames for production deployments.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    dangerouslyAllowSVG: true,
  },
  // Turbopack configuration for browser compatibility with Transformers.js
  // These Node.js-only modules should be excluded from client bundles
  turbopack: {
    resolveAlias: {
      // Exclude Node.js-only modules from client bundle
      sharp: { browser: "" },
      "onnxruntime-node": { browser: "" },
    },
  },
};

export default nextConfig;
