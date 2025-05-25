// See https://wxt.dev/api/config.html
import { defineConfig } from "wxt";
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  browser: "chrome",
  manifest: {
    permissions: [
      "storage",
      "nativeMessaging",
      "tabs",
      "<all_urls>",
      "activeTab",
      "https://edge.microsoft.com/",
      "https://api-edge.cognitive.microsofttranslator.com/",
      "https://translate.googleapis.com/translate_a/single",
    ],
    host_permissions: ["<all_urls>"],
    summary: "A browser extension for reading enhancement",
  },
  zip: {
    downloadPackages: [
      "@kly777/bread",
      //...
    ],
  },
  vite: (configEnv: { mode: string }) => ({
    build: {
      // 根据模式切换 minify 行为
      minify: configEnv.mode === "production" ? "terser" : false,
      terserOptions: {
        compress:
          configEnv.mode === "production"
            ? {
              drop_console: true,
              drop_debugger: true,
            }
            : false,
      },
    },
  }),
});
