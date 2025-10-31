import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname, // force this app as the root
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com", // YouTube thumbnails
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com", // YouTube channel avatars
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile images (OAuth)
      },
      {
        protocol: "http",
        hostname: "localhost", // for dev if you serve local images
      },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
