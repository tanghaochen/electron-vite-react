// vite.config.ts
import {rmSync} from "node:fs";
import path from "node:path";
import {
    defineConfig
} from "file:///E:/webProject/electron-vite-react/node_modules/.pnpm/vite@5.4.14_@types+node@22.13.1/node_modules/vite/dist/node/index.js";
import react
    from "file:///E:/webProject/electron-vite-react/node_modules/.pnpm/@vitejs+plugin-react@4.3.4_vite@5.4.14_@types+node@22.13.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import electron
    from "file:///E:/webProject/electron-vite-react/node_modules/.pnpm/vite-plugin-electron@0.29.0_vite-plugin-electron-renderer@0.14.6/node_modules/vite-plugin-electron/dist/simple.mjs";

// package.json
var package_default = {
    name: "electron-vite-react",
    version: "2.2.0",
    main: "dist-electron/main/index.js",
    description: "Electron Vite React boilerplate.",
    author: "\u8349\u978B\u6CA1\u53F7 <308487730@qq.com>",
    license: "MIT",
    private: true,
    debug: {
        env: {
            VITE_DEV_SERVER_URL: "http://127.0.0.1:7777/"
        }
    },
    type: "module",
    scripts: {
        dev: "vite",
        build: "tsc && vite build && electron-builder",
        preview: "vite preview",
        pretest: "vite build --mode=test",
        test: "vitest run"
    },
    dependencies: {
        "@dnd-kit/core": "^6.3.1",
        "@dnd-kit/sortable": "^10.0.0",
        "@dnd-kit/utilities": "^3.2.2",
        "@emotion/react": "^11.14.0",
        "@emotion/styled": "^11.14.0",
        "@mui/icons-material": "^6.4.3",
        "@mui/material": "^6.4.2",
        "@mui/x-tree-view": "^7.25.0",
        "@types/react-beautiful-dnd": "^13.1.8",
        "electron-updater": "^6.3.9",
        "react-beautiful-dnd": "^13.1.1"
    },
    devDependencies: {
        "@playwright/test": "^1.48.2",
        "@types/react": "^18.3.12",
        "@types/react-dom": "^18.3.1",
        "@vitejs/plugin-react": "^4.3.3",
        autoprefixer: "^10.4.20",
        electron: "^33.2.0",
        "electron-builder": "^24.13.3",
        postcss: "^8.4.49",
        "postcss-import": "^16.1.0",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        tailwindcss: "^3.4.15",
        typescript: "^5.4.2",
        vite: "^5.4.11",
        "vite-plugin-electron": "^0.29.0",
        "vite-plugin-electron-renderer": "^0.14.6",
        vitest: "^2.1.5"
    }
};

