import { getTextNodes } from "../kit/getNodes";


export function bionicNestedTextNodes(root: Node = document.body) {
	const textNodes = getTextNodes(root);
	bionicTextNodes(textNodes);
}


export function bionicDirectTextNodes(root: Node) {
	// 获取直接子文本节点并过滤
	const directTextNodes = Array.from(root.childNodes).filter(node => {
		// 仅处理直接子文本节点
		if (node.nodeType !== Node.TEXT_NODE) return false;

		// 复用 getNodes.ts 的过滤逻辑
		const parent = node.parentElement;
		if (!parent) return false;

		// 排除不可见元素（根据 getNodes.ts 逻辑）
		const style = window.getComputedStyle(parent);
		if (style.display === "none" || style.visibility === "hidden") return false;

		// 排除预定义标签（根据 getNodes.ts 的 EXCLUDED_TAGS）
		const EXCLUDED_TAGS = new Set(["input", "textarea", /* 其他排除标签 */]);
		if (EXCLUDED_TAGS.has(parent.tagName.toLowerCase())) return false;

		// 排除空文本节点
		return (node.textContent?.trim() || "").length > 0;
	}) as Text[];
	bionicTextNodes(directTextNodes);
}

/**
 * 遍历并处理给定节点下的所有文本节点
 * 此函数首先获取所有文本节点，然后逐个处理它们
 * 在处理文本节点之前和之后，它会停止和重新启动对DOM树的观察，以确保性能和准确性
 *
 * @param root {Node} - 开始遍历的DOM树的根节点默认为文档的body元素
 */
function bionicTextNodes(textNodes: Text[]) {
	for (const text of textNodes) {
		bionicTextNode(text);
	}
}

export function offBionic() {
	document.querySelectorAll(".bionic-text").forEach((el) => {
		el.outerHTML = el.innerHTML;
	});
}

/**
 * 处理文本节点，将其内容拆分为英文单词和中文字符，并分别应用不同的处理方式
 *
 * 该函数首先获取文本节点的内容，并通过正则表达式将内容分割为英文单词、中文字符和其他字符
 * 然后根据字符类型分别调用相应的处理函数生成新的DOM片段
 * 最终使用新生成的DOM片段替换原始文本节点
 *
 * @param node 待处理的文本节点
 */
export function bionicTextNode(node: Text): void {
	const text = node.textContent || "";
	if (!text.trim()) return; // 忽略空白文本节点

	/**
	 * 使用正则表达式将文本分割成多个部分
	 * 正则表达式([a-zA-Z\u4e00-\u9fa5]+)用于匹配并保留英文单词和中文字符
	 */
	const splitRegex = /([a-zA-Z0-9'-]+|[\u3400-\u9FFF0-9]+)/;
	const words = text.split(splitRegex);

	const fragment = document.createDocumentFragment();
	const isEnglish = /^[a-zA-Z0-9'-]+$/;
	const isChinese = /^[\u3400-\u9FFF0-9]+$/;

	words.forEach((part) => {
		if (isEnglish.test(part)) {
			// 处理英文单词，调用bionicEn函数进行特殊处理（含数字）
			fragment.appendChild(bionicEn(part));
		} else if (isChinese.test(part)) {
			// 处理中文字符或数字组合，调用bionicCn函数进行特殊处理（含数字）
			fragment.appendChild(bionicCn(part));
		} else {
			// 其他字符（如纯标点符号）保持原样不变
			fragment.appendChild(document.createTextNode(part));
		}
	});

	// 使用新生成的DOM片段替换原始文本节点
	node.parentNode?.replaceChild(fragment, node);
}

/**
 * 将英文单词按照特定规则进行“仿生阅读”处理。
 * 规则：将单词的前三分之一（向下取整）部分加粗，其余部分保持不变。
 *
 * @param word - 需要处理的英文单词字符串。
 * @returns DocumentFragment - 包含加粗和未加粗部分的文档片段。
 */
function bionicEn(word: string): DocumentFragment {
	const halfIndex = Math.floor(word.length / 3);
	return createBionicWordFragment(word, halfIndex);
}

/**
 * 将中文单词按照特定规则进行“仿生阅读”处理。
 *
 * @param word - 需要处理的中文单词字符串。
 * @returns DocumentFragment - 包含加粗和未加粗部分的文档片段。
 */
function bionicCn(word: string): DocumentFragment {
	// 根据单词长度确定需要加粗的字符数量
	let boldIndex = 1;
	if (word.length <= 2) {
		boldIndex = 0;
	} else if (word.length === 3) {
		boldIndex = 1;
	} else if (word.length >= 4) {
		boldIndex = 2;
	}
	return createBionicWordFragment(word, boldIndex);
}

/**
 * 根据指定的分割索引，将单词分为加粗部分和普通部分，并生成对应的文档片段。
 *
 * @param word - 需要处理的单词字符串。
 * @param boldIndex - 加粗部分的结束索引（不包括该索引）。
 * @returns DocumentFragment - 包含加粗和未加粗部分的文档片段。
 */
function createBionicWordFragment(word: string, boldIndex: number): DocumentFragment {
	if (word.length === 0) return document.createDocumentFragment(); // 处理空字符串
	if (boldIndex === 0) {
		const fragment = document.createDocumentFragment()
		fragment.appendChild(document.createTextNode(word));
		return fragment
	}

	const firstHalf = word.slice(0, boldIndex); // 提取需要加粗的部分
	const secondHalf = word.slice(boldIndex); // 提取不需要加粗的部分

	const fragment = document.createDocumentFragment();
	if (firstHalf) fragment.appendChild(createStrongElement(firstHalf)); // 避免空文本节点
	if (secondHalf) fragment.appendChild(document.createTextNode(secondHalf)); // 避免空文本节点

	return fragment;
}

/**
 * 创建一个加粗的 HTML 元素，用于仿生阅读的加粗部分。
 *
 * @param text - 需要加粗的文本内容。
 * @returns HTMLElement - 包含加粗样式的 HTML 元素。
 */
function createStrongElement(text: string): HTMLElement {
	// 使用 <strong> 标签实现加粗效果
	const strongElement = document.createElement("strong");
	// 通过类名管理所有样式，确保内外边距为 0 且文本不换行
	strongElement.classList.add("bionic-text");
	strongElement.textContent = text;
	return strongElement;
}