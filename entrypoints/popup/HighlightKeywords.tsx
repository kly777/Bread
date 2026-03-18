import { createSignal, onMount, createEffect, onCleanup } from "solid-js";

export default function HighlightKeywords() {
	// 持久高亮 - 跨页面保存
	const [persistentKeywords, setPersistentKeywords] = createSignal("");
	let debounceTimer: number | null = null;

	// 从storage加载持久高亮关键词
	onMount(async () => {
		try {
			const savedPersistentKeywords = (
				await browser.storage.local.get("local:persistent_highlight_keywords")
			)["local:persistent_highlight_keywords"] as string | null;
			if (savedPersistentKeywords) {
				setPersistentKeywords(savedPersistentKeywords);
			}
		} catch (error) {
			console.warn("加载持久高亮关键词失败:", error);
		}
	});

	// 监听持久高亮变化，使用防抖自动保存和应用
	createEffect(() => {
		const keywords = persistentKeywords();
		savePersistentKeywords(keywords);

		// 使用防抖避免频繁高亮导致的性能问题
		if (debounceTimer) {
			window.clearTimeout(debounceTimer);
		}

		debounceTimer = window.setTimeout(() => {
			applyHighlight();
			debounceTimer = null;
		}, 500); // 500ms防抖延迟
	});

	// 组件卸载时清理定时器
	onCleanup(() => {
		if (debounceTimer) {
			window.clearTimeout(debounceTimer);
			debounceTimer = null;
		}
	});

	/**
	 * 解析关键词文本为关键词数组
	 */
	const parseKeywords = (keywordsText: string): string[] => {
		return keywordsText
			.split("\n")
			.map((word) => word.trim())
			.filter((word) => word.length > 0)
			.filter((word) => word.length >= 2); // 过滤掉单个字母，避免过多匹配
	};

	/**
	 * 应用高亮到页面
	 */
	const applyHighlight = () => {
		const keywords = parseKeywords(persistentKeywords());

		if (keywords.length === 0) {
			removeHighlight();
			return;
		}

		console.log(`🎨 应用高亮关键词: ${keywords.join(", ")}`);
		applyHighlightToPage(keywords);
	};

	/**
	 * 清除持久高亮
	 */
	const clearPersistentKeywords = () => {
		setPersistentKeywords("");
	};

	/**
	 * 保存持久高亮到storage
	 */
	const savePersistentKeywords = async (keywords: string) => {
		try {
			await browser.storage.local.set({
				"local:persistent_highlight_keywords": keywords,
			});
		} catch (error) {
			console.error("保存持久高亮关键词失败:", error);
		}
	};

	/**
	 * 应用高亮到当前页面
	 */
	const applyHighlightToPage = (words: string[]) => {
		browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
			const tab = tabs[0];
			if (tab.id) {
				browser.tabs
					.sendMessage(tab.id, {
						action: "highlightWords",
						words: words,
					})
					.catch((error) => {
						console.warn("发送高亮消息失败:", error);
					});
			}
		});
	};

	/**
	 * 移除高亮
	 */
	const removeHighlight = () => {
		browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
			const tab = tabs[0];
			if (tab.id) {
				browser.tabs
					.sendMessage(tab.id, {
						action: "removeHighlight",
					})
					.catch((error) => {
						console.warn("发送移除高亮消息失败:", error);
					});
			}
		});
	};

	const handleTextareaChange = (e: Event) => {
		const target = e.target as HTMLTextAreaElement;
		setPersistentKeywords(target.value);
	};

	return (
		<div class="highlight-keywords">
			<h3>高亮关键词</h3>

			{/* 持久高亮区域 */}
			<div class="input-section">
				<div class="section-header">
					<h4>持久高亮</h4>
					<span class="section-description">跨页面保存，修改时自动应用</span>
				</div>
				<textarea
					value={persistentKeywords()}
					onInput={handleTextareaChange}
					placeholder="输入要高亮的关键词，每行一个"
					rows="4"
					class="keyword-input"
				></textarea>
				<div class="button-group">
					<button type="button" onClick={clearPersistentKeywords} class="btn btn-secondary">
						清除
					</button>
				</div>
			</div>
		</div>
	);
}
