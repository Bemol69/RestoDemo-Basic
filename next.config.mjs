/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@libsql/client", "bcryptjs", "web-push"],
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    // The service worker must never be served from an old cache, or updates would not reach phones.
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
};
export default nextConfig;
