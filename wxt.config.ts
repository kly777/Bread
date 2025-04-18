import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ["@wxt-dev/module-vue"],
    browser: "chrome",
    manifest: {
        permissions: ["storage"],
    },
    zip: {
        downloadPackages: [
            "@kly777/bread",
            //...
        ],
    },
    vite: () => ({
        build: {
            minify: "terser",
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
            },
        },
    }),
});
