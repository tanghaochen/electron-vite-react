import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(__dirname, "src"),
    },
  },
  base: "./",
  build: {
    // 完全禁用类型检查
    emptyOutDir: true,
    minify: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.html"),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {},
    },
  },
  esbuild: {
    // 禁用类型检查
    logOverride: {
      "this-is-undefined-in-esm": "silent",
      "unsupported-jsx-comment": "silent",
      "commonjs-variable-in-esm": "silent",
    },
    jsx: "automatic",
    jsxImportSource: "react",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  plugins: [
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`
        entry: "electron/main/index.ts",
        vite: {
          build: {
            sourcemap: false,
            minify: true,
            outDir: "dist-electron/main",
            rollupOptions: {
              external: Object.keys(
                "dependencies" in pkg ? pkg.dependencies : {},
              ),
            },
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: "electron/preload/index.ts",
        vite: {
          build: {
            sourcemap: false,
            minify: true,
            outDir: "dist-electron/preload",
            rollupOptions: {
              external: Object.keys(
                "dependencies" in pkg ? pkg.dependencies : {},
              ),
              output: {
                format: "cjs",
                entryFileNames: "[name].js",
                chunkFileNames: "[name].js",
                assetFileNames: "[name].[ext]",
              },
            },
          },
        },
      },
      renderer: {},
    }),
  ],
});
