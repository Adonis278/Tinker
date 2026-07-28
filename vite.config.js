import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: {
    rollupOptions: {
      output: {
        // Split vendor code so the app chunk stays small and the heavy,
        // rarely-changing libraries cache separately. Matters because we
        // claim to serve learners on 2G — see BRD "Low-Bandwidth Design".
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/analytics"],
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
