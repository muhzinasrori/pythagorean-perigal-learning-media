import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // SEO / performance hardening
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js"
  compress: true, // gzip responses when the host doesn't already
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
