import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "sharp"],
  // Logo-Upload im Gründungs-Wizard/Verwaltung kommt als Data-URL im Action-Body
  // (Default 1 MB wär zu knapp für a Foto + Vorlage)
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
