import type { NextConfig } from "next";
// Plain .mjs shared with apps/app — typed via its JSDoc annotations.
import { securityHeadersConfig } from "../../shared/securityHeaders.mjs";

const nextConfig: NextConfig = {
  // Security response headers (CSP + friends), shared with apps/app.
  // CSP is REPORT-ONLY until CSP_ENFORCE=true. See shared/securityHeaders.mjs.
  async headers() {
    return securityHeadersConfig(process.env);
  },
  // three/drei ship modern ES2022 (class `static {}` blocks) that Safari < 16.4
  // can't parse → "Unexpected token '{'" → the client-only 3D hero never mounts
  // (blank on Safari 15, i.e. India's older iOS). Next doesn't transpile
  // node_modules by default, so name them; the Safari-15 floor is in browserslist.
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

export default nextConfig;
