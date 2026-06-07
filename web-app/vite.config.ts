import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    // Force a single React instance (framer-motion etc. can otherwise pull a
    // second copy under pnpm, causing "Invalid hook call").
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: { include: ["react", "react-dom", "framer-motion"] },
  server: { proxy: { "/api": "http://localhost:3001" } },
});
