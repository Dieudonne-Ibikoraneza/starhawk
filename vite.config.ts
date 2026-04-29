import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  
  return {
    server: {
      host: "::",
      port: 1111,
      proxy: {
        // Proxy API requests to backend to avoid CORS issues in development
        "/api": {
          target: env.VITE_API_URL || "http://localhost:3000",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Proxying request:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Proxy response:", proxyRes.statusCode, req.url);
          });
        },
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean,
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
