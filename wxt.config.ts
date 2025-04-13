import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
    extensionApi: "chrome",
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
});
