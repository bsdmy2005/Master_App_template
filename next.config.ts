import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  // Turbopack configuration (for dev mode)
  turbopack: {},
  // Webpack configuration (for production builds)
  webpack: (config, { isServer }) => {
    // Mark postgres as external for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false
      }
      config.externals = config.externals || []
      config.externals.push("postgres")
    }
    return config
  }
}

export default nextConfig
