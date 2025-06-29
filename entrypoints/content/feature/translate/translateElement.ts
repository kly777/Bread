import { translateContent as translateG } from "../../kit/translateG";
import { translateContent as translateMS } from "../../kit/translateMS";
import { translator } from "../../featureManager/translateManager";
import {
  hasVerticalAlign,
  isInFlexContext,
  isInlineElement,
  isPositionedElement,
  shouldWrapElement,
} from "./elementStyle";
import { getSetting } from "../../settingManager";

const translationCache = new Map<string, string>();

const EXCLUDE_TAGS = [
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "SVG",
  "VAR",
  "KBD",
  "INPUT",
  "PRE",
  "TEXTAREA",
  "CODE",
];


/**
 * 从指定的HTML元素中提取所有未被排除的文本节点内容。
 * 该函数会递归遍历元素的所有子节点，排除特定父标签下的文本节点，
 * 并合并剩余的有效文本片段。
 *
 * @param element - 根HTML元素，作为文本提取的起始节点
 * @returns Promise<string> - 合并后的纯文本字符串，已移除所有换行符
 */
async function extractTextFragments(element: HTMLElement): Promise<string> {
  /**
   * 创建TreeWalker遍历器，配置为：
   * 1. 遍历所有节点类型
   * 2. 自定义过滤规则：
   *    - 排除属于EXCLUDE_TAGS父标签的子节点
   *    - 仅接受纯文本节点
   *    - 跳过其他类型节点
   */
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ALL, {
    acceptNode: (node) => {
      // 排除特定标签的子节点（原有逻辑）
      if (node.nodeType === Node.ELEMENT_NODE) {
        const parent = node.parentElement;
        if (parent && EXCLUDE_TAGS.includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
      }
      return node.nodeType === Node.TEXT_NODE
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });

  // 收集有效文本片段的数组
  const textFragments: string[] = [];

  /**
   * 遍历所有通过过滤的文本节点：
   * 1. 移除文本中的换行符
   * 2. 过滤空字符串
   * 3. 将有效文本加入结果数组
   */
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent?.replace(/\n/g, "");
    if (text) textFragments.push(text);
  }

  // 合并所有文本片段并返回最终结果
  return textFragments.join("");
}


function shouldSkipTranslation(text: string): boolean {
  const EN_LETTER_REGEX =
    /[\u0041-\u005a\u0061-\u007a\uFF21-\uFF3A\uFF41-\uFF5A]/u;
  return !EN_LETTER_REGEX.test(text) || !text;
}

/**
 * 翻译指定HTML元素的内容并更新其显示
 * @param element 需要翻译的HTML元素对象
 * @param targetLang 目标语言代码（默认值: "zh-CN"）
 * @returns 返回Promise<void>，表示异步翻译操作完成
 */
export const translateElement = async (
  element: HTMLElement,
  targetLang = "zh-CN"
): Promise<void> => {

  // 验证参数有效性
  if (!(element instanceof HTMLElement)) {
    console.warn("Invalid element provided");
    return;
  }

  // 提取元素文本内容进行翻译处理
  const originalText = await extractTextFragments(element);
  if (shouldSkipTranslation(originalText)) return;

  try {
    // 执行文本翻译操作
    const translatedText = await performTranslation(
      translator, originalText, targetLang
    );

    // 检查全局翻译设置状态
    if (getSetting().translate === false) {
      console.warn("Translation is disabled in settings.");
      return;
    }

    // 如果翻译结果与原文本相同则跳过更新
    if (translatedText === originalText) return;

    // 判断元素布局特性以确定渲染方式
    // 检查是否为内联元素或特殊定位元素
    const shouldUseInline =
      isInlineElement(element) ||
      isPositionedElement(element) ||
      isInFlexContext(element) ||
      hasVerticalAlign(element);

    // 确定是否需要创建包裹容器
    const shouldWrap = !shouldUseInline && shouldWrapElement(element);

    // 更新或创建翻译内容容器
    updateOrCreateTranslationContainer(element, translatedText, shouldWrap);
  } catch (error) {
    // 记录翻译失败的详细错误信息
    console.error("Element translation failed:", {
      error,
      element,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 更新或创建翻译容器元素
 * 如果目标元素已包含翻译容器则不做任何操作，否则根据参数创建新的翻译容器并添加到目标元素中
 * 
 * @param element - 目标HTML元素，用于查找或挂载翻译容器
 * @param translatedText - 需要显示的翻译文本内容
 * @param shouldWrap - 是否允许文本换行的布尔标志
 * 
 * @returns void
 */
function updateOrCreateTranslationContainer(
  element: HTMLElement,
  translatedText: string,
  shouldWrap: boolean
): void {

  // 查找已存在的翻译容器元素
  const existing = Array.from(element.children).find(child =>
    child.classList.contains("translation-result")
  );

  if (existing) {
    return
  } else {
    const resultContainer = createTranslationContainer(translatedText, shouldWrap);
    element.appendChild(resultContainer);
  }
}

function desString(content: string, shouldWrap: boolean): string {
  const resultContent = shouldWrap ? "- " + content : " | " + content;
  return resultContent;
}

/**
 * 创建用于展示翻译结果的容器元素
 * @param translatedText 需要展示的翻译文本内容
 * @param shouldWrap 是否需要使用块级元素包裹
 * @returns 创建的HTML元素容器
 */
function createTranslationContainer(
  translatedText: string,
  shouldWrap: boolean
): HTMLElement {
  const container = document.createElement(shouldWrap ? "div" : "span");

  // 创建基础容器元素：
  // 1. 根据shouldWrap参数决定创建div或span元素
  // 2. 块级元素(div)用于需要独立布局的场景
  // 3. 行内元素(span)用于内联显示场景

  container.classList.add("translation-result");

  // 为行内元素添加title属性：
  // 在非包裹模式下，通过title属性展示完整翻译文本
  // 这可以确保当内容被截断时仍能通过悬停查看完整文本
  if (!shouldWrap) {
    container.title = translatedText;
  }

  const fragment = document.createDocumentFragment();

  // 使用文档片段进行内容填充：
  // 1. 通过desString处理文本内容（具体处理逻辑未展示）
  // 2. 文档片段操作可减少DOM重排次数，提升性能
  // 3. 最终将处理后的内容添加到容器中
  fragment.textContent = desString(translatedText, shouldWrap);

  container.appendChild(fragment);

  return container;
}

/**
 * 封装翻译服务调用逻辑
 * @param translator 使用的翻译引擎（MS/G）
 * @param originalText 原始文本
 * @param targetLang 目标语言
 * @returns 翻译后的文本
 */
async function performTranslation(
  translator: string,
  originalText: string,
  targetLang: string): Promise<string> {

  const cacheKey = `${originalText}:${targetLang}:${translator}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  let result: string = ""
  if (translator === "MS") {
    result = await translateMS(originalText, undefined, targetLang);
  } else if (translator === "G") {
    result = await translateG(originalText, undefined, targetLang);
  }

  translationCache.set(cacheKey, result);
  return result;
}
