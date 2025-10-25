import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname, // <-- force this app as the root
  },
};

export default nextConfig;
