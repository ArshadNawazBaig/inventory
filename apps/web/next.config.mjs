/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@stockflow/ui', '@stockflow/icons', '@stockflow/config'],
};

export default nextConfig;
