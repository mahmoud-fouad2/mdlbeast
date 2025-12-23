/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.zaco.sa",
      },
    ],
    unoptimized: true,
  },
  // basePath: '/archive', // قم بإلغاء التعليق عند النشر على zaco.sa/archive
  // assetPrefix: '/archive',
  trailingSlash: true,
  output: "standalone",
}

export default nextConfig
