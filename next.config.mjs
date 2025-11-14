/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Only use unoptimized images if deploying to a static host
  images: {
    unoptimized: true,
  },
}

export default nextConfig
