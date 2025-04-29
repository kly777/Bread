// See https://wxt.dev/api/config.html
import { defineConfig } from "wxt";
export default defineConfig({
    modules: ["@wxt-dev/module-vue"],
    browser: "chrome",
    manifest: {
        permissions: [
            "storage",
            "https://edge.microsoft.com/",
            "https://api-edge.cognitive.microsofttranslator.com/",
        ],
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
