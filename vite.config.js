import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0"
  },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/")) return "three";
          if (id.includes("/node_modules/gsap/")) return "gsap";
          if (id.includes("/node_modules/lenis/")) return "lenis";
        }
      }
    }
  }
});
