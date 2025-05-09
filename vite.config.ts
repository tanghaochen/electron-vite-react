import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync("dist-electron", { recursive: true, force: true });

  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    resolve: {
      alias: {
        "@": path.join(__dirname, "src"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {},
      },
    },
    plugins: [
      react(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`
          entry: "electron/main/index.ts",
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log(
                /* For `.vscode/.debug.script.mjs` */ "[startup] Electron App",
              );
            } else {
              args.startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {},
                ),
              },
            },
            esbuild: {
              logOverride: { "ts-checker": "silent" },
            },
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: "electron/preload/index.ts",
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : undefined, // #332
              minify: isBuild,
              outDir: "dist-electron/preload",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {},
                ),
              },
            },
            esbuild: {
              logOverride: { "ts-checker": "silent" },
            },
          },
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: {},
      }),
    ],
    server: {
      port: 5173,
      strictPort: true,
      host: "localhost",
      hmr: {
        overlay: false,
      },
      watch: {
        usePolling: true,
      },
      // 单独配置开发服务器
      ...(process.env.VSCODE_DEBUG
        ? (() => {
            const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
            return {
              host: url.hostname,
              port: +url.port,
            };
          })()
        : {}),
    },
    optimizeDeps: {
      // 强制预构建所有依赖
      force: true,
      // 预构建包括以下模块
      include: [
        "react",
        "react-dom",
        "react-router",
        "@mui/material",
        "@mui/icons-material",
        "@mui/system",
        "react-tabs",
        "react-resizable-panels",
        "@react-buddy/ide-toolbox",
        "dompurify",
      ],
    },
    clearScreen: false,
    esbuild: {
      logOverride: { "ts-checker": "silent" },
    },
    build: {
      // 打包时跳过类型检查
      emptyOutDir: true,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            mui: ["@mui/material", "@mui/icons-material", "@mui/system"],
            vendor: ["react-tabs", "react-resizable-panels", "dompurify"],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "node",
      include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
      css: true,
      setupFiles: ["./test/setup.ts"],
      deps: {
        inline: ["electron", "better-sqlite3"],
      },
    },
  };
});
