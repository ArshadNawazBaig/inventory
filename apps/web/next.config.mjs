/**
 * The web app talks to the API **same-origin** through a rewrite proxy: the browser calls `/api/*` on the web
 * origin and Next forwards it to the API. This keeps the session cookie first-party (no cross-origin CORS, no
 * SameSite friction) in dev and simple deployments. Point `API_PROXY_TARGET` at the API in other environments,
 * or set `NEXT_PUBLIC_API_URL` to call the API directly (then the API must allow the web origin with credentials).
 */
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://localhost:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@stockflow/ui', '@stockflow/icons', '@stockflow/config'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_PROXY_TARGET}/api/:path*` }];
  },
};

export default nextConfig;
