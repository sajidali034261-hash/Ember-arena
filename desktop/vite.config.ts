import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Renderer bundle. Served from the custom app:// protocol in production, so asset paths stay relative.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 5173, strictPort: true },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "chrome130",
    sourcemap: false,
  },
});
