import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Add base path configuration to ensure assets are loaded correctly
  base: '/',
  build: {
    // Output to the web directory directly if building for production
    outDir: mode === 'production' ? 'dist' : 'dist',
    // Ensure assets use relative paths
    assetsDir: 'assets',
    // Make source maps optional for smaller build size
    sourcemap: mode !== 'production',
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));