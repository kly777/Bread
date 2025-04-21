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
	vite: (configEnv) => ({
		build: {
			minify: "terser",
			terserOptions: {
				compress: configEnv.mode === "production"
					? {
						drop_console: true,
						drop_debugger: true,
					}
					: false,
			},
		},
	}),
});
