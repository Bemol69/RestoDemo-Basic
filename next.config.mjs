/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@libsql/client", "bcryptjs"],
  experimental: { serverActions: { bodySizeLimit: "40mb" } },
};
export default nextConfig;
