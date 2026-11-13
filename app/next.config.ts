import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Versions-Erkennung (WIR-039): Nach jedem Deploy hingen offene iPhone-Apps auf dem
  // alten Build, Server Actions schlugen fehl („Failed to find Server Action“), Knöpfe
  // wirkten tot. Mit deploymentId schickt der Client seine Version mit, bei Abweichung
  // lädt Next die Seite selbst neu. Beim Deploy kommt der Git-SHA als Build-Arg rein
  // (deploy/README.md), sonst der Bauzeitpunkt. Der Standalone-Server brennt den Wert
  // beim Bauen ein, Build und Laufzeit passen also zusammen.
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || `b${Date.now().toString(36)}`,
  serverExternalPackages: ["better-sqlite3", "sharp"],
  // Logo-Upload im Gründungs-Wizard/Verwaltung kommt als Data-URL im Action-Body
  // (Default 1 MB wär zu knapp für a Foto + Vorlage)
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
