import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => ({
  base: process.env.DEPLOY_BASE || "/",
  plugins: [react()],
  define: {
    __DEMO__: JSON.stringify(
      (command === "serve" || mode === "preview") &&
        loadEnv(mode, process.cwd()).VITE_DATA_MODE !== "api",
    ),
  },
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    ...(process.env.API_PROXY_TARGET
      ? {
          proxy: {
            "/api": {
              target: process.env.API_PROXY_TARGET,
              changeOrigin: true,
            },
          },
        }
      : {}),
  },
  build: { target: "es2022", sourcemap: false },
}));
