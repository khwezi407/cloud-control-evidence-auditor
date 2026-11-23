import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /cloud-control-evidence-auditor/ so we need that
  // sub-path in production. Locally (dev) the root "/" still works fine.
  base: process.env.NODE_ENV === "production"
    ? "/cloud-control-evidence-auditor/"
    : "/",
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
