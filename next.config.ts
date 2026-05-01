import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 828, 1080, 1280],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "cf.cjdropshipping.com" },
      { protocol: "https", hostname: "oss-cf.cjdropshipping.com" },
      { protocol: "https", hostname: "files.cjdropshipping.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
}

export default nextConfig
