import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Force reload for .env changes
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173, // ensure consistent port for proxying
    proxy: {
      "/api": {
        // point to the locally-running backend used in development
        target: process.env.BACKEND_URL || "http://localhost:5000", 
        // target:"https://dmart.qtechx.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
