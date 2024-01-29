import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: `assets/[name][extname]`,
        entryFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name][extname]`
      },
    },
  },
});
