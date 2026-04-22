import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cf.cjdropshipping.com" },
      { protocol: "https", hostname: "oss-cf.cjdropshipping.com" },
      { protocol: "https", hostname: "files.cjdropshipping.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
}

export default nextConfig
