import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://92.4.77.226:5000/api/auth/:path*",
      },
      {
        source: "/api/portfolio/:path*",
        destination: "http://92.4.77.226:5000/api/portfolio/:path*",
      },
      {
        source: "/api/prices/:path*",
        destination: "http://92.4.77.226:5000/api/prices/:path*",
      },
      {
        source: "/api/admin/:path*",
        destination: "http://92.4.77.226:5000/api/admin/:path*",
      },
      {
        source: "/api/public/:path*",
        destination: "http://92.4.77.226:5000/api/public/:path*",
      },
    ];
  },
};

export default nextConfig;
