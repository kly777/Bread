/**
 * 搜索关键词自动更新模块
 * 函数式实现，监听URL变化并自动更新搜索关键词高亮
 */

import { KeywordExtractor } from "./keywordExtractor";
import { getWordsManager } from "./wordsManager";

// 状态变量
let isActive = false;
let lastUrl = "";
let urlObserver: MutationObserver | null = null;

/**
 * 启动搜索关键词自动更新
 */
export function startSearchKeywordAutoUpdate(): void {
	if (isActive) return;

	isActive = true;
	lastUrl = window.location.href;

	console.log("启动搜索关键词自动更新");

	setupUrlChangeListeners();
	updateSearchKeywords();
}

/**
 * 停止搜索关键词自动更新
 */
export function stopSearchKeywordAutoUpdate(): void {
	if (!isActive) return;

	isActive = false;
	cleanupUrlChangeListeners();

	console.log("⏹️ 停止搜索关键词自动更新");
}

/**
 * 设置URL变化监听器
 */
function setupUrlChangeListeners(): void {
	// 监听URL变化
	urlObserver = new MutationObserver(() => {
		if (window.location.href !== lastUrl) {
			lastUrl = window.location.href;
			console.log("🔄 检测到URL变化，检查是否需要更新搜索关键词高亮");
			updateSearchKeywords();
		}
	});

	// 监听popstate事件（浏览器前进/后退）
	window.addEventListener("popstate", handlePopState);

	// 监听hashchange事件（URL hash变化）
	window.addEventListener("hashchange", handleHashChange);

	// 开始观察DOM变化
	urlObserver.observe(document, { subtree: true, childList: true });
}

/**
 * 清理URL变化监听器
 */
function cleanupUrlChangeListeners(): void {
	if (urlObserver) {
		urlObserver.disconnect();
		urlObserver = null;
	}

	window.removeEventListener("popstate", handlePopState);
	window.removeEventListener("hashchange", handleHashChange);
}

/**
 * 处理popstate事件
 */
function handlePopState(): void {
	console.log("🔄 检测到popstate事件，检查是否需要更新搜索关键词高亮");
	updateSearchKeywords();
}

/**
 * 处理hashchange事件
 */
function handleHashChange(): void {
	console.log("🔄 检测到hashchange事件，检查是否需要更新搜索关键词高亮");
	updateSearchKeywords();
}

/**
 * 更新搜索关键词高亮
 */
function updateSearchKeywords(): void {
	const extractor = new KeywordExtractor();

	// 检查当前页面是否是搜索引擎页面
	const sources = extractor.extractKeywords();
	const searchEngineSource = sources.find(
		(source) => source.type === "search_engine",
	);

	if (searchEngineSource && searchEngineSource.keywords.length > 0) {
		console.log(
			"🔍 检测到搜索引擎页面，自动更新搜索关键词:",
			searchEngineSource.keywords,
		);

		// 更新到wordsManager
		const wordsManager = getWordsManager();
		wordsManager.updateSearchWords(searchEngineSource.keywords);
	} else {
		// 如果没有搜索关键词，清空搜索词
		const wordsManager = getWordsManager();
		wordsManager.updateSearchWords([]);
	}
}

/**
 * 检查是否正在运行
 */
export function isSearchKeywordAutoUpdateActive(): boolean {
	return isActive;
}
