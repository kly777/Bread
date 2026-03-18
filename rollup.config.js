import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import alias from "@rollup/plugin-alias";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import babel from "@rollup/plugin-babel";

import copy from "rollup-plugin-copy";
import postcss from "rollup-plugin-postcss";
import postcssImport from "postcss-import";

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import packageJson from "./package.json" with { type: "json" };
const isProduction = process.env.NODE_ENV === "production";

// 生成 manifest 文件
function generateManifest() {
	const baseManifest = JSON.parse(readFileSync("manifest.json", "utf-8"));
	const manifest = { ...baseManifest };

	// 只支持Firefox，manifest_version为2
	manifest.manifest_version = 2;
	manifest.version = packageJson.version;

	if (!isProduction) {
		manifest.name = `[DEV] ${manifest.name}`;
	}

	const distDir = "dist";
	if (!existsSync(distDir)) {
		mkdirSync(distDir, { recursive: true });
	}

	const manifestPath = join(distDir, "manifest.json");
	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
	console.log(
		`Generated manifest for Firefox (MV${manifest.manifest_version})`,
	);
}

// 共享的 Rollup 插件配置（不包含 CSS 处理）
const createBasePlugins = () => {
	const plugins = [
		alias({
			entries: [{ find: "@", replacement: "." }],
		}),
		nodeResolve({
			browser: true,
			exportConditions: ["solid", "browser", "module", "import", "default"],
			extensions: [".js", ".ts", ".tsx", ".jsx", ".css"],
		}),
		typescript({
			tsconfig: "./tsconfig.json",
			sourceMap: !isProduction,
			inlineSources: !isProduction,
		}),
		babel({
			babelHelpers: "bundled",
			extensions: [".ts", ".tsx", ".js", ".jsx"],
			presets: ["solid"],
		}),
		commonjs(),
		replace({
			preventAssignment: true,
			values: {
				"process.env.NODE_ENV": JSON.stringify(
					isProduction ? "production" : "development",
				),
			},
		}),
	];

	// 生产环境添加压缩
	if (isProduction) {
		plugins.push(
			terser({
				format: {
					comments: false,
				},
				compress: {
					drop_console: true,
					drop_debugger: true,
				},
			}),
		);
	}

	return plugins;
};

// 创建内容脚本的插件配置
const createContentScriptPlugins = () => {
	const plugins = createBasePlugins();
	plugins.push(
		postcss({
			minimize: isProduction,
			inject: false,
			extract: "content.css",
			plugins: [
				postcssImport({
					root: "entrypoints/content",
				}),
			],
		}),
	);
	return plugins;
};

// 创建弹窗的插件配置
const createPopupPlugins = () => {
	const plugins = createBasePlugins();
	plugins.push(
		postcss({
			minimize: isProduction,
			inject: false,
			extract: "popup/index.css",
			plugins: [
				postcssImport({
					root: "entrypoints/popup",
				}),
			],
		}),
	);
	return plugins;
};

// 内容脚本配置
const contentScriptConfig = {
	input: "entrypoints/content/index.ts",
	output: {
		file: "dist/content-scripts/content.js",
		format: "iife",
		name: "contentScript",
		sourcemap: !isProduction,
		inlineDynamicImports: true,
	},
	plugins: [
		...createContentScriptPlugins(),
		copy({
			targets: [
				{
					src: "public/icon/*",
					dest: "dist/icon",
				},
			],
			hook: "writeBundle",
		}),
		{
			name: "generate-manifest-content",
			buildStart() {
				generateManifest();
			},
		},
	],
};

// 背景脚本和弹窗配置
const backgroundPopupConfig = {
	input: {
		background: "entrypoints/background/index.ts",
		popup: "entrypoints/popup/main.tsx",
	},
	output: {
		dir: "dist",
		format: "es",
		sourcemap: !isProduction,
		entryFileNames: (chunkInfo) => {
			if (chunkInfo.name === "popup") {
				return "popup/index.js";
			}
			return "[name].js";
		},
		chunkFileNames: "chunks/[name]-[hash].js",
		assetFileNames: (assetInfo) => {
			if (assetInfo.name?.endsWith(".css")) {
				return "popup/index.css";
			}
			return "assets/[name][extname]";
		},
	},
	plugins: [
		...createPopupPlugins(),
		copy({
			targets: [
				{
					src: "entrypoints/popup/index.html",
					dest: "dist/popup",
				},
			],
			hook: "writeBundle",
		}),
		{
			name: "generate-manifest-bg-popup",
			buildStart() {
				if (!isProduction) {
					generateManifest();
				}
			},
			writeBundle() {
				generateManifest();
			},
		},
	],
};

export default [contentScriptConfig, backgroundPopupConfig];
