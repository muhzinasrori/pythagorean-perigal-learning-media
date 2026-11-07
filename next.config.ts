import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  devIndicators: {
    position: 'bottom-left',
  },
  allowedDevOrigins: ['10.184.95.47'],
};

export default nextConfig;
