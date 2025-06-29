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
      minify: "terser",
      terserOptions: {
        compress: {
          defaults: true, // 启用所有默认压缩规则
          drop_console: true, // 移除 console.*
          drop_debugger: true, // 移除 debugger
          pure_funcs: ["console.assert"], // 移除断言
          unused: true, // 移除未使用代码
        },
        mangle: true, // 混淆变量名（如 `myVar` → `a`）
        format: { comments: false }, // 移除注释
      },
    },
    optimizeDeps: { include: ["vue"] },
  })
});