// vite.config.ts
var __vite_injected_original_dirname = "E:\\webProject\\electron-vite-react";
var vite_config_default = defineConfig(({command}) => {
    rmSync("dist-electron", {recursive: true, force: true});
    const isServe = command === "serve";
    const isBuild = command === "build";
    const sourcemap = isServe || !!process.env.VSCODE_DEBUG;
    return {
        resolve: {
            alias: {
                "@": path.join(__vite_injected_original_dirname, "src")
            }
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
                                /* For `.vscode/.debug.script.mjs` */
                                "[startup] Electron App"
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
                                external: Object.keys("dependencies" in package_default ? package_default.dependencies : {})
                            }
                        }
                    }
                },
                preload: {
                    // Shortcut of `build.rollupOptions.input`.
                    // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
                    input: "electron/preload/index.ts",
                    vite: {
                        build: {
                            sourcemap: sourcemap ? "inline" : void 0,
                            // #332
                            minify: isBuild,
                            outDir: "dist-electron/preload",
                            rollupOptions: {
                                external: Object.keys("dependencies" in package_default ? package_default.dependencies : {})
                            }
                        }
                    }
                },
                // Ployfill the Electron and Node.js API for Renderer process.
                // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
                // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
                renderer: {}
            })
        ],
        server: process.env.VSCODE_DEBUG && (() => {
            const url = new URL(package_default.debug.env.VITE_DEV_SERVER_URL);
            return {
                host: url.hostname,
                port: +url.port
            };
        })(),
        clearScreen: false
    };
});
export {
    vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcd2ViUHJvamVjdFxcXFxlbGVjdHJvbi12aXRlLXJlYWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFx3ZWJQcm9qZWN0XFxcXGVsZWN0cm9uLXZpdGUtcmVhY3RcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L3dlYlByb2plY3QvZWxlY3Ryb24tdml0ZS1yZWFjdC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IHJtU3luYyB9IGZyb20gJ25vZGU6ZnMnXHJcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCdcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgZWxlY3Ryb24gZnJvbSAndml0ZS1wbHVnaW4tZWxlY3Ryb24vc2ltcGxlJ1xyXG5pbXBvcnQgcGtnIGZyb20gJy4vcGFja2FnZS5qc29uJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQgfSkgPT4ge1xyXG4gIHJtU3luYygnZGlzdC1lbGVjdHJvbicsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KVxyXG5cclxuICBjb25zdCBpc1NlcnZlID0gY29tbWFuZCA9PT0gJ3NlcnZlJ1xyXG4gIGNvbnN0IGlzQnVpbGQgPSBjb21tYW5kID09PSAnYnVpbGQnXHJcbiAgY29uc3Qgc291cmNlbWFwID0gaXNTZXJ2ZSB8fCAhIXByb2Nlc3MuZW52LlZTQ09ERV9ERUJVR1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgICdAJzogcGF0aC5qb2luKF9fZGlybmFtZSwgJ3NyYycpXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICByZWFjdCgpLFxyXG4gICAgICBlbGVjdHJvbih7XHJcbiAgICAgICAgbWFpbjoge1xyXG4gICAgICAgICAgLy8gU2hvcnRjdXQgb2YgYGJ1aWxkLmxpYi5lbnRyeWBcclxuICAgICAgICAgIGVudHJ5OiAnZWxlY3Ryb24vbWFpbi9pbmRleC50cycsXHJcbiAgICAgICAgICBvbnN0YXJ0KGFyZ3MpIHtcclxuICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52LlZTQ09ERV9ERUJVRykge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKC8qIEZvciBgLnZzY29kZS8uZGVidWcuc2NyaXB0Lm1qc2AgKi8nW3N0YXJ0dXBdIEVsZWN0cm9uIEFwcCcpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgYXJncy5zdGFydHVwKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHZpdGU6IHtcclxuICAgICAgICAgICAgYnVpbGQ6IHtcclxuICAgICAgICAgICAgICBzb3VyY2VtYXAsXHJcbiAgICAgICAgICAgICAgbWluaWZ5OiBpc0J1aWxkLFxyXG4gICAgICAgICAgICAgIG91dERpcjogJ2Rpc3QtZWxlY3Ryb24vbWFpbicsXHJcbiAgICAgICAgICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWw6IE9iamVjdC5rZXlzKCdkZXBlbmRlbmNpZXMnIGluIHBrZyA/IHBrZy5kZXBlbmRlbmNpZXMgOiB7fSksXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwcmVsb2FkOiB7XHJcbiAgICAgICAgICAvLyBTaG9ydGN1dCBvZiBgYnVpbGQucm9sbHVwT3B0aW9ucy5pbnB1dGAuXHJcbiAgICAgICAgICAvLyBQcmVsb2FkIHNjcmlwdHMgbWF5IGNvbnRhaW4gV2ViIGFzc2V0cywgc28gdXNlIHRoZSBgYnVpbGQucm9sbHVwT3B0aW9ucy5pbnB1dGAgaW5zdGVhZCBgYnVpbGQubGliLmVudHJ5YC5cclxuICAgICAgICAgIGlucHV0OiAnZWxlY3Ryb24vcHJlbG9hZC9pbmRleC50cycsXHJcbiAgICAgICAgICB2aXRlOiB7XHJcbiAgICAgICAgICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgICAgICAgc291cmNlbWFwOiBzb3VyY2VtYXAgPyAnaW5saW5lJyA6IHVuZGVmaW5lZCwgLy8gIzMzMlxyXG4gICAgICAgICAgICAgIG1pbmlmeTogaXNCdWlsZCxcclxuICAgICAgICAgICAgICBvdXREaXI6ICdkaXN0LWVsZWN0cm9uL3ByZWxvYWQnLFxyXG4gICAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsOiBPYmplY3Qua2V5cygnZGVwZW5kZW5jaWVzJyBpbiBwa2cgPyBwa2cuZGVwZW5kZW5jaWVzIDoge30pLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gUGxveWZpbGwgdGhlIEVsZWN0cm9uIGFuZCBOb2RlLmpzIEFQSSBmb3IgUmVuZGVyZXIgcHJvY2Vzcy5cclxuICAgICAgICAvLyBJZiB5b3Ugd2FudCB1c2UgTm9kZS5qcyBpbiBSZW5kZXJlciBwcm9jZXNzLCB0aGUgYG5vZGVJbnRlZ3JhdGlvbmAgbmVlZHMgdG8gYmUgZW5hYmxlZCBpbiB0aGUgTWFpbiBwcm9jZXNzLlxyXG4gICAgICAgIC8vIFNlZSBcdUQ4M0RcdURDNDkgaHR0cHM6Ly9naXRodWIuY29tL2VsZWN0cm9uLXZpdGUvdml0ZS1wbHVnaW4tZWxlY3Ryb24tcmVuZGVyZXJcclxuICAgICAgICByZW5kZXJlcjoge30sXHJcbiAgICAgIH0pLFxyXG4gICAgXSxcclxuICAgIHNlcnZlcjogcHJvY2Vzcy5lbnYuVlNDT0RFX0RFQlVHICYmICgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocGtnLmRlYnVnLmVudi5WSVRFX0RFVl9TRVJWRVJfVVJMKVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGhvc3Q6IHVybC5ob3N0bmFtZSxcclxuICAgICAgICBwb3J0OiArdXJsLnBvcnQsXHJcbiAgICAgIH1cclxuICAgIH0pKCksXHJcbiAgICBjbGVhclNjcmVlbjogZmFsc2UsXHJcbiAgfVxyXG59KVxyXG4iLCAie1xuICBcIm5hbWVcIjogXCJlbGVjdHJvbi12aXRlLXJlYWN0XCIsXG4gIFwidmVyc2lvblwiOiBcIjIuMi4wXCIsXG4gIFwibWFpblwiOiBcImRpc3QtZWxlY3Ryb24vbWFpbi9pbmRleC5qc1wiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiRWxlY3Ryb24gVml0ZSBSZWFjdCBib2lsZXJwbGF0ZS5cIixcbiAgXCJhdXRob3JcIjogXCJcdTgzNDlcdTk3OEJcdTZDQTFcdTUzRjcgPDMwODQ4NzczMEBxcS5jb20+XCIsXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxuICBcInByaXZhdGVcIjogdHJ1ZSxcbiAgXCJkZWJ1Z1wiOiB7XG4gICAgXCJlbnZcIjoge1xuICAgICAgXCJWSVRFX0RFVl9TRVJWRVJfVVJMXCI6IFwiaHR0cDovLzEyNy4wLjAuMTo3Nzc3L1wiXG4gICAgfVxuICB9LFxuICBcInR5cGVcIjogXCJtb2R1bGVcIixcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImRldlwiOiBcInZpdGVcIixcbiAgICBcImJ1aWxkXCI6IFwidHNjICYmIHZpdGUgYnVpbGQgJiYgZWxlY3Ryb24tYnVpbGRlclwiLFxuICAgIFwicHJldmlld1wiOiBcInZpdGUgcHJldmlld1wiLFxuICAgIFwicHJldGVzdFwiOiBcInZpdGUgYnVpbGQgLS1tb2RlPXRlc3RcIixcbiAgICBcInRlc3RcIjogXCJ2aXRlc3QgcnVuXCJcbiAgfSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQGRuZC1raXQvY29yZVwiOiBcIl42LjMuMVwiLFxuICAgIFwiQGRuZC1raXQvc29ydGFibGVcIjogXCJeMTAuMC4wXCIsXG4gICAgXCJAZG5kLWtpdC91dGlsaXRpZXNcIjogXCJeMy4yLjJcIixcbiAgICBcIkBlbW90aW9uL3JlYWN0XCI6IFwiXjExLjE0LjBcIixcbiAgICBcIkBlbW90aW9uL3N0eWxlZFwiOiBcIl4xMS4xNC4wXCIsXG4gICAgXCJAbXVpL2ljb25zLW1hdGVyaWFsXCI6IFwiXjYuNC4zXCIsXG4gICAgXCJAbXVpL21hdGVyaWFsXCI6IFwiXjYuNC4yXCIsXG4gICAgXCJAbXVpL3gtdHJlZS12aWV3XCI6IFwiXjcuMjUuMFwiLFxuICAgIFwiQHR5cGVzL3JlYWN0LWJlYXV0aWZ1bC1kbmRcIjogXCJeMTMuMS44XCIsXG4gICAgXCJlbGVjdHJvbi11cGRhdGVyXCI6IFwiXjYuMy45XCIsXG4gICAgXCJyZWFjdC1iZWF1dGlmdWwtZG5kXCI6IFwiXjEzLjEuMVwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBwbGF5d3JpZ2h0L3Rlc3RcIjogXCJeMS40OC4yXCIsXG4gICAgXCJAdHlwZXMvcmVhY3RcIjogXCJeMTguMy4xMlwiLFxuICAgIFwiQHR5cGVzL3JlYWN0LWRvbVwiOiBcIl4xOC4zLjFcIixcbiAgICBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI6IFwiXjQuMy4zXCIsXG4gICAgXCJhdXRvcHJlZml4ZXJcIjogXCJeMTAuNC4yMFwiLFxuICAgIFwiZWxlY3Ryb25cIjogXCJeMzMuMi4wXCIsXG4gICAgXCJlbGVjdHJvbi1idWlsZGVyXCI6IFwiXjI0LjEzLjNcIixcbiAgICBcInBvc3Rjc3NcIjogXCJeOC40LjQ5XCIsXG4gICAgXCJwb3N0Y3NzLWltcG9ydFwiOiBcIl4xNi4xLjBcIixcbiAgICBcInJlYWN0XCI6IFwiXjE4LjMuMVwiLFxuICAgIFwicmVhY3QtZG9tXCI6IFwiXjE4LjMuMVwiLFxuICAgIFwidGFpbHdpbmRjc3NcIjogXCJeMy40LjE1XCIsXG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjUuNC4yXCIsXG4gICAgXCJ2aXRlXCI6IFwiXjUuNC4xMVwiLFxuICAgIFwidml0ZS1wbHVnaW4tZWxlY3Ryb25cIjogXCJeMC4yOS4wXCIsXG4gICAgXCJ2aXRlLXBsdWdpbi1lbGVjdHJvbi1yZW5kZXJlclwiOiBcIl4wLjE0LjZcIixcbiAgICBcInZpdGVzdFwiOiBcIl4yLjEuNVwiXG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlIsU0FBUyxjQUFjO0FBQ2xULE9BQU8sVUFBVTtBQUNqQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxjQUFjOzs7QUNKckI7QUFBQSxFQUNFLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLE1BQVE7QUFBQSxFQUNSLGFBQWU7QUFBQSxFQUNmLFFBQVU7QUFBQSxFQUNWLFNBQVc7QUFBQSxFQUNYLFNBQVc7QUFBQSxFQUNYLE9BQVM7QUFBQSxJQUNQLEtBQU87QUFBQSxNQUNMLHFCQUF1QjtBQUFBLElBQ3pCO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLElBQ1QsS0FBTztBQUFBLElBQ1AsT0FBUztBQUFBLElBQ1QsU0FBVztBQUFBLElBQ1gsU0FBVztBQUFBLElBQ1gsTUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLGNBQWdCO0FBQUEsSUFDZCxpQkFBaUI7QUFBQSxJQUNqQixxQkFBcUI7QUFBQSxJQUNyQixzQkFBc0I7QUFBQSxJQUN0QixrQkFBa0I7QUFBQSxJQUNsQixtQkFBbUI7QUFBQSxJQUNuQix1QkFBdUI7QUFBQSxJQUN2QixpQkFBaUI7QUFBQSxJQUNqQixvQkFBb0I7QUFBQSxJQUNwQiw4QkFBOEI7QUFBQSxJQUM5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
