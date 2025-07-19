// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    // روی همهٔ اینترفیس‌ها گوش بده
    host: "0.0.0.0",            // ← تغییر اصلی
    port: 8080,
    strictPort: true,            // اگر پورت آزاد نباشد خطا بده
    proxy: {
      "/api": {
        target: "http://192.168.11.115:3001", // ← آدرس بک‑اند روی همین ماشین
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, "/api"),
      },
    },
    // (اختیاری) کمک می‌کند HMR روی کلاینت‌های دیگر هم کار کند
    hmr: { host: "192.168.11.115", port: 8080 },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
