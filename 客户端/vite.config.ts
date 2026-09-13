import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // 云托管子路径：DEPLOY_BASE=/client/ npm run build
  base: process.env.DEPLOY_BASE || "/",
  plugins: [react()],
  server: {
    // 客户端固定 5173，与供应商端(3001)、管理端(5180) 并行不抢端口
    port: 5173,
    strictPort: true,
    host: true,
  },
});
