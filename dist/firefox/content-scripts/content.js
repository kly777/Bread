/**
 * 文本节点获取工具函数
 *
 * 提供获取和过滤文本节点的功能，支持多种过滤条件
 */
/**
 * 预定义需要排除的标签列表
 * 这些标签通常不包含可读文本内容
 */
const EXCLUDED_TAGS = new Set([
    'input',
    'textarea',
    'select',
    'button',
    'script',
    'style',
    'noscript',
    'template',
    'svg',
    'img',
    'audio',
    'video',
    'option',
    'head',
    'iframe',
    'i',
]);
/**
 * 获取指定根节点下所有符合条件的文本节点
 *
 * @param root - 遍历的起始根节点，默认为 document.body
 * @param options - 配置选项对象
 * @returns 符合过滤条件的文本节点数组
 *
 * 功能说明：
 * 1. 自动排除预定义的非内容型标签（input/textarea等）
 * 2. 可选过滤隐藏元素（通过CSS计算样式判断）
 * 3. 过滤空白内容及满足最小长度要求的文本
 * 4. 支持 Shadow DOM 内容访问
 */
function getTextNodes(root = document.body, options = {}) {
    const walker = getTextWalker(root, options);
    // 遍历收集所有符合条件的文本节点
    const textNodes = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        textNodes.push(node);
    }
    return textNodes;
}
/**
 * 创建文本节点遍历器
 *
 * @param root - 遍历起始节点，默认为 document.body
 * @param options - 过滤配置选项
 * @returns 配置好的 TreeWalker 实例
 */
function getTextWalker(root = document.body, options = {}) {
    // 合并默认配置选项
    const { excludeHidden = true, minContentLength = 0 } = options;
    const acceptNode = (node) => {
        const parent = node.parentElement;
        if (!parent)
            return NodeFilter.FILTER_ACCEPT;
        // 缓存样式以避免重复计算
        const style = window.getComputedStyle(parent);
        // 1. 标签名称过滤：直接拒绝整个子树
        if (EXCLUDED_TAGS.has(parent.tagName.toLowerCase())) {
            return NodeFilter.FILTER_REJECT;
        }
        // 2. 可见性过滤：根据计算样式判断元素是否隐藏
        if (excludeHidden) {
            if (style.display === 'none' ||
                style.visibility === 'hidden') {
                return NodeFilter.FILTER_REJECT;
            }
        }
        // 3. 内容过滤：检查文本内容长度是否达标
        const content = node.textContent?.trim() || '';
        if (content.length < minContentLength) {
            return NodeFilter.FILTER_REJECT;
        }
        // 4. Shadow DOM 处理
        if (node.parentElement?.shadowRoot === node.getRootNode()) {
            return NodeFilter.FILTER_ACCEPT; // 允许访问 Shadow DOM 内容
        }
        return NodeFilter.FILTER_ACCEPT;
    };
    // 创建 TreeWalker 进行节点遍历，配置复合过滤条件
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode,
    });
    return walker;
}

function initStripe() {
    const observe = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const parentElement = node.parentElement;
                        if (parentElement &&
                            hasOnlyTextContent(parentElement)) {
                            stripeElement(parentElement);
                        }
                    }
                });
            }
        });
    });
    observe.observe(document.body, {
        childList: true,
        subtree: true,
    });
    stripeAll();
}
function stripeAll() {
    const walker = getTextWalker(document.body, { excludeHidden: false });
    let node;
    while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (parent && node.textContent?.trim()) {
            stripeElement(parent);
        }
    }
}
/**
 * 为指定元素应用条纹效果
 * @param element - 需要应用条纹效果的元素
 */
function stripeElement(element) {
    const backgroundElement = findAncestorWithBackground(element);
    // console.log(backgroundElement, element);
    if (backgroundElement) {
        // 添加条纹类并设置颜色
        if (!element.classList.contains('striped')) {
            element.classList.add('striped');
            // 获取背景颜色并生成条纹颜色
            // const computedStyle = window.getComputedStyle(backgroundElement);
            // const backgroundColor = computedStyle.backgroundColor;
            // const stripeColor = generateStripeColor(backgroundColor);
            // 通过 CSS 变量注入动态颜色
            // element.style.backgroundColor=stripeColor;
        }
    }
}
/**
 * 查找最近的具有背景色的祖先元素
 * @param element - 起始元素
 * @returns 具有背景色的祖先元素或null
 */
function findAncestorWithBackground(element) {
    let current = element;
    while (current) {
        const style = getComputedStyle(current);
        // 判断背景色是否为非透明或存在背景图
        if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
            style.backgroundImage !== 'none') {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}
/**
 * 检查元素是否只包含文本内容
 * @param element - 需要检查的元素
 * @returns 如果元素只包含文本内容，返回 true；否则返回 false
 */
function hasOnlyTextContent(element) {
    for (const child of element.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            return false;
        }
    }
    return true;
}
// /**
//  * 根据背景颜色生成条纹颜色
//  * @param backgroundColor - 背景颜色字符串
//  * @returns 生成的条纹颜色字符串
//  */
// function generateStripeColor(backgroundColor: string): string {
//     const color = tinycolor(backgroundColor);
//     const complement = color.complement();
//     // 强制设置透明度为 0.3（与 CSS 默认值一致）
//     return complement.setAlpha(0.3).toRgbString();
// }

/**
 * 存储键名生成工具函数
 *
 * 提供基于域名的存储键名生成功能
 */
/**
 * 生成带域名的存储键名（用于popup场景）
 *
 * @param key - 基础键名
 * @returns 完整的存储键名
 */
/**
 * 生成带域名的存储键名
 *
 * @param key - 基础键名
 * @returns 完整的存储键名
 */
function getKeyWithDomain(key) {
    const domain = getCurrentDomain();
    return generateStorageKey(domain, key);
}
let currentDomain = null;
/**
 * 获取当前域名
 *
 * @returns 当前域名
 */
function getCurrentDomain() {
    if (currentDomain) {
        return currentDomain;
    }
    // 从当前页面URL提取（content script场景）
    if (typeof window !== 'undefined') {
        currentDomain = window.location.hostname;
        return currentDomain;
    }
    return 'default';
}
/**
 * 生成存储键名
 *
 * @param domain - 域名
 * @param key - 基础键名
 * @returns 完整的存储键名
 */
function generateStorageKey(domain, key) {
    return `local:${domain}:${key}`;
}

function removeBionicEffects() {
    document.querySelectorAll('.bionic-text').forEach((el) => {
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
function bionicTextNode(node) {
    // console.log(node.textContent);
    const text = node.textContent || '';
    if (!text.trim())
        return; // 忽略空白文本节点
    /**
     * 使用正则表达式将文本分割成多个部分
     * 正则表达式([a-zA-Z\u4e00-\u9fa5]+)用于匹配并保留英文单词和中文字符
     */
    const splitRegex = /([a-zA-Z0-9'-]+|[\u3400-\u9FFF0-9]+)/;
    const words = text.split(splitRegex);
    const fragment = document.createDocumentFragment();
    const isEnglish = /^[a-zA-Z0-9'-]+$/;
    const isChinese = /^[\u3400-\u9FFF0-9]+$/;
    // const isNumber = /^[0-9]+$/;
    words.forEach((part) => {
        if (isEnglish.test(part)) {
            // 处理英文单词，调用bionicEn函数进行特殊处理（含数字）
            fragment.appendChild(bionicEn(part));
        }
        else if (isChinese.test(part)) {
            // 处理中文字符或数字组合，调用bionicCn函数进行特殊处理（含数字）
            fragment.appendChild(bionicCn(part));
        }
        else {
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
function bionicEn(word) {
    const halfIndex = Math.min(4, Math.floor(word.length / 3));
    return createBionicWordFragment(word, halfIndex);
}
/**
 * 将中文单词按照特定规则进行“仿生阅读”处理。
 *
 * @param word - 需要处理的中文单词字符串。
 * @returns DocumentFragment - 包含加粗和未加粗部分的文档片段。
 */
function bionicCn(word) {
    // 根据单词长度确定需要加粗的字符数量
    let boldIndex = 1;
    if (word.length <= 2) {
        boldIndex = 0;
    }
    else if (word.length === 3) {
        boldIndex = 1;
    }
    else if (word.length >= 4) {
        boldIndex = 2;
    }
    return createBionicWordFragment(word, boldIndex);
}
// function bionicNumber(word: string): DocumentFragment {
//     const halfIndex = Math.max(Math.floor(word.length / 3), 1);
//     return createBionicWordFragment(word, halfIndex);
// }
/**
 * 根据指定的分割索引，将单词分为加粗部分和普通部分，并生成对应的文档片段。
 *
 * @param word - 需要处理的单词字符串。
 * @param boldIndex - 加粗部分的结束索引（不包括该索引）。
 * @returns DocumentFragment - 包含加粗和未加粗部分的文档片段。
 */
function createBionicWordFragment(word, boldIndex) {
    if (word.length === 0)
        return document.createDocumentFragment(); // 处理空字符串
    if (boldIndex === 0) {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(document.createTextNode(word));
        return fragment;
    }
    const firstHalf = word.slice(0, boldIndex); // 提取需要加粗的部分
    const secondHalf = word.slice(boldIndex); // 提取不需要加粗的部分
    const fragment = document.createDocumentFragment();
    if (firstHalf)
        fragment.appendChild(createStrongElement(firstHalf)); // 避免空文本节点
    if (secondHalf)
        fragment.appendChild(document.createTextNode(secondHalf)); // 避免空文本节点
    return fragment;
}
/**
 * 创建一个加粗的 HTML 元素，用于仿生阅读的加粗部分。
 *
 * @param text - 需要加粗的文本内容。
 * @returns HTMLElement - 包含加粗样式的 HTML 元素。
 */
function createStrongElement(text) {
    // 使用 <strong> 标签实现加粗效果
    const strongElement = document.createElement('strong');
    // 通过类名管理所有样式，确保内外边距为 0 且文本不换行
    strongElement.classList.add('bionic-text');
    strongElement.textContent = text;
    return strongElement;
}

const intersectionObserverOptions = {
    threshold: 0,
    rootMargin: '300px',
};

/**
 * 仿生文本观察器模块
 * 功能：在元素进入视口时对其文本节点应用仿生效果，并管理相关资源
 * 工作流程：
 * 1. 监听DOM变化暂停/恢复观察器
 * 2. 当元素进入视口时应用文本效果
 * 3. 维护元素与文本节点的映射关系
 * 4. 清理已处理或移除的节点资源
 */
// 使用 Set 存储文本节点，避免重复并提升查找效率
const parentToTextNodesMap = new Map();
/**
 * IntersectionObserver配置选项
 * 获取具体配置参数（阈值0，根边距100px）
 */
const bionicTextObserver = new IntersectionObserver((entries) => {
    manageMutationObserver(false);
    entries.forEach(processVisibleTextElement);
    manageMutationObserver(true);
}, intersectionObserverOptions);
/**
 * 处理IntersectionObserverEntry，当元素进入视口时应用文本节点的仿生效果并清理映射。
 * @param entry - IntersectionObserver回调接收的条目对象，包含目标元素和相交状态
 * @returns {void}
 * @remarks
 * 核心处理步骤：
 * 1. 检查元素有效性（是否仍在DOM中）
 * 2. 应用仿生效果到文本节点（如高亮、动画等）
 * 3. 清理已完成处理的元素与文本节点的映射关系
 * 4. 停止对当前元素的观察以避免重复处理
 */
function processVisibleTextElement(entry) {
    const element = entry.target;
    const setTexts = parentToTextNodesMap.get(element);
    // 增加 document.contains 检查，确保元素仍在 DOM 中
    if (!setTexts || !entry.isIntersecting || !document.contains(element))
        return;
    // 应用仿生效果到文本节点（例如高亮、动画等）
    applyBionicEffect(Array.from(setTexts));
    // 清理元素与文本节点的映射关系
    cleanupAndUnobserve(element);
}
/**
 * 将仿生效果应用到指定文本节点数组
 * @param textNodes - 需要应用效果的文本节点数组
 * @remarks
 * 调用feature/bionic/bionicNode中的bionicTextNode函数实现具体效果
 * @internal
 * 实现细节：遍历每个文本节点并调用bionicTextNode进行处理
 */
function applyBionicEffect(textNodes) {
    textNodes.forEach((text) => bionicTextNode(text));
}
/**
 * 清理指定元素与文本节点的映射关系并停止观察
 * @param element - 需要清理的元素节点
 * @internal
 * 实现细节：删除元素映射并调用unobserve停止观察
 */
function cleanupAndUnobserve(element) {
    parentToTextNodesMap.delete(element);
    bionicTextObserver.unobserve(element);
}
/**
 * 初始化单次使用观察器，开始观察文档主体
 * @remarks
 * 主要用于初始化阶段设置观察起点
 * @internal
 * 实现细节：调用observeElementNode方法观察document.body
 */
function initializeSingleUseObserver() {
    observeElementNode(document.body);
}
/**
 * 观察指定元素的所有文本节点
 * @param ele - 需要观察的元素节点
 * @remarks
 * 调用kit/getTextNodes获取元素下的所有文本节点
 * @internal
 * 实现细节：获取元素下所有符合条件的文本节点并逐个观察
 */
function observeElementNode(ele) {
    getTextNodes(ele).forEach(observeTextNode);
}
/**
 * 观察单个文本节点
 * @param text - 需要观察的文本节点
 * @remarks
 * 1. 检查父元素是否存在且仍在DOM中
 * 2. 建立文本节点与父元素的关联映射
 * @internal
 * 实现细节：获取文本节点的父元素并调用linkTextToElement建立映射
 */
function observeTextNode(text) {
    const parent = text.parentElement;
    if (!parent || !document.contains(parent))
        return; // 新增存在性校验
    // 更新映射关系
    linkTextToElement(parent, text);
}
/**
 * 建立文本节点与其父元素的关联映射
 * @param parent - 父元素节点
 * @param text - 文本节点
 * @remarks
 * 1. 如果父元素已有映射则直接添加新文本节点
 * 2. 如果父元素没有映射则创建新的映射并开始观察
 * @internal
 * 实现细节：使用Map存储元素到文本节点集合的映射关系
 */
function linkTextToElement(parent, text) {
    if (parentToTextNodesMap.has(parent)) {
        const setTexts = parentToTextNodesMap.get(parent);
        if (!setTexts.has(text)) {
            setTexts.add(text);
        }
    }
    else {
        const setTexts = new Set([text]);
        parentToTextNodesMap.set(parent, setTexts);
        bionicTextObserver.observe(parent);
    }
}

/**
 * 文本节点检查工具函数
 *
 * 提供检查元素是否包含文本节点的功能
 */
/**
 * 检查元素是否包含文本节点
 *
 * @param element - 要检查的 DOM 元素
 * @returns 如果存在文本节点则返回 true，否则返回 false
 */
function hasTextNodes(element) {
    for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE &&
            node.textContent?.trim() !== '') {
            return true;
        }
    }
    return false;
}

// import { GetTextNodesOptions } from "./getTextNodes";
const EXCLUDE_TAGS$1 = new Set([
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'SVG',
    'MATH',
    'VAR',
    'SAMP',
    'KBD',
    'PRE',
    'TEXTAREA',
    'INPUT',
    'CODE',
]);
const INLINE_DISPLAY_VALUES = new Set([
    'inline',
    'inline-block',
    'inline-flex',
    'inline-grid',
    'inline-table',
]);
function getTextContainerElement(root = document.body
// options: GetTextNodesOptions = {}
) {
    const walker = getTextContainerWalker(root);
    // 遍历收集所有符合条件的文本节点
    const textNodes = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        // node.textContent = "";
        textNodes.push(node);
    }
    return textNodes;
}
/**
 * 获取包含有效文本内容的容器元素遍历器
 *
 * @param root - 遍历起始节点，默认为document.body
 * @param options - 过滤配置选项
 * @returns 配置好的TreeWalker实例
 */
function getTextContainerWalker(root = document.body
// options: GetTextNodesOptions = {}
) {
    // const { excludeHidden = true } = options;
    const acceptNode = (node) => {
        // 仅处理元素节点
        if (node.nodeType !== Node.ELEMENT_NODE)
            return NodeFilter.FILTER_SKIP;
        const element = node;
        const tagName = element.tagName.toUpperCase();
        // 新增：直接跳过指定标签
        if (EXCLUDE_TAGS$1.has(tagName)) {
            return NodeFilter.FILTER_REJECT; // 跳过该元素及其所有子节点
        }
        // 排除非容器标签
        // if (EXCLUDED_TAGS.has(element.tagName.toLowerCase())) {
        //     return NodeFilter.FILTER_REJECT;
        // }
        // const style = window.getComputedStyle(element);
        // if (
        //     excludeHidden &&
        //     (style.display === "none" || style.visibility === "hidden")
        // ) {
        //     return NodeFilter.FILTER_REJECT;
        // }
        // 文本内容检查
        return isEligibleElementV2(element) ||
            isEligibleElement(element)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
    };
    return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode,
    });
}
/**
 * 判断给定的DOM元素是否符合特定条件（包含文本且父元素不包含文本，排除特定行内元素情况）。
 * @param element 需要检查的DOM元素
 * @returns 如果元素符合条件返回true，否则返回false
 */
function isEligibleElement(element) {
    const parent = element.parentElement;
    if (!parent)
        return false;
    const style = window.getComputedStyle(element);
    /**
     * 过滤行内元素且父元素包含文本的情况
     * 避免将包含纯文本的容器元素中的行内元素误判为目标元素
     */
    if (INLINE_DISPLAY_VALUES.has(style.display) && hasTextNodes(parent)) {
        return false;
    }
    const hasText = hasTextNodes(element);
    const parentHasText = hasTextNodes(parent);
    /**
     * 核心判定逻辑：元素自身必须包含文本节点
     * 且其父元素不能直接包含文本节点
     */
    return hasText && !parentHasText;
}
/**
 * 判断给定的DOM元素是否符合特定条件。
 * @param element 需要检查的DOM元素
 * @returns 如果元素符合条件返回true，否则返回false
 */
function isEligibleElementV2(element) {
    if (!hasTextNodes(element))
        return false;
    const childNodes = element.childNodes;
    if (childNodes.length === 0)
        return false;
    for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];
        // 处理文本节点
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue?.trim();
            if (text)
                continue; // 有效文本节点
            return false; // 空文本节点
        }
        // 处理元素节点
        if (node.nodeType === Node.ELEMENT_NODE) {
            const childElement = node;
            const style = window.getComputedStyle(childElement);
            // 检查是否为行内元素
            if (!INLINE_DISPLAY_VALUES.has(style.display)) {
                return false;
            }
        }
        else {
            // 非元素/文本节点
            return false;
        }
    }
    return true;
}

/**
 * 抽象基类，提供默认实现
 */
class Feature {
    init() {
        // 默认无操作
    }
}

/**
 * 搜索引擎配置工具函数
 *
 * 提供搜索引擎识别和配置管理功能
 */
/**
 * 支持的搜索引擎配置列表
 * 包含主流搜索引擎的配置信息
 */
const searchEngines = [
    { name: 'Google', keywordParam: 'q', urlPattern: '.google.' },
    {
        name: 'Yahoo',
        keywordParam: 'p',
        urlPattern: 'search.yahoo.',
    },
    { name: 'Baidu', keywordParam: 'wd', urlPattern: '.baidu.com' },
    {
        name: 'Baidu',
        keywordParam: 'word',
        urlPattern: '.baidu.com',
    },
    { name: 'Bing', keywordParam: 'q', urlPattern: '.bing.com' },
    {
        name: 'DuckDuckGo',
        keywordParam: 'q',
        urlPattern: 'duckduckgo.com',
    },
    {
        name: 'Sogou',
        keywordParam: 'query',
        urlPattern: 'www.sogou.com',
    },
    { name: 'Weibo', keywordParam: 'q', urlPattern: 's.weibo.com' },
    { name: '360', keywordParam: 'q', urlPattern: '.so.com' },
    {
        name: 'Yandex',
        keywordParam: 'text',
        urlPattern: 'yandex.com',
    },
    {
        name: 'Common1',
        keywordParam: 'search_query',
        urlPattern: '',
    }, // 通用搜索引擎参数
    { name: 'Common2', keywordParam: 'keyword', urlPattern: '' }, // 通用搜索引擎参数
];

/**
 * 页面信息工具函数
 *
 * 提供获取页面语言、搜索引擎识别等功能
 */
let lang = null;
/**
 * 获取页面语言
 *
 * 从 document.documentElement.lang 获取页面语言，如果没有设置则返回 'en'
 * 使用缓存机制避免重复计算
 *
 * @returns 页面语言代码
 */
function pageLang() {
    if (lang !== null) {
        return lang;
    }
    lang = document.documentElement.lang || 'en';
    return lang;
}
/**
 * 判断当前页面是否是搜索引擎页面
 *
 * 通过检查当前页面的主机名是否匹配已知的搜索引擎模式
 *
 * @returns 如果是搜索引擎页面返回 true，否则返回 false
 */
function isSearchEnginePage() {
    const host = window.location.host;
    for (const engine of searchEngines) {
        if (engine.urlPattern && host.includes(engine.urlPattern)) {
            return true;
        }
    }
    return false;
}

/**
 * 翻译功能
 */
class TranslateFeature extends Feature {
    name = 'translate';
    get default() {
        return pageLang().startsWith('en');
    }
    translator = 'MS';
    isActive = false;
    async init() {
        await this.initTranslator();
    }
    async on() {
        if (this.isActive)
            return;
        await this.initTranslator();
        initializeTranslateObserver();
        this.isActive = true;
    }
    async off() {
        if (!this.isActive)
            return;
        stopTranslatorObserver();
        this.isActive = false;
    }
    // 以下是从 translateManager.ts 迁移的函数
    async initTranslator() {
        try {
            const storedTranslator = await storage.getItem('local:translator');
            if (storedTranslator === 'MS' ||
                storedTranslator === 'G') {
                this.translator = storedTranslator;
            }
        }
        catch (error) {
            console.warn('Failed to load translator setting:', error);
        }
    }
    async setTranslator(newTranslator) {
        this.translator = newTranslator;
        try {
            await storage.setItem('local:translator', newTranslator);
        }
        catch (error) {
            console.warn('Failed to save translator setting:', error);
        }
    }
    getTranslator() {
        return this.translator;
    }
}

// 创建全局实例（单例）
const translateFeature = new TranslateFeature();
// 当前翻译器变量，与 translateFeature 同步
let currentTranslator = 'MS';
// 初始化翻译器设置（异步）
translateFeature
    .init()
    .then(() => {
    currentTranslator = translateFeature.getTranslator();
})
    .catch(() => { });
const translator = currentTranslator; // 导出变量，但注意这是静态的；使用 getTranslator() 获取最新值
// 获取当前翻译器
function getTranslator() {
    return translateFeature.getTranslator();
}

const EXCLUDE_TAGS = [
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'SVG',
    'VAR',
    'KBD',
    'INPUT',
    'PRE',
    'TEXTAREA',
    'INPUT',
];
// 全局标记，用于记录已经被排除翻译的元素
const excludedElements = new WeakSet();
const EXCLUDE_CLASSES = ['code-line', 'anchor-container'];
/**
 * 检查单个元素是否应该被排除翻译
 */
function isElementExcludable(element) {
    // 检查元素本身是否是排除标签
    if (EXCLUDE_TAGS.includes(element.tagName)) {
        return true;
    }
    // 检查元素是否具有排除的类名
    if (element.className) {
        const classList = element.className.split(' ');
        if (EXCLUDE_CLASSES.some((cls) => classList.includes(cls))) {
            return true;
        }
    }
    // 检查元素是否具有 contenteditable 属性
    if (element.hasAttribute('contenteditable')) {
        const editableValue = element.getAttribute('contenteditable');
        // contenteditable 为 true 或空字符串时，元素可编辑
        if (editableValue === 'true' || editableValue === '') {
            return true;
        }
    }
    return false;
}
/**
 * 检查元素或其祖先是否在排除标签内
 * 这个方法确保翻译行为与DOM结构顺序无关
 */
function isElementExcluded(element) {
    // 如果已经在排除集合中，直接返回
    if (excludedElements.has(element)) {
        return true;
    }
    // 检查元素本身是否应该被排除
    if (isElementExcludable(element)) {
        excludedElements.add(element);
        return true;
    }
    // 检查祖先元素链中是否有排除标签
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
        if (isElementExcludable(parent)) {
            excludedElements.add(element);
            return true;
        }
        parent = parent.parentElement;
    }
    return false;
}
/**
 * 从指定的HTML元素中提取所有未被排除的文本节点内容。
 * 该函数会递归遍历元素的所有子节点，排除特定父标签下的文本节点，
 * 并合并剩余的有效文本片段。
 *
 * @param element - 根HTML元素，作为文本提取的起始节点
 * @returns Promise<string> - 合并后的纯文本字符串，已移除所有换行符
 */
// 预计算的排除元素映射，用于快速查找
const excludedAncestors = new WeakSet();
async function extractTextFragments(element) {
    // 首先检查元素是否被排除
    if (isElementExcluded(element)) {
        return '';
    }
    /**
     * 使用优化的TreeWalker遍历所有文本节点
     * 保持原有逻辑不变，但优化遍历性能
     */
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            // 快速检查：如果父元素在预计算的排除映射中，直接拒绝
            const parent = node.parentElement;
            if (parent && excludedAncestors.has(parent)) {
                return NodeFilter.FILTER_REJECT;
            }
            // 保持原有的父元素链检查逻辑
            let currentParent = parent;
            while (currentParent &&
                currentParent !== element) {
                if (EXCLUDE_TAGS.includes(currentParent.tagName)) {
                    // 将排除的祖先添加到预计算映射中，供后续快速检查
                    excludedAncestors.add(currentParent);
                    return NodeFilter.FILTER_REJECT;
                }
                currentParent =
                    currentParent.parentElement;
            }
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    // 收集有效文本片段的数组
    const textFragments = [];
    /**
     * 遍历所有通过过滤的文本节点：
     * 1. 移除文本中的换行符
     * 2. 过滤空字符串
     * 3. 将有效文本加入结果数组
     */
    let currentNode = walker.nextNode();
    while (currentNode) {
        const text = currentNode.textContent?.replace(/\n/g, '').trim();
        if (text) {
            textFragments.push(text);
        }
        currentNode = walker.nextNode();
    }
    // 合并所有文本片段并返回最终结果
    return textFragments.join('');
}
/**
 * 优化文本检测：添加长度检查和更精确的英文检测
 */
function shouldSkipTranslation(text) {
    if (!text || text.length < 2)
        return true;
    // 优化正则表达式，只检查是否包含英文字母
    const EN_LETTER_REGEX = /[a-zA-Z]/;
    return !EN_LETTER_REGEX.test(text);
}
/**
 * 检查是否应该跳过元素翻译
 */
function shouldSkipElementTranslation(element) {
    // 提前检查设置，避免不必要的处理
    if (getSetting().translate === false) {
        return true;
    }
    // 验证参数有效性
    if (!(element instanceof HTMLElement)) {
        return true;
    }
    // 检查是否已经有翻译结果
    if (element.querySelector('.translation-result')) {
        return true;
    }
    if (element.classList.contains('no-translate')) {
        return true;
    }
    // 检查元素是否被排除
    if (isElementExcluded(element)) {
        return true;
    }
    return false;
}
// 预处理的根元素记录，避免重复处理
const processedRoots = new WeakSet();
/**
 * 批量预处理元素，标记所有应该排除翻译的元素
 * 完全避免遍历整个文档，采用按需处理和增量更新策略
 */
function preprocessExcludedElements(root = document.body) {
    // 如果已经处理过这个根元素，则跳过
    if (processedRoots.has(root)) {
        return;
    }
    // 使用精确的选择器只获取需要排除的元素类型，避免全文档遍历
    const excludeSelectors = [
        // 排除标签
        ...EXCLUDE_TAGS.map((tag) => tag.toLowerCase()),
        // 可编辑元素
        '[contenteditable="true"]',
        '[contenteditable=""]',
        // 排除类
        ...EXCLUDE_CLASSES.map((cls) => `.${cls}`),
    ].join(',');
    // 只查询需要排除的元素，而不是所有元素
    const directExcludedElements = root.querySelectorAll(excludeSelectors);
    // 标记直接排除的元素
    directExcludedElements.forEach((el) => {
        const htmlEl = el;
        excludedElements.add(htmlEl);
        excludedAncestors.add(htmlEl);
    });
    // 使用增量处理策略：只处理可见区域的元素
    // 对于大型文档，我们只预处理首屏内容，其余部分按需处理
    if (root === document.body) {
        // 使用IntersectionObserver来延迟处理视口外的元素
        const lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    // 对于进入视口的元素，检查是否需要排除
                    if (isElementExcludable(element)) {
                        excludedElements.add(element);
                        excludedAncestors.add(element);
                    }
                    lazyObserver.unobserve(element);
                }
            });
        }, {
            rootMargin: '50px', // 提前50px开始观察
        });
        // 只观察直接子元素中的潜在排除元素，避免性能开销
        const potentialElements = root.querySelectorAll('*');
        // 限制初始观察数量，避免性能问题
        const maxInitialObserve = 100;
        for (let i = 0; i <
            Math.min(potentialElements.length, maxInitialObserve); i++) {
            const el = potentialElements[i];
            // 快速检查是否需要观察
            if (EXCLUDE_TAGS.includes(el.tagName) ||
                el.hasAttribute('contenteditable') ||
                EXCLUDE_CLASSES.some((cls) => el.classList.contains(cls))) {
                lazyObserver.observe(el);
            }
        }
    }
    // 标记这个根元素为已处理
    processedRoots.add(root);
}

/**
 * 翻译相关工具函数
 *
 * 提供文本翻译相关的功能
 */
/**
 * 判断文本是否应该跳过翻译
 *
 * @param text - 要检查的文本
 * @returns 如果应该跳过翻译返回 true，否则返回 false
 */
// 项目中使用的常量
const URL_GOOGLE_TRAN = 'https://translate.googleapis.com/translate_a/single';
// 生成谷歌翻译请求
const genGoogle = ({ text, from, to, url = URL_GOOGLE_TRAN, }) => {
    const params = {
        client: 'gtx',
        dt: 't',
        dj: '1',
        ie: 'UTF-8',
        sl: from,
        tl: to,
        q: text,
    };
    const input = `${url}?${new URLSearchParams(params).toString()}`;
    const init = {
    // GET请求不需要Content-Type头
    };
    return { input, init };
};
// 发送HTTP请求
const fetchTranslation = async (url, init) => {
    const response = await fetch(url, init);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    try {
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Failed to parse JSON from response:', error);
        throw new Error('Failed to fetch translation, invalid JSON response.');
    }
};
// 谷歌翻译函数
const translateContentGoogle = async (text, from = 'en', to) => {
    const { input, init } = genGoogle({ text, from, to });
    const data = await fetchTranslation(input, init);
    // 解析翻译结果
    const translatedText = data.sentences?.[0]?.trans || '';
    return translatedText;
};
const MICROSOFT_AUTH_ENDPOINT = 'https://edge.microsoft.com/translate/auth';
const MICROSOFT_TRANSLATE_API_URL = 'https://api-edge.cognitive.microsofttranslator.com/translate';
/**
 * 解码JWT令牌并提取过期时间戳
 */
const decodeAuthTokenExpiration = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1])).exp;
    }
    catch (error) {
        console.error('Token decoding failed:', error);
        return Date.now();
    }
};
/**
 * 获取微软认证令牌
 */
const acquireAuthToken = async () => {
    const response = await fetch(MICROSOFT_AUTH_ENDPOINT);
    if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
    }
    const tokenValue = await response.text();
    return {
        value: tokenValue,
        expirationTimestamp: decodeAuthTokenExpiration(tokenValue),
    };
};
let cachedAuthToken = null;
/**
 * 刷新身份验证令牌并返回新令牌及过期时间
 */
const refreshAuthToken = async () => {
    if (cachedAuthToken) {
        const expiration = decodeAuthTokenExpiration(cachedAuthToken);
        if (expiration * 1000 > Date.now() + 1000) {
            return [cachedAuthToken, expiration];
        }
    }
    const { value, expirationTimestamp } = await acquireAuthToken();
    cachedAuthToken = value;
    return [value, expirationTimestamp];
};
/**
 * 构建微软翻译API请求配置和URL
 */
const buildTranslationRequest = async (request) => {
    const [authToken] = await refreshAuthToken();
    const queryParameters = new URLSearchParams({
        from: request.sourceLang || 'auto',
        to: request.targetLang || 'zh-CN',
        'api-version': '3.0',
    });
    return [
        `${MICROSOFT_TRANSLATE_API_URL}?${queryParameters}`,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            method: 'POST',
            body: JSON.stringify([{ Text: request.content }]),
        },
    ];
};
/**
 * 执行翻译请求的异步函数
 */
const executeTranslation = async (endpoint, config) => {
    const response = await fetch(endpoint, config);
    if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
    }
    const result = await response.json();
    return result[0].translations[0].text;
};
/**
 * 微软翻译函数
 */
const translateContentMicrosoft = async (text, sourceLang = 'en', targetLang = 'zh-CN') => {
    try {
        const [apiEndpoint, requestConfig] = await buildTranslationRequest({
            content: text,
            sourceLang,
            targetLang,
        });
        return await executeTranslation(apiEndpoint, requestConfig);
    }
    catch (error) {
        console.error('Translation workflow error:', error);
        return text;
    }
};

class SimpleTranslationCache {
    cache = new Map();
    MAX_CACHE_SIZE = 1000;
    get(key) {
        return this.cache.get(key) || null;
    }
    set(key, result) {
        this.cache.set(key, result);
        // 简单的缓存清理
        if (this.cache.size > this.MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
    }
    clear() {
        this.cache.clear();
    }
}
const cache = new SimpleTranslationCache();
class SimpleBatchTranslator {
    queue = [];
    processing = false;
    BATCH_DELAY = 10; // 固定延迟10ms
    BATCH_SIZE = 5; // 固定批量大小
    async addToBatch(originalText, targetLang) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                originalText,
                targetLang,
                resolve,
                reject,
            });
            this.processBatch();
        });
    }
    async processBatch() {
        if (this.processing || this.queue.length === 0)
            return;
        this.processing = true;
        // 使用固定延迟
        await new Promise((resolve) => window.setTimeout(resolve, this.BATCH_DELAY));
        // 处理固定大小的批次
        const batch = this.queue.splice(0, this.BATCH_SIZE);
        this.processing = false;
        // 并行处理批次
        const promises = batch.map((item) => this.performSingleTranslation(item.originalText, item.targetLang)
            .then((result) => ({ item, result }))
            .catch((error) => ({ item, error })));
        const results = await Promise.allSettled(promises);
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                const value = result.value;
                if ('result' in value) {
                    value.item.resolve(value.result);
                }
                else {
                    value.item.reject(value.error);
                }
            }
        });
        // 处理剩余请求
        if (this.queue.length > 0) {
            this.processBatch();
        }
    }
    async performSingleTranslation(originalText, targetLang) {
        const currentTranslator = getTranslator();
        const cacheKey = `${originalText}:${targetLang}:${currentTranslator}`;
        // 检查缓存
        const cachedResult = cache.get(cacheKey);
        if (cachedResult !== null) {
            return cachedResult;
        }
        // 文本长度限制
        if (originalText.length > 50000 || originalText.length < 3) {
            return originalText;
        }
        let result = '';
        try {
            if (currentTranslator === 'MS') {
                result = await translateContentMicrosoft(originalText, undefined, targetLang);
            }
            else if (currentTranslator === 'G') {
                result = await translateContentGoogle(originalText, undefined, targetLang);
            }
            // 确保结果有效
            if (!result || result.trim().length === 0) {
                result = originalText;
            }
        }
        catch (error) {
            // 翻译失败时返回原文
            result = originalText;
            console.warn('Translation failed, using original text:', error);
        }
        // 更新缓存
        cache.set(cacheKey, result);
        return result;
    }
}
const batchTranslator = new SimpleBatchTranslator();
/**
 * 翻译操作
 */
async function performTranslation(_translator, originalText, targetLang) {
    return batchTranslator.addToBatch(originalText, targetLang);
}

/**
 * 判断指定HTML元素是否为内联元素
 * @param element 需要检测的HTML元素
 * @returns 当元素显示模式为inline/inline-block时返回true，否则返回false
 */
function isInlineElement(element) {
    // 定义内联显示模式的合法枚举值
    const INLINE_DISPLAYS = ['inline', 'inline-block', 'inline-flex'];
    /*
     * 获取并标准化元素的 display 样式值
     * - 使用 window.getComputedStyle 确保获取最终应用的样式
     * - trim() 去除首尾空白
     * - toLowerCase() 保证与枚举值匹配
     */
    const display = window
        .getComputedStyle(element)
        .display.trim()
        .toLowerCase();
    return INLINE_DISPLAYS.includes(display);
}
//绝对定位/固定定位元素通常有特殊布局需求，行内容器更利于保持原有定位关系
function isPositionedElement(element) {
    const position = window.getComputedStyle(element).position;
    return ['absolute', 'fixed', 'sticky'].includes(position);
}
//弹性布局/网格布局中的子元素使用块级容器可能破坏布局结构
function isInFlexContext(element) {
    const parent = element.parentElement;
    if (!parent)
        return false;
    const display = window.getComputedStyle(parent).display;
    return display.includes('flex') || display.includes('grid');
}
//设置特殊垂直对齐方式的元素使用块级容器可能破坏对齐效果
function hasVerticalAlign(element) {
    const align = window.getComputedStyle(element).verticalAlign;
    return align !== 'auto' && align !== 'baseline';
}
// //包含其他DOM元素的混合内容更适合使用行内容器包裹
// export function hasMixedContent(element: HTMLElement): boolean {
//     return Array.from(element.childNodes).some(
//         (node) =>
//             node.nodeType === Node.ELEMENT_NODE &&
//             node !== element.querySelector(".translation-result")
//     );
// }
/**
 * 判断元素是否设置了文本自动换行样式
 * @param element - 需要检测的HTML元素
 * @returns 当元素的textWrapMode为'wrap'时返回true
 */
function shouldWrapElement(element) {
    // 获取元素当前计算后的文本换行模式
    const textWrapMode = window
        .getComputedStyle(element)
        .textWrapMode.trim();
    // 判断是否为强制换行模式
    console.log(textWrapMode);
    return textWrapMode === 'wrap' || textWrapMode === '';
}

// 高性能样式缓存系统
const styleCache = new WeakMap();
// 常见元素样式预计算 - 基于标签名的快速缓存
const tagNameStyleCache = new Map([
    ['DIV', { shouldUseInline: false, shouldWrap: true }],
    ['SPAN', { shouldUseInline: true, shouldWrap: false }],
    ['P', { shouldUseInline: false, shouldWrap: true }],
    ['A', { shouldUseInline: true, shouldWrap: false }],
    ['STRONG', { shouldUseInline: true, shouldWrap: false }],
    ['EM', { shouldUseInline: true, shouldWrap: false }],
    ['LI', { shouldUseInline: false, shouldWrap: true }],
    ['H1', { shouldUseInline: false, shouldWrap: true }],
    ['H2', { shouldUseInline: false, shouldWrap: true }],
    ['H3', { shouldUseInline: false, shouldWrap: true }],
    ['H4', { shouldUseInline: false, shouldWrap: true }],
    ['H5', { shouldUseInline: false, shouldWrap: true }],
    ['H6', { shouldUseInline: false, shouldWrap: true }],
]);
function desString(content, shouldWrap) {
    const resultContent = shouldWrap
        ? '- ' + content
        : ' <' + content + '> ';
    return resultContent;
}
/**
 * 创建用于展示翻译结果的容器元素
 * @param translatedText 需要展示的翻译文本内容
 * @param shouldWrap 是否需要使用块级元素包裹
 * @returns 创建的HTML元素容器
 */
function createTranslationContainer(translatedText, shouldWrap) {
    const container = document.createElement(shouldWrap ? 'div' : 'span');
    // 创建基础容器元素：
    // 1. 根据shouldWrap参数决定创建div或span元素
    // 2. 块级元素(div)用于需要独立布局的场景
    // 3. 行内元素(span)用于内联显示场景
    container.classList.add('translation-result');
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
 * 更新或创建翻译容器元素
 * 如果目标元素已包含翻译容器则不做任何操作，否则根据参数创建新的翻译容器并添加到目标元素中
 *
 * @param element - 目标HTML元素，用于查找或挂载翻译容器
 * @param translatedText - 需要显示的翻译文本内容
 * @param shouldWrap - 是否允许文本换行的布尔标志
 *
 * @returns void
 */
function updateOrCreateTranslationContainer(element, translatedText, shouldWrap) {
    // 查找已存在的翻译容器元素
    const existing = Array.from(element.children).find((child) => child.classList.contains('translation-result'));
    if (existing) {
        return;
    }
    else {
        const resultContainer = createTranslationContainer(translatedText, shouldWrap);
        insertAfterLastTextElement(element, resultContainer);
    }
}
// 批量DOM操作队列
const domOperationQueue = [];
let domOperationScheduled = false;
/**
 * 调度批量DOM操作
 */
function scheduleDomOperation(element, container) {
    domOperationQueue.push({ element, container });
    if (!domOperationScheduled) {
        domOperationScheduled = true;
        // 使用 requestAnimationFrame 在下一帧批量处理DOM操作
        window.requestAnimationFrame(() => {
            processDomOperationQueue();
        });
    }
}
/**
 * 处理批量DOM操作队列
 */
function processDomOperationQueue() {
    domOperationScheduled = false;
    const operations = [...domOperationQueue];
    domOperationQueue.length = 0;
    // 批量处理所有DOM操作
    operations.forEach(({ element, container }) => {
        const position = findOptimalInsertPosition(element);
        if (position.node && position.isAfter) {
            position.node.parentNode?.insertBefore(container, position.node.nextSibling);
        }
        else if (position.node && !position.isAfter) {
            position.node.parentNode?.insertBefore(container, position.node);
        }
        else {
            element.appendChild(container);
        }
    });
}
/**
 * 优化的插入位置查找算法
 */
function findOptimalInsertPosition(element) {
    // 快速检查：如果元素没有子节点，直接返回null表示追加到末尾
    if (!element.lastChild) {
        return { node: null, isAfter: false };
    }
    // 从最后一个子节点开始向前查找
    let node = element.lastChild;
    while (node) {
        // 快速检查：如果是文本节点且包含内容
        if (node.nodeType === Node.TEXT_NODE &&
            node.textContent?.trim()) {
            return { node, isAfter: true };
        }
        // 如果是元素节点
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            // 快速排除翻译结果容器
            if (el.classList?.contains('translation-result')) {
                node = node.previousSibling;
                continue;
            }
            // 检查是否包含文本内容
            if (el.textContent?.trim()) {
                return { node, isAfter: true };
            }
            // 检查是否包含SVG
            if (el.querySelector('svg')) {
                return { node, isAfter: true };
            }
        }
        node = node.previousSibling;
    }
    return { node: null, isAfter: false };
}
/**
 * 将翻译结果容器插入到目标元素中最后一个有文本或svg的元素之后
 * 使用批量DOM操作和优化算法
 * @param element - 目标HTML元素
 * @param resultContainer - 翻译结果容器元素
 */
function insertAfterLastTextElement(element, resultContainer) {
    // 使用批量DOM操作调度
    scheduleDomOperation(element, resultContainer);
}
/**
 * 获取元素的样式信息 - 优化版本
 */
function getElementStyleInfo(element) {
    // 首先检查WeakMap缓存
    let styleInfo = styleCache.get(element);
    if (styleInfo) {
        return styleInfo;
    }
    // 检查标签名缓存
    const tagName = element.tagName;
    const tagStyle = tagNameStyleCache.get(tagName);
    let shouldUseInline;
    let shouldWrap;
    if (tagStyle) {
        // 使用预计算的标签样式作为基准
        shouldUseInline = tagStyle.shouldUseInline;
        shouldWrap = tagStyle.shouldWrap;
        // 对于预定义样式，只在实际需要时进行详细检查
        if (shouldUseInline) {
            // 行内元素可能需要额外检查定位和flex上下文
            shouldUseInline =
                !isPositionedElement(element) &&
                    !isInFlexContext(element);
        }
    }
    else {
        // 未知标签，进行完整计算
        shouldUseInline =
            isInlineElement(element) ||
                isPositionedElement(element) ||
                isInFlexContext(element) ||
                hasVerticalAlign(element);
        shouldWrap = !shouldUseInline && shouldWrapElement(element);
    }
    styleInfo = { shouldUseInline, shouldWrap };
    styleCache.set(element, styleInfo);
    return styleInfo;
}

/**
 * 翻译指定HTML元素的内容并更新其显示
 * @param element 需要翻译的HTML元素对象
 * @param targetLang 目标语言代码（默认值: "zh-CN"）
 * @returns 返回Promise<void>，表示异步翻译操作完成
 */
const translateElement = async (element, targetLang = 'zh-CN') => {
    // 提前检查是否应该跳过翻译
    if (shouldSkipElementTranslation(element)) {
        return;
    }
    // 提取元素文本内容进行翻译处理
    const originalText = await extractTextFragments(element);
    if (shouldSkipTranslation(originalText)) {
        return;
    }
    try {
        // 执行文本翻译操作
        const translatedText = await performTranslation(translator, originalText, targetLang);
        // 如果翻译结果与原文本相同则跳过更新
        if (translatedText === originalText) {
            return;
        }
        // 获取元素样式信息
        const styleInfo = getElementStyleInfo(element);
        // 更新或创建翻译内容容器
        updateOrCreateTranslationContainer(element, translatedText, styleInfo.shouldWrap);
    }
    catch (error) {
        console.error('Element translation failed:', {
            error,
            element,
            timestamp: new Date().toISOString(),
        });
    }
};

const translateObserver = new IntersectionObserver((entries) => {
    manageMutationObserver(false);
    //  处理所有条目
    entries.filter((e) => e.isIntersecting).forEach(processElement);
    manageMutationObserver(true);
}, intersectionObserverOptions);
// 主处理逻辑
function processElement(entry) {
    const element = entry.target;
    translateElement(element);
    translateObserver.unobserve(element); // 立即清理
}
// 初始化入口
function initializeTranslateObserver() {
    // 预处理排除元素，确保翻译行为与DOM结构顺序无关
    preprocessExcludedElements(document.body);
    observeTranslateElements(document.body);
}
// 统一观察方法
function observeTranslateElements(root) {
    getTextContainerElement(root).forEach((el) => translateObserver.observe(el));
}
function stopTranslatorObserver() {
    translateObserver.disconnect();
    document.querySelectorAll('.translation-result').forEach((tr) => {
        tr.remove();
    });
}

/**
 * 关键词提取器
 * 负责从搜索引擎URL、页面元素等自动提取搜索关键词
 */
class KeywordExtractor {
    // 支持的搜索引擎配置列表
    searchEngines = searchEngines;
    // 搜索框选择器列表，用于识别页面中的搜索输入框
    inputSelectors = [
        '#query',
        '#search',
        '#keyword',
        '#script_q',
        '#search-q',
        '.input',
    ];
    /**
     * 从多个来源提取关键词
     * 按可信度排序返回关键词来源列表
     * @returns 排序后的关键词来源数组
     */
    extractKeywords() {
        const sources = [];
        // 1. 从当前页面的搜索引擎URL提取（可信度最高）
        const searchEngineKeywords = this.extractFromSearchEngine();
        if (searchEngineKeywords.length > 0) {
            sources.push({
                type: 'search_engine',
                keywords: searchEngineKeywords,
                confidence: 0.9,
            });
        }
        // 2. 从引用页面（referer）的搜索引擎URL提取
        const refererKeywords = this.extractFromReferer();
        if (refererKeywords.length > 0) {
            sources.push({
                type: 'referer',
                keywords: refererKeywords,
                confidence: 0.7,
            });
        }
        // 3. 从页面中的输入框提取
        const inputBoxKeywords = this.extractFromInputBoxes();
        if (inputBoxKeywords.length > 0) {
            sources.push({
                type: 'input_box',
                keywords: inputBoxKeywords,
                confidence: 0.6,
            });
        }
        // 4. 从继承的关键词提取（通过window.name传递）
        const inheritedKeywords = this.extractFromInherited();
        if (inheritedKeywords.length > 0) {
            sources.push({
                type: 'inherited',
                keywords: inheritedKeywords,
                confidence: 0.8,
            });
        }
        // 按可信度降序排序
        return sources.sort((a, b) => b.confidence - a.confidence);
    }
    extractFromSearchEngine() {
        const currentUrl = window.location.href;
        const host = window.location.host;
        for (const engine of this.searchEngines) {
            if (engine.urlPattern &&
                host.includes(engine.urlPattern)) {
                const keywords = this.getKeywordsFromUrl(currentUrl, engine.keywordParam);
                if (keywords.length > 0) {
                    return keywords;
                }
            }
        }
        return [];
    }
    extractFromReferer() {
        const referer = document.referrer;
        if (!referer)
            return [];
        const host = new URL(referer).host;
        for (const engine of this.searchEngines) {
            if (engine.urlPattern &&
                host.includes(engine.urlPattern)) {
                const keywords = this.getKeywordsFromUrl(referer, engine.keywordParam);
                if (keywords.length > 0) {
                    return keywords;
                }
            }
        }
        return [];
    }
    extractFromInputBoxes() {
        for (const selector of this.inputSelectors) {
            const input = document.querySelector(selector);
            if (input && input.value && input.value.trim()) {
                return this.processKeywords(input.value.trim());
            }
        }
        return [];
    }
    extractFromInherited() {
        if (window.name &&
            window.name.startsWith('bread_highlight::')) {
            const match = window.name.match(/bread_highlight::(.+)/);
            if (match && match[1]) {
                try {
                    const decoded = decodeURIComponent(match[1]);
                    return this.processKeywords(decoded);
                }
                catch {
                    return [];
                }
            }
        }
        return [];
    }
    getKeywordsFromUrl(url, param) {
        try {
            const urlObj = new URL(url);
            const keywordStr = urlObj.searchParams.get(param);
            if (keywordStr) {
                return this.processKeywords(keywordStr);
            }
        }
        catch {
            return [];
        }
        return [];
    }
    processKeywords(keywordStr) {
        let processed = keywordStr.replace(/\+/g, ' ').trim();
        try {
            processed = decodeURIComponent(processed);
        }
        catch { }
        const keywords = this.splitKeywords(processed);
        return this.filterKeywords(keywords);
    }
    splitKeywords(text) {
        const keywords = [];
        const segments = text.split(/[\s,，、;；]+/);
        for (const segment of segments) {
            if (segment.trim()) {
                keywords.push(segment.trim());
            }
        }
        return keywords;
    }
    filterKeywords(keywords) {
        const skipWords = new Set([
            'the',
            'to',
            'in',
            'on',
            'among',
            'between',
            'and',
            'a',
            'an',
            'of',
            'by',
            'with',
        ]);
        return keywords.filter((keyword) => {
            if (keyword.length <= 1)
                return false;
            if (skipWords.has(keyword.toLowerCase()) &&
                keyword === keyword.toLowerCase()) {
                return false;
            }
            return true;
        });
    }
    setWindowKeywords(keywords) {
        if (keywords.length > 0) {
            const encoded = encodeURIComponent(keywords.join(' '));
            window.name = `bread_highlight::${encoded}`;
        }
    }
}

/**
 * 预定义高亮颜色方案
 * 提供多组美观的颜色方案，每组包含10种颜色
 */
const STYLE_COLORS = [
    [
        '#FFFF80',
        '#99ccff',
        '#ff99cc',
        '#66cc66',
        '#cc99ff',
        '#ffcc66',
        '#66aaaa',
        '#dd9966',
        '#aaaaaa',
        '#dd6699',
    ], // 方案0：明亮色系
    [
        '#FFFFa0',
        '#bbeeff',
        '#ffbbcc',
        '#88ee88',
        '#ccbbff',
        '#ffee88',
        '#88cccc',
        '#ffbb88',
        '#cccccc',
        '#ffaabb',
    ], // 方案1：柔和色系
    [
        '#D6E19C',
        '#A2BFE1',
        '#DC95BF',
        '#1FC6B2',
        '#928AD3',
        '#E4C994',
        '#94CCC3',
        '#D5B87C',
        '#B2D1D3',
        '#DD8DB0',
    ], // 方案2：自然色系
    [
        '#ff7575',
        '#ff9175',
        '#ffca75',
        '#ffff75',
        '#75ff75',
        '#75fff1',
        '#75c1ff',
        '#757aff',
        '#d675ff',
        '#ff75cc',
    ], // 方案3：鲜艳色系
    [
        '#EBD9CB',
        '#D8B0B0',
        '#ACD4D6',
        '#C3BAB1',
        '#E7ADAC',
        '#EBC1A8',
        '#A6BAAF',
        '#B98A82',
        '#e8d1cb',
        '#DECECE',
    ], // 方案4：复古色系
    [
        '#FFF36D',
        '#8DE971',
        '#FFCD8A',
        '#FFACB6',
        '#F3C9E4',
        '#FF9DE5',
        '#6DD5C3',
        '#B29EE7',
        '#A6DDEA',
        '#50C2E1',
    ], // 方案5：现代色系
];
/**
 * 预定义边框颜色方案
 * 与STYLE_COLORS对应的边框颜色，用于高亮框的边框
 */
const BORDER_COLORS = [
    [
        '#aaaa20',
        '#4477aa',
        '#aa4477',
        '#117711',
        '#7744aa',
        '#aa7711',
        '#115555',
        '#884411',
        '#555555',
        '#881144',
    ], // 方案0对应的边框色
    [
        '#aaaa40',
        '#6699aa',
        '#aa6699',
        '#339933',
        '#9966aa',
        '#aa9933',
        '#337777',
        '#aa6633',
        '#777777',
        '#aa3366',
    ], // 方案1对应的边框色
    [
        '#aeb780',
        '#869eb9',
        '#9e6c89',
        '#158679',
        '#5f5988',
        '#8b7b59',
        '#5e837c',
        '#8a7750',
        '#728789',
        '#955f77',
    ], // 方案2对应的边框色
    [
        '#be5858',
        '#b86a56',
        '#b89254',
        '#b8b855',
        '#52b652',
        '#54b6ac',
        '#4f85b2',
        '#4f53b3',
        '#9450b2',
        '#ad4e8a',
    ], // 方案3对应的边框色
    [
        '#ac9f95',
        '#947878',
        '#748e8f',
        '#7f7973',
        '#956e6e',
        '#977a6a',
        '#6a766f',
        '#6d524d',
        '#948682',
        '#928787',
    ], // 方案4对应的边框色
    [
        '#bbb250',
        '#62a24f',
        '#b69160',
        '#b57980',
        '#ad8ea2',
        '#ae679b',
        '#489285',
        '#7b6da2',
        '#6f959e',
        '#348196',
    ], // 方案5对应的边框色
];
/**
 * 默认高亮配置
 * 高亮功能的初始默认设置
 */
const DEFAULT_CONFIG = {
    words: [], // 默认高亮词列表为空
    autoExtract: true, // 默认启用自动提取
    colorScheme: 0, // 默认使用第一个颜色方案
    skipShortWords: true, // 默认跳过短词
    sortByLength: true, // 默认按词长排序
    showIndicator: true, // 默认显示指示器
};
/**
 * 获取高亮样式CSS字符串
 * @param colorScheme 颜色方案索引，默认为0
 * @returns 包含所有高亮颜色的CSS样式字符串
 */
function getHighlightStyle(colorScheme = 0) {
    const colors = STYLE_COLORS[colorScheme] || STYLE_COLORS[0];
    const borderColors = BORDER_COLORS[colorScheme] || BORDER_COLORS[0];
    let styles = '';
    // 为每种颜色生成对应的CSS类
    colors.forEach((color, index) => {
        styles += `
            .bread-highlight-color-${index} {
                box-sizing: border-box !important;
                background-color: ${color} !important;
                color: black !important;
                padding: 0 1px !important;
                border-radius: 2px !important;
                border: 1px solid ${borderColors[index]} !important;
            }
        `;
    });
    return styles;
}

// highlightNode.ts
/**
 * 获取指定根节点下所有符合条件的文本节点
 *
 * @param root - 遍历的起始根节点，默认为document.body
 * @param options - 配置选项对象
 * @param options.excludeHidden - 是否排除隐藏元素（默认true）
 * @param options.minContentLength - 文本内容的最小长度要求（默认1）
 * @returns 符合过滤条件的文本节点数组
 *
 * 功能说明：
 * 1. 自动排除预定义的非内容型标签（input/textarea等）
 * 2. 可选过滤隐藏元素（通过CSS计算样式判断）
 * 3. 过滤空白内容及满足最小长度要求的文本
 */
function getTexts(root = document.body, options = {}) {
    // 创建TreeWalker进行节点遍历，配置复合过滤条件
    const walker = getTextWalker(root, options);
    const texts = [];
    let offset = 0;
    let mergedTextBuilder = '';
    // 遍历收集所有符合条件的文本节点
    while (walker.nextNode()) {
        const node = walker.currentNode;
        // console.log('捕获节点:', JSON.stringify(node.textContent));
        const text = node.textContent || '';
        mergedTextBuilder += text.toLowerCase();
        texts.push({
            node,
            start: offset,
            end: offset + text.length,
        });
        offset += text.length;
    }
    return {
        texts,
        mergedText: mergedTextBuilder,
    };
}
/**
 * 高亮显示文档中与指定文本匹配的文本节点
 *
 * @param text - 要高亮的文本
 * @param root - 需要遍历的DOM根节点，默认为document.body。函数会在此节点的子树中查找匹配
 * @param excludeSelection - 是否排除当前选中文本，默认为true
 * @param colorIndex - 颜色索引，默认为0
 * @returns void 本函数不返回任何值
 */
function highlightTextInNode(text, root = document.body, excludeSelection = true, colorIndex = 0) {
    // console.log("highlightTextInNode", root);
    // 仅当存在有效文本时执行高亮
    if (text !== '') {
        // 获取所有文本节点及其合并后的完整文本内容
        const { texts, mergedText } = getTexts(root);
        // 存在有效文本时执行匹配逻辑
        if (texts.length > 0 && text !== '') {
            // 在合并文本中查找所有匹配位置
            const matches = findMatches(mergedText, text);
            // 根据参数决定是否过滤选中文本
            let filteredMatches = matches;
            if (excludeSelection) {
                filteredMatches = matches.filter((m) => !isInSelection(m, texts, window.getSelection()));
            }
            // 调试信息：输出所有匹配项详情
            // console.table(
            //     matches.map((m) => ({
            //         ...m,
            //         text: mergedText.substring(m.start, m.end),
            //     }))
            // );
            // 对过滤后的匹配项应用高亮
            highlightMatches(texts, filteredMatches, colorIndex);
        }
        else {
            return;
        }
    }
}
/**
 * 高亮显示文档中多个关键词
 *
 * @param words - 要高亮的关键词数组（字符串数组或带颜色索引的对象数组）
 * @param root - 需要遍历的DOM根节点，默认为document.body
 * @returns void
 */
function highlightWordsInDocument(words, root = document.body) {
    // 先移除所有现有高亮
    removeHighlights();
    // 对每个关键词进行高亮（不排除选中文本），使用不同的颜色索引
    words.forEach((word, index) => {
        let text;
        let colorIndex;
        if (typeof word === 'string') {
            text = word;
            colorIndex = index % 10; // 使用10种颜色循环
        }
        else {
            text = word.text;
            colorIndex = word.colorIndex;
        }
        if (text && text.trim() !== '') {
            highlightTextInNode(text, root, false, colorIndex);
        }
    });
}
function removeHighlights() {
    // 查找所有高亮元素
    document.querySelectorAll('.bread-highlight').forEach((mark) => {
        // 创建新的文本节点替代高亮元素
        const text = document.createTextNode(mark.textContent || '');
        mark.parentNode?.replaceChild(text, mark);
    });
}
/**
 * 判断匹配项是否在当前选中的文本范围内
 *
 * @param match - 需要检查的匹配范围
 * @param texts - 文本节点位置信息数组
 * @param selection - 当前文档选区对象
 * @returns 如果匹配项在选区内返回true，否则false
 */
function isInSelection(match, texts, selection) {
    if (!selection || selection.rangeCount === 0)
        return false;
    // 获取第一个选区范围（通常只有一个）
    const range = selection.getRangeAt(0);
    const { startContainer, startOffset, endContainer, endOffset } = range;
    // 查找选区起始节点对应的全局偏移
    const findGlobalOffset = (node, offset) => {
        const entry = texts.find((t) => t.node === node);
        return entry ? entry.start + offset : -1;
    };
    // 计算选区全局范围
    const selStart = findGlobalOffset(startContainer, startOffset);
    const selEnd = findGlobalOffset(endContainer, endOffset);
    // 有效性检查
    if (selStart === -1 || selEnd === -1)
        return false;
    // 判断匹配范围是否与选区范围重叠
    return ((match.start >= selStart && match.end <= selEnd) || // 完全包含
        (match.start < selEnd && match.end > selStart) // 部分重叠
    );
}
/**
 * 在目标文本中查找指定子文本的所有匹配范围
 *
 * @param mergedText 被搜索的主文本内容
 * @param selectedText 需要查找的子文本内容
 * @returns 返回包含所有匹配位置信息的数组，每个元素包含匹配的起始(start)和结束(end)索引
 */
function findMatches(mergedText, selectedText) {
    const matches = [];
    // 检查搜索文本有效性：当搜索文本为空时提前返回
    if (!selectedText || selectedText.length === 0) {
        console.warn('Invalid search text');
        return matches;
    }
    let index = 0;
    // 大小写忽略
    const searchText = selectedText.toLowerCase();
    const searchMergedText = mergedText.toLowerCase();
    // 循环查找所有匹配项
    while ((index = searchMergedText.indexOf(searchText, index)) !== -1) {
        // 记录匹配范围（左闭右开区间）
        matches.push({
            start: index,
            end: index + selectedText.length,
        });
        index += selectedText.length; // 跳过已匹配区域继续搜索
    }
    return matches;
}
/**
 * 在文本节点中高亮显示指定的匹配范围
 *
 * @param texts 文本节点条目数组，包含需要处理的文本节点及其位置信息
 * @param matches 需要高亮的匹配范围数组，包含原始文档中的绝对位置信息
 * @returns void
 */
function highlightMatches(texts, matches, colorIndex = 0) {
    // 预处理：将匹配项按起始位置排序
    const sortedMatches = [...matches].sort((a, b) => a.start - b.start);
    texts.forEach((entry) => {
        const node = entry.node;
        if (!node || !node.textContent)
            return;
        const nodeContent = node.textContent || '';
        const entryStart = entry.start;
        const entryEnd = entry.end;
        const nodeLength = nodeContent.length;
        // 找出所有与当前文本节点相关的匹配范围
        const relevantMatches = sortedMatches.filter((match) => match.start < entryEnd && match.end > entryStart);
        // 转换为相对于当前节点的局部范围
        const localRanges = relevantMatches.map((match) => ({
            start: Math.max(0, match.start - entryStart),
            end: Math.min(nodeLength, match.end - entryStart),
        }));
        // 合并重叠/相邻的范围
        const mergedRanges = mergeRanges(localRanges);
        if (mergedRanges.length === 0)
            return;
        // 按起始位置降序处理，避免分割影响索引
        mergedRanges
            .sort((a, b) => b.start - a.start)
            .forEach((range) => {
            const { start, end } = range;
            // console.log(
            //     `高亮范围: [${start}-${end}] "${nodeContent.slice(
            //         start,
            //         end
            //     )}"`
            // );
            // 分割
            const pre = node.splitText(start);
            const highlighted = pre.splitText(end - start);
            const span = createMarkElement(colorIndex);
            span.appendChild(pre.cloneNode(true));
            node.parentNode?.replaceChild(span, pre);
            if (highlighted.textContent) {
                span.after(highlighted);
            }
        });
    });
}
/**
 * 合并重叠或相邻的范围区间，返回新的有序范围数组
 *
 * 实现原理：
 * 1. 先对范围按起始位置排序
 * 2. 依次合并相邻的重叠范围
 *
 * @param ranges - 需要合并的范围数组，每个范围应包含 start 和 end 属性
 *                 (示例: [{start:1,end:3}, {start:2,end:5}])
 * @returns 合并后的新范围数组，按起始位置升序排列且无重叠
 *          (示例输入返回: [{start:1,end:5}])
 */
function mergeRanges(ranges) {
    // 处理空输入特殊情况
    if (ranges.length === 0)
        return [];
    // 创建排序副本以保持原始数据不变，按起始位置升序排列
    const sorted = [...ranges].sort((a, b) => a.start - b.start);
    const merged = [sorted[0]];
    // 遍历处理每个范围，合并重叠/相邻的区间
    for (let i = 1; i < sorted.length; i++) {
        const last = merged[merged.length - 1];
        const current = sorted[i];
        // 当当前区间与最后合并区间重叠时，扩展合并区间的结束位置
        if (current.start <= last.end) {
            last.end = Math.max(last.end, current.end);
        }
        else {
            // 非重叠区间直接添加到结果集
            merged.push(current);
        }
    }
    return merged;
}
/**
 * 创建一个带有高亮样式的span元素
 *
 * 该函数用于创建一个新的span元素，并为其设置特定的样式和类名
 * 以便在页面中高亮显示文本
 *
 * @returns 返回一个带有高亮样式的span元素
 */
function createMarkElement(colorIndex = 0) {
    const span = document.createElement('mark');
    span.className = `bread-highlight bread-highlight-color-${colorIndex}`;
    return span;
}

/**
 * 高亮词管理器
 * 统一管理所有要高亮的词，包括持久高亮和搜索关键词
 */
class WordsManager {
    persistentWords = [];
    searchWords = [];
    callbacks = [];
    /**
     * 更新持久高亮词
     */
    updatePersistentWords(words) {
        this.persistentWords = words.map((word, index) => ({
            text: word,
            colorIndex: index % 5,
            enabled: true,
            caseSensitive: false,
            regex: false,
            source: 'persistent',
        }));
        this.notifyCallbacks();
    }
    /**
     * 更新搜索关键词
     */
    updateSearchWords(words) {
        this.searchWords = words.map((word, index) => ({
            text: word,
            colorIndex: (index % 5) + 5,
            enabled: true,
            caseSensitive: false,
            regex: false,
            source: 'search',
        }));
        this.notifyCallbacks();
    }
    /**
     * 添加高亮词
     */
    addWords(words) {
        for (const newWord of words) {
            // 检查是否已存在
            const existingWord = this.getAllWords().find((w) => w.text === newWord.text);
            if (!existingWord) {
                // 添加到持久高亮词
                this.persistentWords.push({
                    ...newWord,
                    source: 'persistent',
                });
            }
        }
        this.notifyCallbacks();
    }
    /**
     * 移除高亮词
     */
    removeWord(text) {
        this.persistentWords = this.persistentWords.filter((w) => w.text !== text);
        this.notifyCallbacks();
    }
    /**
     * 切换高亮词状态
     */
    toggleWord(text, enabled) {
        const word = this.getAllWords().find((w) => w.text === text);
        if (word) {
            word.enabled =
                enabled !== undefined ? enabled : !word.enabled;
            this.notifyCallbacks();
        }
    }
    /**
     * 更新高亮词
     */
    updateWord(word) {
        const index = this.persistentWords.findIndex((w) => w.text === word.text);
        if (index >= 0) {
            this.persistentWords[index] = word;
            this.notifyCallbacks();
        }
    }
    /**
     * 获取所有要高亮的词
     */
    getAllWords() {
        return [...this.persistentWords, ...this.searchWords];
    }
    /**
     * 获取启用的高亮词
     */
    getEnabledWords() {
        return this.getAllWords()
            .filter((word) => word.enabled)
            .map((word) => word.text);
    }
    /**
     * 获取高亮词统计
     */
    getWordStats(text) {
        const word = this.getAllWords().find((w) => w.text === text);
        if (word) {
            return {
                count: 1, // 简化计数
                word,
            };
        }
        return null;
    }
    /**
     * 获取所有高亮词统计
     */
    getAllStats() {
        const stats = {};
        for (const word of this.getAllWords()) {
            if (word.enabled) {
                stats[word.text] = {
                    count: 1, // 简化计数
                    word,
                };
            }
        }
        return stats;
    }
    /**
     * 注册词更新回调
     */
    onWordsUpdate(callback) {
        this.callbacks.push(callback);
    }
    /**
     * 取消注册词更新回调
     */
    offWordsUpdate(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }
    /**
     * 通知所有回调
     */
    notifyCallbacks() {
        const words = this.getAllWords();
        this.callbacks.forEach((callback) => {
            try {
                callback(words);
            }
            catch (error) {
                console.error('Words update callback error:', error);
            }
        });
    }
}
// 单例模式
let globalWordsManager = null;
function getWordsManager() {
    if (!globalWordsManager) {
        globalWordsManager = new WordsManager();
    }
    return globalWordsManager;
}

class HighlightManager {
    extractor;
    config;
    isActive = false;
    styleElement = null;
    wordsManager = getWordsManager();
    constructor() {
        this.config = { ...DEFAULT_CONFIG };
        this.extractor = new KeywordExtractor();
        // 确保样式在初始化时就被注入
        this.injectStyles();
        this.loadConfig();
        // 注册词更新回调
        this.wordsManager.onWordsUpdate(() => {
            if (this.isActive) {
                this.highlightAll();
            }
        });
    }
    async loadConfig() {
        try {
            const saved = await storage.getItem(getKeyWithDomain('highlight_config'));
            if (saved) {
                this.config = { ...DEFAULT_CONFIG, ...saved };
                this.injectStyles();
            }
        }
        catch (error) {
            console.warn('Failed to load highlight config:', error);
        }
    }
    async saveConfig() {
        try {
            await storage.setItem(getKeyWithDomain('highlight_config'), this.config);
        }
        catch (error) {
            console.warn('Failed to save highlight config:', error);
        }
    }
    async autoExtractAndHighlight() {
        if (!this.config.autoExtract)
            return;
        const sources = this.extractor.extractKeywords();
        console.log('Extracted keywords:', sources);
        if (sources.length === 0)
            return;
        const bestSource = sources[0];
        const newWords = bestSource.keywords.map((keyword, index) => ({
            text: keyword,
            enabled: true,
            colorIndex: index % 10,
            caseSensitive: false,
            regex: false,
            source: 'persistent',
        }));
        this.wordsManager.addWords(newWords);
        this.extractor.setWindowKeywords(bestSource.keywords);
    }
    highlightAll() {
        if (!this.isActive) {
            console.log('高亮功能未激活，跳过highlightAll');
            return;
        }
        // 获取启用的高亮词
        const enabledWords = this.wordsManager.getEnabledWords();
        console.group('高亮管理器 - highlightAll');
        console.log(`启用的关键词: ${enabledWords.join(', ')}`);
        console.log(`关键词数量: ${enabledWords.length}`);
        // 使用highlightNode.ts的高亮方案
        highlightWordsInDocument(enabledWords);
        console.log('高亮应用完成');
        console.groupEnd();
        return new Map(); // 为了保持接口兼容性，返回空Map
    }
    getWordStats(text) {
        return (this.wordsManager.getWordStats(text) || {
            count: 1,
            word: this.wordsManager
                .getAllWords()
                .find((w) => w.text === text),
        });
    }
    getAllStats() {
        return this.wordsManager.getAllStats();
    }
    start() {
        console.group('高亮管理器 - start');
        console.log('激活高亮功能');
        this.isActive = true;
        this.highlightAll();
        // 开始观察DOM变化，以便在动态内容加载时重新应用高亮
        manageMutationObserver(true);
        console.log('已启动DOM观察器');
        console.groupEnd();
    }
    stop() {
        console.group('高亮管理器 - stop');
        console.log('停用高亮功能');
        this.isActive = false;
        removeHighlights();
        // 停止观察DOM变化
        manageMutationObserver(false);
        console.log('已停止DOM观察器');
        console.groupEnd();
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.injectStyles();
        this.saveConfig();
        if (this.isActive) {
            this.highlightAll();
        }
    }
    getConfig() {
        return { ...this.config };
    }
    getWords() {
        return this.wordsManager.getAllWords();
    }
    isEnabled() {
        return this.isActive;
    }
    destroy() {
        this.stop();
        this.removeStyles();
        this.wordsManager.offWordsUpdate(() => {
            if (this.isActive) {
                this.highlightAll();
            }
        });
    }
    /**
     * 注入高亮样式到页面
     */
    injectStyles() {
        // 移除已存在的样式元素
        this.removeStyles();
        // 创建新的样式元素
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'bread-highlight-styles';
        this.styleElement.textContent =
            getHighlightStyle(this.config.colorScheme) +
                `
            .bread-highlight {
                display: inline !important;
                margin: 0 !important;
                padding: 0 1px !important;
                font: inherit !important;
                color: black !important;
                text-decoration: none !important;
            }
        `;
        // 确保样式正确注入到文档中
        try {
            if (document.head) {
                document.head.appendChild(this.styleElement);
                document.documentElement.appendChild(this.styleElement);
            }
            console.log('Highlighter styles injected successfully');
        }
        catch (error) {
            console.error('Failed to inject highlighter styles:', error);
        }
    }
    /**
     * 移除样式元素
     */
    removeStyles() {
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }
    }
}
let globalHighlightManager = null;
function getHighlightManager() {
    if (!globalHighlightManager) {
        globalHighlightManager = new HighlightManager();
    }
    return globalHighlightManager;
}

/**
 * 通用链接处理工具
 *
 * 提供链接处理的通用功能，包括排除选择器、DOM监听等
 */
// 排除的链接选择器（避免在某些元素上应用样式）
const EXCLUDED_LINK_SELECTORS = [
    '.bread-exclude', // 手动排除的链接
    '[data-bread-exclude]', // 数据属性排除
    '.bread-translation-container a', // 翻译容器内的链接
    '.bread-highlight a', // 高亮文本内的链接
    'nav a', // 导航链接
    'header a', // 头部链接
    'footer a', // 底部链接
    '.menu a', // 菜单链接
    '.navbar a', // 导航栏链接
    '.pagination a', // 分页链接
    '.breadcrumb a', // 面包屑链接
].join(',');
/**
 * 检查链接是否应该被排除
 */
function shouldExcludeLink(link, customExcludedSelectors = []) {
    // 检查基础排除选择器
    for (const selector of EXCLUDED_LINK_SELECTORS.split(',')) {
        if (link.matches(selector.trim())) {
            return true;
        }
    }
    // 检查自定义排除选择器
    for (const selector of customExcludedSelectors) {
        if (link.matches(selector.trim())) {
            return true;
        }
    }
    return false;
}
/**
 * 处理页面中的所有链接
 */
function processAllLinks$1(applyStyle, processedLinks) {
    const links = document.querySelectorAll('a');
    links.forEach((link) => {
        if (link instanceof HTMLAnchorElement) {
            applyStyle(link);
        }
    });
}
/**
 * 移除所有链接的样式
 */
function removeAllLinkStyles(removeStyle) {
    const links = document.querySelectorAll('a');
    for (const link of links) {
        if (link instanceof HTMLAnchorElement) {
            removeStyle(link);
        }
    }
}
/**
 * 启用/禁用链接样式功能
 */
function setLinkStyleEnabled(enabled, applyStyle, removeStyle) {
    if (!enabled) {
        // 禁用时移除所有样式
        removeAllLinkStyles(removeStyle);
    }
    else {
        // 启用时重新应用样式
        processAllLinks$1(applyStyle);
    }
}

/**
 * 链接目标样式管理器
 *
 * 根据a标签的target属性区分链接打开方式，并提供不同样式
 */
// 链接目标类型枚举
var LinkTargetType;
(function (LinkTargetType) {
    LinkTargetType["NEW_TAB"] = "new-tab";
    LinkTargetType["SAME_TAB"] = "same-tab";
    LinkTargetType["DEFAULT"] = "default";
})(LinkTargetType || (LinkTargetType = {}));
/**
 * 获取链接的目标类型
 */
function getLinkTargetType(link) {
    const target = link.target?.toLowerCase();
    if (target === '_blank') {
        return LinkTargetType.NEW_TAB;
    }
    if (target === '_self' || target === '_parent' || target === '_top') {
        return LinkTargetType.SAME_TAB;
    }
    return LinkTargetType.DEFAULT;
}
/**
 * 检查链接是否应该被排除
 */
function shouldExcludeLinkTarget(link) {
    // 检查基础排除选择器
    if (shouldExcludeLink(link)) {
        return true;
    }
    // 检查是否已经有样式类 - 优化：使用更快的检查方式
    const classList = link.classList;
    if (classList.contains('bread-link-target-new-tab') ||
        classList.contains('bread-link-target-same-tab') ||
        classList.contains('bread-link-target-default')) {
        return true;
    }
    return false;
}
/**
 * 为链接应用目标样式
 */
function applyLinkTargetStyle(link) {
    if (shouldExcludeLinkTarget(link)) {
        return;
    }
    const targetType = getLinkTargetType(link);
    const classList = link.classList;
    // 优化：只在需要时修改DOM
    const expectedClass = `bread-link-target-${targetType}`;
    // 检查当前是否已经是正确的样式类
    if (classList.contains(expectedClass)) {
        return; // 已经是正确的样式，无需修改
    }
    // 批量移除所有可能的目标样式类
    classList.remove('bread-link-target-new-tab', 'bread-link-target-same-tab', 'bread-link-target-default');
    // 添加对应的样式类
    classList.add(expectedClass);
}
/**
 * 移除链接的目标样式
 */
function removeLinkTargetStyle(link) {
    link.classList.remove('bread-link-target-new-tab', 'bread-link-target-same-tab', 'bread-link-target-default');
}
/**
 * 初始化链接目标样式管理器
 * 现在使用全局的domMutationObserver，返回空清理函数
 */
function initLinkTargetManager() {
    // 处理现有链接
    processAllLinks(applyLinkTargetStyle);
    // 返回空清理函数，因为清理由全局domMutationObserver处理
    return () => {
        // 清理逻辑由全局domMutationObserver处理
    };
}
/**
 * 手动为单个链接应用样式
 */
function applyStyleToLink(link) {
    applyLinkTargetStyle(link);
}
/**
 * 处理页面中的所有链接
 */
function processAllLinks(applyStyle) {
    const links = document.querySelectorAll('a');
    links.forEach((link) => {
        if (link instanceof HTMLAnchorElement) {
            applyStyle(link);
        }
    });
}
/**
 * 启用/禁用链接目标样式功能
 */
function setLinkTargetEnabled(enabled) {
    setLinkStyleEnabled(enabled, applyLinkTargetStyle, removeLinkTargetStyle);
}

/**
 * 管理DOM变更观察器的启动和停止
 */
function manageMutationObserver(shouldObserve) {
    if (shouldObserve) {
        domMutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['target'],
        });
    }
    else {
        domMutationObserver.disconnect();
    }
}
/**
 * DOM变更观察器核心回调函数
 *
 *
 * 这是整个DOM观察系统的核心，负责处理所有DOM结构变化事件
 *
 * 核心处理步骤：
 * 1. 收集所有需要处理的新增节点 - 过滤和分类新增的DOM元素
 * 2. 处理移除节点：清理相关资源 - 防止内存泄漏和无效观察
 * 3. 统一处理新增节点的功能应用 - 根据设置应用翻译、仿生阅读等功能
 * 4. 延迟重新应用高亮避免循环触发 - 使用防抖机制确保DOM稳定
 */
const domMutationObserver = new MutationObserver((mutations) => {
    console.group('DOM Mutation Observer');
    console.log(`检测到 ${mutations.length} 个DOM变更`);
    // 处理属性变化（链接目标样式）
    processAttributeChanges(mutations);
    // 使用Set避免重复处理同一个元素
    const newElementsSet = new Set();
    let skippedElements = 0;
    // 优化：批量处理mutation记录，减少循环嵌套
    mutations.forEach((mutation) => {
        console.log(`Mutation: ${mutation.type}`, mutation.target);
        // 优化：使用更高效的新增节点处理
        skippedElements += processAddedNodes(mutation.addedNodes, newElementsSet);
        // 处理移除节点 - 清理资源，防止内存泄漏
        mutation.removedNodes.forEach((node) => {
            console.log(`移除节点: ${node.nodeName}`);
            handleRemovedNode(node);
        });
        // 优化：减少不必要的子树更新检查
        if (mutation.type === 'childList' &&
            parentToTextNodesMap.size > 0) {
            updateAffectedTextNodes(mutation.target);
        }
    });
    const newElements = Array.from(newElementsSet);
    console.log(`统计: ${newElements.length} 个新元素, ${skippedElements} 个跳过元素`);
    // 处理新增元素的功能应用 - 核心业务逻辑
    if (newElements.length > 0) {
        console.log('开始处理新元素功能');
        processNewElements(newElements);
        // 如果高亮功能已启用，延迟重新应用高亮
        const highlightManager = getHighlightManager();
        if (highlightManager.isEnabled()) {
            console.log('调度高亮更新');
            scheduleHighlightUpdate(highlightManager);
        }
    }
    console.groupEnd();
});
/**
 * 优化：专门处理新增节点，提高代码可读性和性能
 * @returns 跳过的元素数量
 */
function processAddedNodes(addedNodes, newElementsSet) {
    let skippedCount = 0;
    for (let i = 0; i < addedNodes.length; i++) {
        const node = addedNodes[i];
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            if (isInternalExtensionElement(element)) {
                console.log(`跳过内部元素: ${element.tagName}.${Array.from(element.classList).join('.')}`);
                skippedCount++;
                continue;
            }
            console.log(`新增元素: ${element.tagName}`, element);
            newElementsSet.add(element);
        }
    }
    return skippedCount;
}
function isInternalExtensionElement(element) {
    // 使用类名快速检测，避免多次classList.contains调用
    const classList = element.classList;
    return (classList?.contains('translation-result') ||
        classList?.contains('bread-highlight'));
}
/**
 * 优化：只更新受影响的文本节点映射
 */
function updateAffectedTextNodes(target) {
    if (target.nodeType === Node.ELEMENT_NODE) {
        const element = target;
        // 只有当目标元素在映射中时才更新
        if (parentToTextNodesMap.has(element)) {
            updateTextNodesMap(element);
        }
    }
}
/**
 * 处理新增元素中的链接目标样式
 * TODO: 移动到linkTarget模块中
 */
function processLinkTargetElements(elements) {
    for (const element of elements) {
        // 检查元素本身是否为链接
        if (element instanceof HTMLAnchorElement) {
            applyStyleToLink(element);
        }
        // 检查元素内的所有链接
        const links = element.querySelectorAll('a');
        for (const link of links) {
            if (link instanceof HTMLAnchorElement) {
                applyStyleToLink(link);
            }
        }
    }
}
/**
 * 处理属性变化（target属性）
 * TODO: 移动到linkTarget模块中
 */
function processAttributeChanges(mutations) {
    for (const mutation of mutations) {
        if (mutation.type === 'attributes' &&
            mutation.attributeName === 'target' &&
            mutation.target instanceof HTMLAnchorElement) {
            applyStyleToLink(mutation.target);
        }
    }
}
/**
 * 处理新增元素的功能应用
 */
function processNewElements(elements) {
    const translateEnabled = getSetting().translate;
    const bionicEnabled = getSetting().bionic;
    console.log(`功能设置: 翻译=${translateEnabled}, 仿生=${bionicEnabled}`);
    // 处理链接目标样式
    processLinkTargetElements(elements);
    for (const element of elements) {
        if (translateEnabled) {
            console.log(`应用翻译到: ${element.tagName}`);
            observeTranslateElements(element);
        }
        if (bionicEnabled) {
            console.log(`应用仿生到: ${element.tagName}`);
            observeElementNode(element);
        }
    }
    console.log(`完成处理 ${elements.length} 个元素`);
}
/**
 * 更新文本节点映射
 */
function updateTextNodesMap(element) {
    if (parentToTextNodesMap.has(element)) {
        const texts = getTextNodes(element);
        const textsSet = new Set(texts);
        parentToTextNodesMap.set(element, textsSet);
    }
}
/**
 * 延迟重新应用高亮
 */
function scheduleHighlightUpdate(highlightManager) {
    // 使用防抖避免频繁重绘，并暂时关闭观察器避免循环触发
    window.setTimeout(() => {
        domMutationObserver.disconnect();
        highlightManager.highlightAll();
        // 重新开启观察器
        domMutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }, 300);
}
/**
 * 处理DOM节点移除事件
 * @param node - 被移除的DOM节点
 * @remarks
 * 处理逻辑分两种情况：
 * 1. 元素节点：清理文本节点映射和观察器
 * 2. 文本节点：从父元素映射中删除
 * 优先级：先处理元素节点再处理文本节点
 */
function handleRemovedNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        parentToTextNodesMap.delete(element);
        bionicTextObserver.unobserve(element);
    }
    else if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node;
        const parent = textNode.parentElement;
        if (parent) {
            const texts = parentToTextNodesMap.get(parent);
            if (texts) {
                // 直接尝试删除文本节点
                if (texts.delete(textNode) &&
                    texts.size === 0) {
                    parentToTextNodesMap.delete(parent);
                    bionicTextObserver.unobserve(parent);
                }
            }
        }
    }
}

/**
 * 仿生阅读功能
 */
class BionicFeature extends Feature {
    name = 'bionic';
    default = false;
    isActive = false;
    async init() {
        // 特殊处理：bionic的DOM加载逻辑
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.on();
                console.log('DOM 就绪时执行');
            });
        }
        else {
            window.requestIdleCallback(() => {
                this.on();
                console.log('延迟到窗口加载完成');
            });
        }
    }
    async on() {
        if (this.isActive)
            return;
        initializeSingleUseObserver();
        manageMutationObserver(true);
        this.isActive = true;
    }
    async off() {
        if (!this.isActive)
            return;
        manageMutationObserver(false);
        bionicTextObserver.disconnect();
        parentToTextNodesMap.clear();
        removeBionicEffects();
        this.isActive = false;
    }
}

/**
 * 高亮执行器
 * 负责实际的高亮操作，不管理词的状态
 */
class Highlighter {
    isActive = false;
    /**
     * 启动高亮器
     */
    start() {
        if (this.isActive)
            return;
        this.isActive = true;
        console.log('🚀 启动高亮器');
        // 监听词管理器变化
        const wordsManager = getWordsManager();
        wordsManager.onWordsUpdate(this.handleWordsUpdate.bind(this));
        // 初始高亮一次
        this.highlightCurrentWords();
    }
    /**
     * 停止高亮器
     */
    stop() {
        if (!this.isActive)
            return;
        this.isActive = false;
        console.log('⏹️ 停止高亮器');
        // 取消监听
        const wordsManager = getWordsManager();
        wordsManager.offWordsUpdate(this.handleWordsUpdate.bind(this));
        // 移除所有高亮
        removeHighlights();
    }
    /**
     * 处理词更新
     */
    handleWordsUpdate(words) {
        if (!this.isActive)
            return;
        console.log('🔄 检测到词更新，重新应用高亮');
        this.highlightWords(words);
    }
    /**
     * 高亮指定词
     */
    highlightWords(words) {
        if (words.length === 0) {
            removeHighlights();
            return;
        }
        console.log(`🎨 开始高亮 ${words.length} 个词`);
        highlightWordsInDocument(words);
    }
    /**
     * 高亮当前词
     */
    highlightCurrentWords() {
        const wordsManager = getWordsManager();
        const words = wordsManager.getAllWords();
        this.highlightWords(words);
    }
    /**
     * 检查是否激活
     */
    isEnabled() {
        return this.isActive;
    }
}
// 单例模式
let globalHighlighter = null;
function getHighlighter() {
    if (!globalHighlighter) {
        globalHighlighter = new Highlighter();
    }
    return globalHighlighter;
}

/**
 * 搜索关键词自动更新模块
 * 函数式实现，监听URL变化并自动更新搜索关键词高亮
 */
// 状态变量
let isActive = false;
let lastUrl = '';
let urlObserver = null;
/**
 * 启动搜索关键词自动更新
 */
function startSearchKeywordAutoUpdate() {
    if (isActive)
        return;
    isActive = true;
    lastUrl = window.location.href;
    console.log('启动搜索关键词自动更新');
    setupUrlChangeListeners();
    updateSearchKeywords();
}
/**
 * 设置URL变化监听器
 */
function setupUrlChangeListeners() {
    // 监听URL变化
    urlObserver = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            console.log('🔄 检测到URL变化，检查是否需要更新搜索关键词高亮');
            updateSearchKeywords();
        }
    });
    // 监听popstate事件（浏览器前进/后退）
    window.addEventListener('popstate', handlePopState);
    // 监听hashchange事件（URL hash变化）
    window.addEventListener('hashchange', handleHashChange);
    // 开始观察DOM变化
    urlObserver.observe(document, { subtree: true, childList: true });
}
/**
 * 处理popstate事件
 */
function handlePopState() {
    console.log('🔄 检测到popstate事件，检查是否需要更新搜索关键词高亮');
    updateSearchKeywords();
}
/**
 * 处理hashchange事件
 */
function handleHashChange() {
    console.log('🔄 检测到hashchange事件，检查是否需要更新搜索关键词高亮');
    updateSearchKeywords();
}
/**
 * 更新搜索关键词高亮
 */
function updateSearchKeywords() {
    const extractor = new KeywordExtractor();
    // 检查当前页面是否是搜索引擎页面
    const sources = extractor.extractKeywords();
    const searchEngineSource = sources.find((source) => source.type === 'search_engine');
    if (searchEngineSource && searchEngineSource.keywords.length > 0) {
        console.log('🔍 检测到搜索引擎页面，自动更新搜索关键词:', searchEngineSource.keywords);
        // 更新到wordsManager
        const wordsManager = getWordsManager();
        wordsManager.updateSearchWords(searchEngineSource.keywords);
    }
    else {
        // 如果没有搜索关键词，清空搜索词
        const wordsManager = getWordsManager();
        wordsManager.updateSearchWords([]);
    }
}

/**
 * 高亮功能初始化模块
 * 负责高亮功能的初始化和消息处理
 */
/**
 * 初始化高亮系统
 */
function initializeHighlightSystem() {
    console.log('🚀 初始化高亮系统');
    // 启动高亮器
    const highlighter = getHighlighter();
    highlighter.start();
    // 启动搜索关键词自动更新
    startSearchKeywordAutoUpdate();
    // 页面加载时应用持久高亮
    applyPersistentHighlightOnLoad();
    // 设置消息监听
    setupMessageListeners();
    // 设置storage变化监听
    setupStorageListeners();
}
/**
 * 设置消息监听
 */
function setupMessageListeners() {
    // 监听来自popup的消息
    browser.runtime.onMessage.addListener((message, _, sendResponse) => {
        console.group('📨 高亮系统收到消息');
        console.log('消息内容:', message);
        switch (message.action) {
            case 'highlightWords':
                console.log('🎨 开始高亮关键词:', message.words);
                handleHighlightWords(message.words);
                sendResponse({
                    success: true,
                    words: message.words,
                });
                break;
            case 'removeHighlight':
                console.log('🗑️ 移除所有高亮');
                handleRemoveHighlight();
                sendResponse({ success: true });
                break;
            default:
                console.log('❓ 未知消息类型:', message.action);
                sendResponse({
                    success: false,
                    error: 'Unknown action',
                });
        }
        console.groupEnd();
        return true; // 保持消息通道开放以支持异步响应
    });
}
/**
 * 设置storage变化监听
 */
function setupStorageListeners() {
    // 监听storage变化，当持久高亮关键词改变时自动更新
    browser.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.persistent_highlight_keywords) {
            console.log('🔄 检测到持久高亮关键词变化，更新高亮词');
            const newKeywords = changes.persistent_highlight_keywords.newValue;
            handlePersistentKeywordsChange(newKeywords);
        }
    });
}
/**
 * 处理高亮词消息
 */
function handleHighlightWords(words) {
    const wordsManager = getWordsManager();
    wordsManager.updatePersistentWords(words);
}
/**
 * 处理移除高亮消息
 */
function handleRemoveHighlight() {
    const wordsManager = getWordsManager();
    wordsManager.updatePersistentWords([]);
}
/**
 * 处理持久高亮关键词变化
 */
function handlePersistentKeywordsChange(newKeywords) {
    const wordsManager = getWordsManager();
    if (newKeywords && newKeywords.trim()) {
        const keywords = newKeywords
            .split('\n')
            .map((word) => word.trim())
            .filter((word) => word.length > 0);
        wordsManager.updatePersistentWords(keywords);
    }
    else {
        wordsManager.updatePersistentWords([]);
    }
}
/**
 * 页面加载时应用持久高亮
 */
async function applyPersistentHighlightOnLoad() {
    try {
        const persistentKeywords = await storage.getItem('local:persistent_highlight_keywords');
        if (persistentKeywords && persistentKeywords.trim()) {
            console.log('页面加载时自动应用持久高亮');
            const keywords = persistentKeywords
                .split('\n')
                .map((word) => word.trim())
                .filter((word) => word.length > 0);
            const wordsManager = getWordsManager();
            wordsManager.updatePersistentWords(keywords);
        }
    }
    catch (error) {
        console.warn('页面加载时应用持久高亮失败:', error);
    }
}

/**
 * 高亮功能
 */
class HighlightFeature extends Feature {
    name = 'highlight';
    get default() {
        return isSearchEnginePage();
    }
    manager = getHighlightManager();
    async init() {
        // 初始化高亮系统
        initializeHighlightSystem();
    }
    async on() {
        if (this.manager.isEnabled())
            return;
        await this.manager.autoExtractAndHighlight();
        this.manager.start();
    }
    async off() {
        if (!this.manager.isEnabled())
            return;
        this.manager.stop();
    }
}

/**
 * 条纹背景功能
 */
class StripeFeature extends Feature {
    name = 'stripe';
    default = false;
    async on() {
        initStripe();
    }
    async off() {
        // stripe无明确关闭函数，留空
    }
}

/**
 * 链接目标样式功能
 */
class LinkTargetFeature extends Feature {
    name = 'linkTarget';
    default = true;
    cleanupFunction = null;
    async init() {
        // 检查功能是否启用
        const enabled = await this.isLinkTargetFeatureEnabled();
        if (enabled) {
            this.cleanupFunction = initLinkTargetManager();
        }
    }
    async on() {
        // 保存设置
        await this.setLinkTargetFeatureEnabled(true);
        // 启用功能
        setLinkTargetEnabled(true);
        // 如果还没有初始化，则初始化
        if (!this.cleanupFunction) {
            this.cleanupFunction = initLinkTargetManager();
        }
    }
    async off() {
        // 保存设置
        await this.setLinkTargetFeatureEnabled(false);
        // 禁用功能
        setLinkTargetEnabled(false);
        // 执行清理
        if (this.cleanupFunction) {
            this.cleanupFunction();
            this.cleanupFunction = null;
        }
    }
    // 以下是从 linkTargetManager.ts 迁移的函数
    async isLinkTargetFeatureEnabled() {
        try {
            const enabled = await storage.getItem('local:linkTarget');
            return enabled !== null ? enabled : false; // 默认禁用
        }
        catch (error) {
            console.warn('Failed to read link target setting:', error);
            return false;
        }
    }
    async setLinkTargetFeatureEnabled(enabled) {
        try {
            await storage.setItem('local:linkTarget', enabled);
        }
        catch (error) {
            console.error('Failed to save link target setting:', error);
        }
    }
    async getLinkTargetStatus() {
        return await this.isLinkTargetFeatureEnabled();
    }
    async toggleLinkTarget() {
        const currentStatus = await this.getLinkTargetStatus();
        const newStatus = !currentStatus;
        if (newStatus) {
            await this.on();
        }
        else {
            await this.off();
        }
        return newStatus;
    }
    cleanup() {
        if (this.cleanupFunction) {
            this.cleanupFunction();
            this.cleanupFunction = null;
        }
    }
}

const setting = {
    highlight: { value: false, isDefault: true },
    stripe: { value: false, isDefault: true },
    translate: { value: false, isDefault: true },
    bionic: { value: false, isDefault: true },
    linkTarget: { value: false, isDefault: true },
};
// 导出只读的 setting 副本
function getSetting() {
    const result = {};
    Object.keys(setting).forEach((key) => {
        result[key] = setting[key].value;
    });
    return result;
}
// 创建功能实例
const featureInstances = {
    bionic: new BionicFeature(),
    highlight: new HighlightFeature(),
    translate: new TranslateFeature(),
    stripe: new StripeFeature(),
    linkTarget: new LinkTargetFeature(),
};
// 通用初始化函数
async function initFeature(key) {
    const feature = featureInstances[key];
    if (!feature)
        return;
    try {
        const domainKey = getKeyWithDomain(key); // 生成域名键
        const value = await storage.getItem(domainKey);
        await switchFeature(key, value !== null ? value : feature.default);
    }
    catch (err) {
        console.error(`初始化${key}失败`, err);
    }
}
/**
 * 切换指定功能键的特性状态。
 * @param key - 功能键标识符
 * @param newValue - 新的布尔值或null，若为null则使用默认值
 * @param isDefault - 是否为默认值
 * @returns void
 */
async function switchFeature(key, newValue, isDefault = false) {
    const feature = featureInstances[key];
    if (!feature)
        return;
    // 处理默认值逻辑
    if (newValue === null) {
        newValue = feature.default;
        isDefault = true;
    }
    // 执行特性开关回调
    if (newValue) {
        await feature.on();
    }
    else {
        await feature.off();
    }
    // 更新设置状态
    setting[key] = {
        value: newValue,
        isDefault: isDefault,
    };
}
/**
 * 初始化设置管理器，负责同步配置并监听功能开关变化
 * @remarks
 * 该函数会执行以下操作：
 * 1. 同步全局设置
 * 2. 初始化所有功能模块
 * 3. 建立功能配置项的实时监听机制
 */
function initSettingManager() {
    /**
     * 同步全局设置到本地存储
     */
    syncSettings();
    /**
     * 并行初始化所有功能模块
     * 使用 Promise.all 提高初始化效率
     */
    Object.keys(featureInstances).map((key) => initFeature(key).catch((err) => console.error(`初始化${key}失败`, err)));
    /**
     * 为每个功能项建立存储变更监听器
     * @param key - 功能配置项唯一标识
     * @returns void
     * @internal
     * 使用带域名前缀的存储键进行监听，变化时调用switchFeature处理
     */
    Object.keys(featureInstances).forEach((key) => {
        storage.watch(getKeyWithDomain(key), async (newValue) => {
            try {
                await switchFeature(key, newValue);
            }
            catch (err) {
                console.error(`更新${key}失败`, err);
            }
        });
    });
    initShortcuts();
}
function initShortcuts() {
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'q') {
            switchFeature('translate', !getSetting()['translate']);
        }
    });
}
/**
 * 从存储中同步功能配置设置到全局setting对象
 * 优先读取域名专属配置，降级使用全局配置，最终回退到默认值
 *
 * @returns {Promise<void>} 无返回值，但会修改全局setting对象
 */
async function syncSettings() {
    const keys = Object.keys(featureInstances);
    for (const key of keys) {
        const feature = featureInstances[key];
        const domainKey = getKeyWithDomain(key);
        let value = await storage.getItem(domainKey);
        let isDefault = false;
        if (value === null) {
            value = await storage.getItem(`local:${key}`);
            if (value === null) {
                value = feature.default;
                isDefault = true;
            }
        }
        setting[key] = {
            value: value,
            isDefault: isDefault,
        };
    }
}

async function initFunctions() {
    const stripeEnabled = await storage.getItem('local:stripe');
    if (stripeEnabled) {
        initStripe();
    }
    initSettingManager();
}

// import anchorLay from './anchorLayout.vue'
function pin() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnchorApp);
    }
    else {
        // 如果已经加载完成，直接执行
        initAnchorApp();
    }
}
function initAnchorApp() {
    const target = document.querySelector('body');
    if (target) {
        const container = document.createElement('div');
        container.classList.add('anchor-container', 'no-translate');
        manageMutationObserver(false);
        target.appendChild(container);
        // createApp(anchorLay, {
        //         textToAnchor: getAnchorsInfo(),
        // }).mount(container)
        manageMutationObserver(true);
        console.log('挂载完成');
    }
}

// 移除wxt的defineContentScript，改为直接执行
console.log('-'.repeat(20));
console.log('content script loaded');
// 初始化函数
initFunctions()
    .then(() => {
    pin();
})
    .catch((error) => {
    console.error('Failed to initialize content script:', error);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC91dGlscy9kb20vdGV4dE5vZGVzLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC9mZWF0dXJlL3N0cmlwZS9zdHJpcGUudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50L3V0aWxzL3N0b3JhZ2Uvc3RvcmFnZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS9iaW9uaWMvYmlvbmljTm9kZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvb2JzZXJ2ZXIvaW50ZXJzZWN0aW9uT2JzZXJ2ZXIvb3B0aW9ucy50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvb2JzZXJ2ZXIvaW50ZXJzZWN0aW9uT2JzZXJ2ZXIvYmlvbmljT2JzZXJ2ZXIudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50L3V0aWxzL2RvbS9oYXNUZXh0Tm9kZXMudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50L3V0aWxzL2RvbS90cmF2ZXJzYWwudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50L2ZlYXR1cmUvRmVhdHVyZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvdXRpbHMvcGFnZS9zZWFyY2gudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50L3V0aWxzL3BhZ2UvaW5mby50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS90cmFuc2xhdGUvVHJhbnNsYXRlRmVhdHVyZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS90cmFuc2xhdGUvdHJhbnNsYXRlQWRhcHRlci50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS90cmFuc2xhdGUvdGV4dEV4dHJhY3Rvci50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvdXRpbHMvdGV4dC90cmFuc2xhdGlvbi50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS90cmFuc2xhdGUvdHJhbnNsYXRpb25DYWNoZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS90cmFuc2xhdGUvZWxlbWVudFN0eWxlLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC9mZWF0dXJlL3RyYW5zbGF0ZS9kb21SZW5kZXJlci50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS90cmFuc2xhdGUvdHJhbnNsYXRlRWxlbWVudC50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvb2JzZXJ2ZXIvaW50ZXJzZWN0aW9uT2JzZXJ2ZXIvdHJhbnNsYXRlT2JzZXJ2ZXIudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50L2ZlYXR1cmUvaGlnaGxpZ2h0L2tleXdvcmRFeHRyYWN0b3IudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50L2ZlYXR1cmUvaGlnaGxpZ2h0L2hpZ2hsaWdodENvbmZpZy50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS9oaWdobGlnaHQvaGlnaGxpZ2h0Tm9kZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS9oaWdobGlnaHQvd29yZHNNYW5hZ2VyLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC9mZWF0dXJlL2hpZ2hsaWdodC9oaWdobGlnaHRNYW5hZ2VyLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC91dGlscy9kb20vbGluay50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS9saW5rVGFyZ2V0L2xpbmtUYXJnZXQudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50L29ic2VydmVyL2RvbU11dGF0aW9uT2JzZXJ2ZXIudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50L2ZlYXR1cmUvYmlvbmljL0Jpb25pY0ZlYXR1cmUudHMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50L2ZlYXR1cmUvaGlnaGxpZ2h0L2hpZ2hsaWdodGVyLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC9mZWF0dXJlL2hpZ2hsaWdodC9zZWFyY2hLZXl3b3JkQXV0b1VwZGF0ZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS9oaWdobGlnaHQvaGlnaGxpZ2h0SW5pdC50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS9oaWdobGlnaHQvSGlnaGxpZ2h0RmVhdHVyZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS9zdHJpcGUvU3RyaXBlRmVhdHVyZS50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS9saW5rVGFyZ2V0L0xpbmtUYXJnZXRGZWF0dXJlLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC9zZXR0aW5nTWFuYWdlci50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvaW5pdEZ1bmN0aW9ucy50cyIsIi4uLy4uLy4uL2VudHJ5cG9pbnRzL2NvbnRlbnQvZmVhdHVyZS9hbmNob3IvcGluLnRzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIOaWh+acrOiKgueCueiOt+WPluW3peWFt+WHveaVsFxuICpcbiAqIOaPkOS+m+iOt+WPluWSjOi/h+a7pOaWh+acrOiKgueCueeahOWKn+iDve+8jOaUr+aMgeWkmuenjei/h+a7pOadoeS7tlxuICovXG5cbi8qKlxuICog6aKE5a6a5LmJ6ZyA6KaB5o6S6Zmk55qE5qCH562+5YiX6KGoXG4gKiDov5nkupvmoIfnrb7pgJrluLjkuI3ljIXlkKvlj6/or7vmlofmnKzlhoXlrrlcbiAqL1xuY29uc3QgRVhDTFVERURfVEFHUyA9IG5ldyBTZXQoW1xuICAgICAgICAnaW5wdXQnLFxuICAgICAgICAndGV4dGFyZWEnLFxuICAgICAgICAnc2VsZWN0JyxcbiAgICAgICAgJ2J1dHRvbicsXG4gICAgICAgICdzY3JpcHQnLFxuICAgICAgICAnc3R5bGUnLFxuICAgICAgICAnbm9zY3JpcHQnLFxuICAgICAgICAndGVtcGxhdGUnLFxuICAgICAgICAnc3ZnJyxcbiAgICAgICAgJ2ltZycsXG4gICAgICAgICdhdWRpbycsXG4gICAgICAgICd2aWRlbycsXG4gICAgICAgICdvcHRpb24nLFxuICAgICAgICAnaGVhZCcsXG4gICAgICAgICdpZnJhbWUnLFxuICAgICAgICAnaScsXG5dKVxuXG4vKipcbiAqIOaWh+acrOiKgueCueiOt+WPlumAiemhueaOpeWPo1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEdldFRleHROb2Rlc09wdGlvbnMge1xuICAgICAgICAvKiog5piv5ZCm5o6S6Zmk6ZqQ6JeP5YWD57Sg77yM6buY6K6k5Li6IHRydWUgKi9cbiAgICAgICAgZXhjbHVkZUhpZGRlbj86IGJvb2xlYW5cbiAgICAgICAgLyoqIOaWh+acrOWGheWuueeahOacgOWwj+mVv+W6puimgeaxgu+8jOm7mOiupOS4uiAwICovXG4gICAgICAgIG1pbkNvbnRlbnRMZW5ndGg/OiBudW1iZXJcbn1cblxuLyoqXG4gKiDojrflj5bmjIflrprmoLnoioLngrnkuIvmiYDmnInnrKblkIjmnaHku7bnmoTmlofmnKzoioLngrlcbiAqXG4gKiBAcGFyYW0gcm9vdCAtIOmBjeWOhueahOi1t+Wni+agueiKgueCue+8jOm7mOiupOS4uiBkb2N1bWVudC5ib2R5XG4gKiBAcGFyYW0gb3B0aW9ucyAtIOmFjee9rumAiemhueWvueixoVxuICogQHJldHVybnMg56ym5ZCI6L+H5ruk5p2h5Lu255qE5paH5pys6IqC54K55pWw57uEXG4gKlxuICog5Yqf6IO96K+05piO77yaXG4gKiAxLiDoh6rliqjmjpLpmaTpooTlrprkuYnnmoTpnZ7lhoXlrrnlnovmoIfnrb7vvIhpbnB1dC90ZXh0YXJlYeetie+8iVxuICogMi4g5Y+v6YCJ6L+H5ruk6ZqQ6JeP5YWD57Sg77yI6YCa6L+HQ1NT6K6h566X5qC35byP5Yik5pat77yJXG4gKiAzLiDov4fmu6Tnqbrnmb3lhoXlrrnlj4rmu6HotrPmnIDlsI/plb/luqbopoHmsYLnmoTmlofmnKxcbiAqIDQuIOaUr+aMgSBTaGFkb3cgRE9NIOWGheWuueiuv+mXrlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGV4dE5vZGVzKFxuICAgICAgICByb290OiBOb2RlID0gZG9jdW1lbnQuYm9keSxcbiAgICAgICAgb3B0aW9uczogR2V0VGV4dE5vZGVzT3B0aW9ucyA9IHt9XG4pOiBUZXh0W10ge1xuICAgICAgICBjb25zdCB3YWxrZXIgPSBnZXRUZXh0V2Fsa2VyKHJvb3QsIG9wdGlvbnMpXG5cbiAgICAgICAgLy8g6YGN5Y6G5pS26ZuG5omA5pyJ56ym5ZCI5p2h5Lu255qE5paH5pys6IqC54K5XG4gICAgICAgIGNvbnN0IHRleHROb2RlczogVGV4dFtdID0gW11cbiAgICAgICAgd2hpbGUgKHdhbGtlci5uZXh0Tm9kZSgpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHdhbGtlci5jdXJyZW50Tm9kZSBhcyBUZXh0XG4gICAgICAgICAgICAgICAgdGV4dE5vZGVzLnB1c2gobm9kZSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0ZXh0Tm9kZXNcbn1cblxuLyoqXG4gKiDliJvlu7rmlofmnKzoioLngrnpgY3ljoblmahcbiAqXG4gKiBAcGFyYW0gcm9vdCAtIOmBjeWOhui1t+Wni+iKgueCue+8jOm7mOiupOS4uiBkb2N1bWVudC5ib2R5XG4gKiBAcGFyYW0gb3B0aW9ucyAtIOi/h+a7pOmFjee9rumAiemhuVxuICogQHJldHVybnMg6YWN572u5aW955qEIFRyZWVXYWxrZXIg5a6e5L6LXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXh0V2Fsa2VyKFxuICAgICAgICByb290OiBOb2RlID0gZG9jdW1lbnQuYm9keSxcbiAgICAgICAgb3B0aW9uczogR2V0VGV4dE5vZGVzT3B0aW9ucyA9IHt9XG4pOiBUcmVlV2Fsa2VyIHtcbiAgICAgICAgLy8g5ZCI5bm26buY6K6k6YWN572u6YCJ6aG5XG4gICAgICAgIGNvbnN0IHsgZXhjbHVkZUhpZGRlbiA9IHRydWUsIG1pbkNvbnRlbnRMZW5ndGggPSAwIH0gPSBvcHRpb25zXG5cbiAgICAgICAgY29uc3QgYWNjZXB0Tm9kZSA9IChub2RlOiBOb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnRFbGVtZW50XG5cbiAgICAgICAgICAgICAgICBpZiAoIXBhcmVudCkgcmV0dXJuIE5vZGVGaWx0ZXIuRklMVEVSX0FDQ0VQVFxuXG4gICAgICAgICAgICAgICAgLy8g57yT5a2Y5qC35byP5Lul6YG/5YWN6YeN5aSN6K6h566XXG4gICAgICAgICAgICAgICAgY29uc3Qgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShwYXJlbnQpXG5cbiAgICAgICAgICAgICAgICAvLyAxLiDmoIfnrb7lkI3np7Dov4fmu6TvvJrnm7TmjqXmi5Lnu53mlbTkuKrlrZDmoJFcbiAgICAgICAgICAgICAgICBpZiAoRVhDTFVERURfVEFHUy5oYXMocGFyZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBOb2RlRmlsdGVyLkZJTFRFUl9SRUpFQ1RcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyAyLiDlj6/op4HmgKfov4fmu6TvvJrmoLnmja7orqHnrpfmoLflvI/liKTmlq3lhYPntKDmmK/lkKbpmpDol49cbiAgICAgICAgICAgICAgICBpZiAoZXhjbHVkZUhpZGRlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUudmlzaWJpbGl0eSA9PT0gJ2hpZGRlbidcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfUkVKRUNUXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gMy4g5YaF5a656L+H5ruk77ya5qOA5p+l5paH5pys5YaF5a656ZW/5bqm5piv5ZCm6L6+5qCHXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IG5vZGUudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnJ1xuICAgICAgICAgICAgICAgIGlmIChjb250ZW50Lmxlbmd0aCA8IG1pbkNvbnRlbnRMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBOb2RlRmlsdGVyLkZJTFRFUl9SRUpFQ1RcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyA0LiBTaGFkb3cgRE9NIOWkhOeQhlxuICAgICAgICAgICAgICAgIGlmIChub2RlLnBhcmVudEVsZW1lbnQ/LnNoYWRvd1Jvb3QgPT09IG5vZGUuZ2V0Um9vdE5vZGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE5vZGVGaWx0ZXIuRklMVEVSX0FDQ0VQVCAvLyDlhYHorrjorr/pl64gU2hhZG93IERPTSDlhoXlrrlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfQUNDRVBUXG4gICAgICAgIH1cblxuICAgICAgICAvLyDliJvlu7ogVHJlZVdhbGtlciDov5vooYzoioLngrnpgY3ljobvvIzphY3nva7lpI3lkIjov4fmu6TmnaHku7ZcbiAgICAgICAgY29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihyb290LCBOb2RlRmlsdGVyLlNIT1dfVEVYVCwge1xuICAgICAgICAgICAgICAgIGFjY2VwdE5vZGUsXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiB3YWxrZXJcbn1cbiIsImltcG9ydCB7IGdldFRleHRXYWxrZXIgfSBmcm9tICcuLi8uLi91dGlscy9kb20vdGV4dE5vZGVzJ1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdFN0cmlwZSgpIHtcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZSA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcbiAgICAgICAgICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaCgobXV0YXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtdXRhdGlvbi50eXBlID09PSAnY2hpbGRMaXN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXRhdGlvbi5hZGRlZE5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudEVsZW1lbnQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnBhcmVudEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50RWxlbWVudCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNPbmx5VGV4dENvbnRlbnQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50RWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyaXBlRWxlbWVudChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgb2JzZXJ2ZS5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcbiAgICAgICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgfSlcblxuICAgICAgICBzdHJpcGVBbGwoKVxufVxuZnVuY3Rpb24gc3RyaXBlQWxsKCkge1xuICAgICAgICBjb25zdCB3YWxrZXIgPSBnZXRUZXh0V2Fsa2VyKGRvY3VtZW50LmJvZHksIHsgZXhjbHVkZUhpZGRlbjogZmFsc2UgfSlcbiAgICAgICAgbGV0IG5vZGU6IE5vZGUgfCBudWxsXG4gICAgICAgIHdoaWxlICgobm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IG5vZGUucGFyZW50RWxlbWVudFxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgbm9kZS50ZXh0Q29udGVudD8udHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpcGVFbGVtZW50KHBhcmVudClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuLyoqXG4gKiDkuLrmjIflrprlhYPntKDlupTnlKjmnaHnurnmlYjmnpxcbiAqIEBwYXJhbSBlbGVtZW50IC0g6ZyA6KaB5bqU55So5p2h57q55pWI5p6c55qE5YWD57SgXG4gKi9cbmZ1bmN0aW9uIHN0cmlwZUVsZW1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgY29uc3QgYmFja2dyb3VuZEVsZW1lbnQgPSBmaW5kQW5jZXN0b3JXaXRoQmFja2dyb3VuZChlbGVtZW50KVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhiYWNrZ3JvdW5kRWxlbWVudCwgZWxlbWVudCk7XG4gICAgICAgIGlmIChiYWNrZ3JvdW5kRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIC8vIOa3u+WKoOadoee6ueexu+W5tuiuvue9ruminOiJslxuICAgICAgICAgICAgICAgIGlmICghZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ3N0cmlwZWQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdzdHJpcGVkJylcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6I635Y+W6IOM5pmv6aKc6Imy5bm255Sf5oiQ5p2h57q56aKc6ImyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCBjb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoYmFja2dyb3VuZEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgYmFja2dyb3VuZENvbG9yID0gY29tcHV0ZWRTdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCBzdHJpcGVDb2xvciA9IGdlbmVyYXRlU3RyaXBlQ29sb3IoYmFja2dyb3VuZENvbG9yKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6YCa6L+HIENTUyDlj5jph4/ms6jlhaXliqjmgIHpopzoibJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yPXN0cmlwZUNvbG9yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxufVxuLyoqXG4gKiDmn6Xmib7mnIDov5HnmoTlhbfmnInog4zmma/oibLnmoTnpZblhYjlhYPntKBcbiAqIEBwYXJhbSBlbGVtZW50IC0g6LW35aeL5YWD57SgXG4gKiBAcmV0dXJucyDlhbfmnInog4zmma/oibLnmoTnpZblhYjlhYPntKDmiJZudWxsXG4gKi9cbmZ1bmN0aW9uIGZpbmRBbmNlc3RvcldpdGhCYWNrZ3JvdW5kKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICAgICAgbGV0IGN1cnJlbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IGVsZW1lbnRcbiAgICAgICAgd2hpbGUgKGN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoY3VycmVudClcbiAgICAgICAgICAgICAgICAvLyDliKTmlq3og4zmma/oibLmmK/lkKbkuLrpnZ7pgI/mmI7miJblrZjlnKjog4zmma/lm75cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS5iYWNrZ3JvdW5kQ29sb3IgIT09ICdyZ2JhKDAsIDAsIDAsIDApJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUuYmFja2dyb3VuZEltYWdlICE9PSAnbm9uZSdcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudEVsZW1lbnRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIOajgOafpeWFg+e0oOaYr+WQpuWPquWMheWQq+aWh+acrOWGheWuuVxuICogQHBhcmFtIGVsZW1lbnQgLSDpnIDopoHmo4Dmn6XnmoTlhYPntKBcbiAqIEByZXR1cm5zIOWmguaenOWFg+e0oOWPquWMheWQq+aWh+acrOWGheWuue+8jOi/lOWbniB0cnVl77yb5ZCm5YiZ6L+U5ZueIGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGhhc09ubHlUZXh0Q29udGVudChlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGVsZW1lbnQuY2hpbGROb2Rlcykge1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxufVxuLy8gLyoqXG4vLyAgKiDmoLnmja7og4zmma/popzoibLnlJ/miJDmnaHnurnpopzoibJcbi8vICAqIEBwYXJhbSBiYWNrZ3JvdW5kQ29sb3IgLSDog4zmma/popzoibLlrZfnrKbkuLJcbi8vICAqIEByZXR1cm5zIOeUn+aIkOeahOadoee6ueminOiJsuWtl+espuS4slxuLy8gICovXG4vLyBmdW5jdGlvbiBnZW5lcmF0ZVN0cmlwZUNvbG9yKGJhY2tncm91bmRDb2xvcjogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgICBjb25zdCBjb2xvciA9IHRpbnljb2xvcihiYWNrZ3JvdW5kQ29sb3IpO1xuLy8gICAgIGNvbnN0IGNvbXBsZW1lbnQgPSBjb2xvci5jb21wbGVtZW50KCk7XG4vLyAgICAgLy8g5by65Yi26K6+572u6YCP5piO5bqm5Li6IDAuM++8iOS4jiBDU1Mg6buY6K6k5YC85LiA6Ie077yJXG4vLyAgICAgcmV0dXJuIGNvbXBsZW1lbnQuc2V0QWxwaGEoMC4zKS50b1JnYlN0cmluZygpO1xuLy8gfVxuIiwiLyoqXG4gKiDlrZjlgqjplK7lkI3nlJ/miJDlt6Xlhbflh73mlbBcbiAqXG4gKiDmj5Dkvpvln7rkuo7ln5/lkI3nmoTlrZjlgqjplK7lkI3nlJ/miJDlip/og71cbiAqL1xuXG50eXBlIFN0b3JhZ2VLZXkgPSBgbG9jYWw6JHtzdHJpbmd9YFxuXG4vKipcbiAqIOeUn+aIkOW4puWfn+WQjeeahOWtmOWCqOmUruWQje+8iOeUqOS6jnBvcHVw5Zy65pmv77yJXG4gKlxuICogQHBhcmFtIGtleSAtIOWfuuehgOmUruWQjVxuICogQHJldHVybnMg5a6M5pW055qE5a2Y5YKo6ZSu5ZCNXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRLZXlXaXRoRG9tYWluUG9wKGtleTogc3RyaW5nKTogU3RvcmFnZUtleSB7XG4gICAgICAgIGxldCBkb21haW4gPSAnZGVmYXVsdCdcbiAgICAgICAgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKHsgYWN0aW9uOiAnZ2V0RG9tYWluJyB9LCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBkb21haW4gPSByZXNwb25zZS5kb21haW5cbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuIGdlbmVyYXRlU3RvcmFnZUtleShkb21haW4sIGtleSlcbn1cblxuLyoqXG4gKiDnlJ/miJDluKbln5/lkI3nmoTlrZjlgqjplK7lkI1cbiAqXG4gKiBAcGFyYW0ga2V5IC0g5Z+656GA6ZSu5ZCNXG4gKiBAcmV0dXJucyDlrozmlbTnmoTlrZjlgqjplK7lkI1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEtleVdpdGhEb21haW4oa2V5OiBzdHJpbmcpOiBTdG9yYWdlS2V5IHtcbiAgICAgICAgY29uc3QgZG9tYWluID0gZ2V0Q3VycmVudERvbWFpbigpXG4gICAgICAgIHJldHVybiBnZW5lcmF0ZVN0b3JhZ2VLZXkoZG9tYWluLCBrZXkpXG59XG5cbmxldCBjdXJyZW50RG9tYWluOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuXG4vKipcbiAqIOiOt+WPluW9k+WJjeWfn+WQjVxuICpcbiAqIEByZXR1cm5zIOW9k+WJjeWfn+WQjVxuICovXG5mdW5jdGlvbiBnZXRDdXJyZW50RG9tYWluKCk6IHN0cmluZyB7XG4gICAgICAgIGlmIChjdXJyZW50RG9tYWluKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnREb21haW5cbiAgICAgICAgfVxuICAgICAgICAvLyDku47lvZPliY3pobXpnaJVUkzmj5Dlj5bvvIhjb250ZW50IHNjcmlwdOWcuuaZr++8iVxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50RG9tYWluID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lXG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnREb21haW5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ2RlZmF1bHQnXG59XG5cbi8qKlxuICog55Sf5oiQ5a2Y5YKo6ZSu5ZCNXG4gKlxuICogQHBhcmFtIGRvbWFpbiAtIOWfn+WQjVxuICogQHBhcmFtIGtleSAtIOWfuuehgOmUruWQjVxuICogQHJldHVybnMg5a6M5pW055qE5a2Y5YKo6ZSu5ZCNXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlU3RvcmFnZUtleShkb21haW46IHN0cmluZywga2V5OiBzdHJpbmcpOiBTdG9yYWdlS2V5IHtcbiAgICAgICAgcmV0dXJuIGBsb2NhbDoke2RvbWFpbn06JHtrZXl9YFxufVxuIiwiaW1wb3J0IHsgZ2V0VGV4dE5vZGVzIH0gZnJvbSAnLi4vLi4vdXRpbHMvZG9tL3RleHROb2RlcydcblxuZXhwb3J0IGZ1bmN0aW9uIGJpb25pY05lc3RlZFRleHROb2Rlcyhyb290OiBOb2RlID0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICBjb25zdCB0ZXh0Tm9kZXMgPSBnZXRUZXh0Tm9kZXMocm9vdClcbiAgICAgICAgYmlvbmljVGV4dE5vZGVzKHRleHROb2Rlcylcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpb25pY0RpcmVjdFRleHROb2Rlcyhyb290OiBOb2RlKSB7XG4gICAgICAgIC8vIOiOt+WPluebtOaOpeWtkOaWh+acrOiKgueCueW5tui/h+a7pFxuICAgICAgICAvLyBpZiAocm9vdC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIC8vIFx0cm9vdC5wYXJlbnRFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwicmVkXCI7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2cocm9vdCk7XG5cbiAgICAgICAgY29uc3QgZGlyZWN0VGV4dE5vZGVzID0gQXJyYXkuZnJvbShyb290LmNoaWxkTm9kZXMpLmZpbHRlcigobm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIOS7heWkhOeQhuebtOaOpeWtkOaWh+acrOiKgueCuVxuICAgICAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlICE9PSBOb2RlLlRFWFRfTk9ERSkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgICAgICAgICAvLyAvLyDlpI3nlKggZ2V0Tm9kZXMudHMg55qE6L+H5ruk6YC76L6RXG4gICAgICAgICAgICAgICAgLy8gY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIC8vIGlmICghcGFyZW50KSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLyAvLyDmjpLpmaTkuI3lj6/op4HlhYPntKDvvIjmoLnmja4gZ2V0Tm9kZXMudHMg6YC76L6R77yJXG4gICAgICAgICAgICAgICAgLy8gY29uc3Qgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShwYXJlbnQpO1xuICAgICAgICAgICAgICAgIC8vIGlmIChzdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiB8fCBzdHlsZS52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLyAvLyDmjpLpmaTpooTlrprkuYnmoIfnrb7vvIjmoLnmja4gZ2V0Tm9kZXMudHMg55qEIEVYQ0xVREVEX1RBR1PvvIlcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBFWENMVURFRF9UQUdTID0gbmV3IFNldChbXCJpbnB1dFwiLCBcInRleHRhcmVhXCIsIC8qIOWFtuS7luaOkumZpOagh+etviAqL10pO1xuICAgICAgICAgICAgICAgIC8vIGlmIChFWENMVURFRF9UQUdTLmhhcyhwYXJlbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8g5o6S6Zmk56m65paH5pys6IqC54K5XG4gICAgICAgICAgICAgICAgcmV0dXJuIChub2RlLnRleHRDb250ZW50Py50cmltKCkgfHwgJycpLmxlbmd0aCA+IDBcbiAgICAgICAgfSkgYXMgVGV4dFtdXG4gICAgICAgIC8vIGlmIChkaXJlY3RUZXh0Tm9kZXNbMF0ucGFyZW50RWxlbWVudCl7XG4gICAgICAgIC8vIFx0ZGlyZWN0VGV4dE5vZGVzWzBdLnBhcmVudEVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJibGFja1wiO1xuICAgICAgICAvLyB9XG4gICAgICAgIGJpb25pY1RleHROb2RlcyhkaXJlY3RUZXh0Tm9kZXMpXG59XG5cbi8qKlxuICog6YGN5Y6G5bm25aSE55CG57uZ5a6a6IqC54K55LiL55qE5omA5pyJ5paH5pys6IqC54K5XG4gKiDmraTlh73mlbDpppblhYjojrflj5bmiYDmnInmlofmnKzoioLngrnvvIznhLblkI7pgJDkuKrlpITnkIblroPku6xcbiAqIOWcqOWkhOeQhuaWh+acrOiKgueCueS5i+WJjeWSjOS5i+WQju+8jOWug+S8muWBnOatouWSjOmHjeaWsOWQr+WKqOWvuURPTeagkeeahOinguWvn++8jOS7peehruS/neaAp+iDveWSjOWHhuehruaAp1xuICpcbiAqIEBwYXJhbSByb290IHtOb2RlfSAtIOW8gOWni+mBjeWOhueahERPTeagkeeahOagueiKgueCuem7mOiupOS4uuaWh+aho+eahGJvZHnlhYPntKBcbiAqL1xuZnVuY3Rpb24gYmlvbmljVGV4dE5vZGVzKHRleHROb2RlczogVGV4dFtdKSB7XG4gICAgICAgIGZvciAoY29uc3QgdGV4dCBvZiB0ZXh0Tm9kZXMpIHtcbiAgICAgICAgICAgICAgICBiaW9uaWNUZXh0Tm9kZSh0ZXh0KVxuICAgICAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVCaW9uaWNFZmZlY3RzKCkge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYmlvbmljLXRleHQnKS5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICAgICAgICAgIGVsLm91dGVySFRNTCA9IGVsLmlubmVySFRNTFxuICAgICAgICB9KVxufVxuXG4vKipcbiAqIOWkhOeQhuaWh+acrOiKgueCue+8jOWwhuWFtuWGheWuueaLhuWIhuS4uuiLseaWh+WNleivjeWSjOS4reaWh+Wtl+espu+8jOW5tuWIhuWIq+W6lOeUqOS4jeWQjOeahOWkhOeQhuaWueW8j1xuICpcbiAqIOivpeWHveaVsOmmluWFiOiOt+WPluaWh+acrOiKgueCueeahOWGheWuue+8jOW5tumAmui/h+ato+WImeihqOi+vuW8j+WwhuWGheWuueWIhuWJsuS4uuiLseaWh+WNleivjeOAgeS4reaWh+Wtl+espuWSjOWFtuS7luWtl+esplxuICog54S25ZCO5qC55o2u5a2X56ym57G75Z6L5YiG5Yir6LCD55So55u45bqU55qE5aSE55CG5Ye95pWw55Sf5oiQ5paw55qERE9N54mH5q61XG4gKiDmnIDnu4jkvb/nlKjmlrDnlJ/miJDnmoRET03niYfmrrXmm7/mjaLljp/lp4vmlofmnKzoioLngrlcbiAqXG4gKiBAcGFyYW0gbm9kZSDlvoXlpITnkIbnmoTmlofmnKzoioLngrlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpb25pY1RleHROb2RlKG5vZGU6IFRleHQpOiB2b2lkIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2cobm9kZS50ZXh0Q29udGVudCk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBub2RlLnRleHRDb250ZW50IHx8ICcnXG4gICAgICAgIGlmICghdGV4dC50cmltKCkpIHJldHVybiAvLyDlv73nlaXnqbrnmb3mlofmnKzoioLngrlcblxuICAgICAgICAvKipcbiAgICAgICAgICog5L2/55So5q2j5YiZ6KGo6L6+5byP5bCG5paH5pys5YiG5Ymy5oiQ5aSa5Liq6YOo5YiGXG4gICAgICAgICAqIOato+WImeihqOi+vuW8jyhbYS16QS1aXFx1NGUwMC1cXHU5ZmE1XSsp55So5LqO5Yy56YWN5bm25L+d55WZ6Iux5paH5Y2V6K+N5ZKM5Lit5paH5a2X56ymXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBzcGxpdFJlZ2V4ID0gLyhbYS16QS1aMC05Jy1dK3xbXFx1MzQwMC1cXHU5RkZGMC05XSspL1xuICAgICAgICBjb25zdCB3b3JkcyA9IHRleHQuc3BsaXQoc3BsaXRSZWdleClcblxuICAgICAgICBjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICAgICAgICBjb25zdCBpc0VuZ2xpc2ggPSAvXlthLXpBLVowLTknLV0rJC9cbiAgICAgICAgY29uc3QgaXNDaGluZXNlID0gL15bXFx1MzQwMC1cXHU5RkZGMC05XSskL1xuICAgICAgICAvLyBjb25zdCBpc051bWJlciA9IC9eWzAtOV0rJC87XG5cbiAgICAgICAgd29yZHMuZm9yRWFjaCgocGFydCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpc0VuZ2xpc2gudGVzdChwYXJ0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aSE55CG6Iux5paH5Y2V6K+N77yM6LCD55SoYmlvbmljRW7lh73mlbDov5vooYznibnmrorlpITnkIbvvIjlkKvmlbDlrZfvvIlcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGJpb25pY0VuKHBhcnQpKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNDaGluZXNlLnRlc3QocGFydCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWkhOeQhuS4reaWh+Wtl+espuaIluaVsOWtl+e7hOWQiO+8jOiwg+eUqGJpb25pY0Nu5Ye95pWw6L+b6KGM54m55q6K5aSE55CG77yI5ZCr5pWw5a2X77yJXG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChiaW9uaWNDbihwYXJ0KSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5YW25LuW5a2X56ym77yI5aaC57qv5qCH54K556ym5Y+377yJ5L+d5oyB5Y6f5qC35LiN5Y+YXG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwYXJ0KSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8g5L2/55So5paw55Sf5oiQ55qERE9N54mH5q615pu/5o2i5Y6f5aeL5paH5pys6IqC54K5XG4gICAgICAgIG5vZGUucGFyZW50Tm9kZT8ucmVwbGFjZUNoaWxkKGZyYWdtZW50LCBub2RlKVxufVxuXG4vKipcbiAqIOWwhuiLseaWh+WNleivjeaMieeFp+eJueWumuinhOWImei/m+ihjOKAnOS7v+eUn+mYheivu+KAneWkhOeQhuOAglxuICog6KeE5YiZ77ya5bCG5Y2V6K+N55qE5YmN5LiJ5YiG5LmL5LiA77yI5ZCR5LiL5Y+W5pW077yJ6YOo5YiG5Yqg57KX77yM5YW25L2Z6YOo5YiG5L+d5oyB5LiN5Y+Y44CCXG4gKlxuICogQHBhcmFtIHdvcmQgLSDpnIDopoHlpITnkIbnmoToi7HmlofljZXor43lrZfnrKbkuLLjgIJcbiAqIEByZXR1cm5zIERvY3VtZW50RnJhZ21lbnQgLSDljIXlkKvliqDnspflkozmnKrliqDnspfpg6jliIbnmoTmlofmoaPniYfmrrXjgIJcbiAqL1xuZnVuY3Rpb24gYmlvbmljRW4od29yZDogc3RyaW5nKTogRG9jdW1lbnRGcmFnbWVudCB7XG4gICAgICAgIGNvbnN0IGhhbGZJbmRleCA9IE1hdGgubWluKDQsIE1hdGguZmxvb3Iod29yZC5sZW5ndGggLyAzKSlcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUJpb25pY1dvcmRGcmFnbWVudCh3b3JkLCBoYWxmSW5kZXgpXG59XG5cbi8qKlxuICog5bCG5Lit5paH5Y2V6K+N5oyJ54Wn54m55a6a6KeE5YiZ6L+b6KGM4oCc5Lu/55Sf6ZiF6K+74oCd5aSE55CG44CCXG4gKlxuICogQHBhcmFtIHdvcmQgLSDpnIDopoHlpITnkIbnmoTkuK3mlofljZXor43lrZfnrKbkuLLjgIJcbiAqIEByZXR1cm5zIERvY3VtZW50RnJhZ21lbnQgLSDljIXlkKvliqDnspflkozmnKrliqDnspfpg6jliIbnmoTmlofmoaPniYfmrrXjgIJcbiAqL1xuZnVuY3Rpb24gYmlvbmljQ24od29yZDogc3RyaW5nKTogRG9jdW1lbnRGcmFnbWVudCB7XG4gICAgICAgIC8vIOagueaNruWNleivjemVv+W6puehruWumumcgOimgeWKoOeyl+eahOWtl+espuaVsOmHj1xuICAgICAgICBsZXQgYm9sZEluZGV4ID0gMVxuICAgICAgICBpZiAod29yZC5sZW5ndGggPD0gMikge1xuICAgICAgICAgICAgICAgIGJvbGRJbmRleCA9IDBcbiAgICAgICAgfSBlbHNlIGlmICh3b3JkLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgICAgIGJvbGRJbmRleCA9IDFcbiAgICAgICAgfSBlbHNlIGlmICh3b3JkLmxlbmd0aCA+PSA0KSB7XG4gICAgICAgICAgICAgICAgYm9sZEluZGV4ID0gMlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjcmVhdGVCaW9uaWNXb3JkRnJhZ21lbnQod29yZCwgYm9sZEluZGV4KVxufVxuXG4vLyBmdW5jdGlvbiBiaW9uaWNOdW1iZXIod29yZDogc3RyaW5nKTogRG9jdW1lbnRGcmFnbWVudCB7XG4vLyAgICAgY29uc3QgaGFsZkluZGV4ID0gTWF0aC5tYXgoTWF0aC5mbG9vcih3b3JkLmxlbmd0aCAvIDMpLCAxKTtcbi8vICAgICByZXR1cm4gY3JlYXRlQmlvbmljV29yZEZyYWdtZW50KHdvcmQsIGhhbGZJbmRleCk7XG4vLyB9XG5cbi8qKlxuICog5qC55o2u5oyH5a6a55qE5YiG5Ymy57Si5byV77yM5bCG5Y2V6K+N5YiG5Li65Yqg57KX6YOo5YiG5ZKM5pmu6YCa6YOo5YiG77yM5bm255Sf5oiQ5a+55bqU55qE5paH5qGj54mH5q6144CCXG4gKlxuICogQHBhcmFtIHdvcmQgLSDpnIDopoHlpITnkIbnmoTljZXor43lrZfnrKbkuLLjgIJcbiAqIEBwYXJhbSBib2xkSW5kZXggLSDliqDnspfpg6jliIbnmoTnu5PmnZ/ntKLlvJXvvIjkuI3ljIXmi6zor6XntKLlvJXvvInjgIJcbiAqIEByZXR1cm5zIERvY3VtZW50RnJhZ21lbnQgLSDljIXlkKvliqDnspflkozmnKrliqDnspfpg6jliIbnmoTmlofmoaPniYfmrrXjgIJcbiAqL1xuZnVuY3Rpb24gY3JlYXRlQmlvbmljV29yZEZyYWdtZW50KFxuICAgICAgICB3b3JkOiBzdHJpbmcsXG4gICAgICAgIGJvbGRJbmRleDogbnVtYmVyXG4pOiBEb2N1bWVudEZyYWdtZW50IHtcbiAgICAgICAgaWYgKHdvcmQubGVuZ3RoID09PSAwKSByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpIC8vIOWkhOeQhuepuuWtl+espuS4slxuICAgICAgICBpZiAoYm9sZEluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgICAgICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh3b3JkKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZnJhZ21lbnRcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpcnN0SGFsZiA9IHdvcmQuc2xpY2UoMCwgYm9sZEluZGV4KSAvLyDmj5Dlj5bpnIDopoHliqDnspfnmoTpg6jliIZcbiAgICAgICAgY29uc3Qgc2Vjb25kSGFsZiA9IHdvcmQuc2xpY2UoYm9sZEluZGV4KSAvLyDmj5Dlj5bkuI3pnIDopoHliqDnspfnmoTpg6jliIZcblxuICAgICAgICBjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICAgICAgICBpZiAoZmlyc3RIYWxmKSBmcmFnbWVudC5hcHBlbmRDaGlsZChjcmVhdGVTdHJvbmdFbGVtZW50KGZpcnN0SGFsZikpIC8vIOmBv+WFjeepuuaWh+acrOiKgueCuVxuICAgICAgICBpZiAoc2Vjb25kSGFsZilcbiAgICAgICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShzZWNvbmRIYWxmKSkgLy8g6YG/5YWN56m65paH5pys6IqC54K5XG5cbiAgICAgICAgcmV0dXJuIGZyYWdtZW50XG59XG5cbi8qKlxuICog5Yib5bu65LiA5Liq5Yqg57KX55qEIEhUTUwg5YWD57Sg77yM55So5LqO5Lu/55Sf6ZiF6K+755qE5Yqg57KX6YOo5YiG44CCXG4gKlxuICogQHBhcmFtIHRleHQgLSDpnIDopoHliqDnspfnmoTmlofmnKzlhoXlrrnjgIJcbiAqIEByZXR1cm5zIEhUTUxFbGVtZW50IC0g5YyF5ZCr5Yqg57KX5qC35byP55qEIEhUTUwg5YWD57Sg44CCXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVN0cm9uZ0VsZW1lbnQodGV4dDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICAgICAgICAvLyDkvb/nlKggPHN0cm9uZz4g5qCH562+5a6e546w5Yqg57KX5pWI5p6cXG4gICAgICAgIGNvbnN0IHN0cm9uZ0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHJvbmcnKVxuICAgICAgICAvLyDpgJrov4fnsbvlkI3nrqHnkIbmiYDmnInmoLflvI/vvIznoa7kv53lhoXlpJbovrnot53kuLogMCDkuJTmlofmnKzkuI3mjaLooYxcbiAgICAgICAgc3Ryb25nRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdiaW9uaWMtdGV4dCcpXG4gICAgICAgIHN0cm9uZ0VsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG4gICAgICAgIHJldHVybiBzdHJvbmdFbGVtZW50XG59XG4iLCJleHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uT2JzZXJ2ZXJPcHRpb25zOiBJbnRlcnNlY3Rpb25PYnNlcnZlckluaXQgPSB7XG4gICAgICAgIHRocmVzaG9sZDogMCxcbiAgICAgICAgcm9vdE1hcmdpbjogJzMwMHB4Jyxcbn1cbiIsImltcG9ydCB7IGludGVyc2VjdGlvbk9ic2VydmVyT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucydcbmltcG9ydCB7IGJpb25pY1RleHROb2RlIH0gZnJvbSAnLi4vLi4vZmVhdHVyZS9iaW9uaWMvYmlvbmljTm9kZSdcbmltcG9ydCB7IG1hbmFnZU11dGF0aW9uT2JzZXJ2ZXIgfSBmcm9tICcuLi9kb21NdXRhdGlvbk9ic2VydmVyJ1xuaW1wb3J0IHsgZ2V0VGV4dE5vZGVzIH0gZnJvbSAnLi4vLi4vdXRpbHMvZG9tL3RleHROb2RlcydcblxuLyoqXG4gKiDku7/nlJ/mlofmnKzop4Llr5/lmajmqKHlnZdcbiAqIOWKn+iDve+8muWcqOWFg+e0oOi/m+WFpeinhuWPo+aXtuWvueWFtuaWh+acrOiKgueCueW6lOeUqOS7v+eUn+aViOaenO+8jOW5tueuoeeQhuebuOWFs+i1hOa6kFxuICog5bel5L2c5rWB56iL77yaXG4gKiAxLiDnm5HlkKxET03lj5jljJbmmoLlgZwv5oGi5aSN6KeC5a+f5ZmoXG4gKiAyLiDlvZPlhYPntKDov5vlhaXop4blj6Pml7blupTnlKjmlofmnKzmlYjmnpxcbiAqIDMuIOe7tOaKpOWFg+e0oOS4juaWh+acrOiKgueCueeahOaYoOWwhOWFs+ezu1xuICogNC4g5riF55CG5bey5aSE55CG5oiW56e76Zmk55qE6IqC54K56LWE5rqQXG4gKi9cbi8vIOS9v+eUqCBTZXQg5a2Y5YKo5paH5pys6IqC54K577yM6YG/5YWN6YeN5aSN5bm25o+Q5Y2H5p+l5om+5pWI546HXG5leHBvcnQgY29uc3QgcGFyZW50VG9UZXh0Tm9kZXNNYXAgPSBuZXcgTWFwPEVsZW1lbnQsIFNldDxUZXh0Pj4oKVxuXG4vKipcbiAqIEludGVyc2VjdGlvbk9ic2VydmVy6YWN572u6YCJ6aG5XG4gKiDojrflj5blhbfkvZPphY3nva7lj4LmlbDvvIjpmIjlgLww77yM5qC56L656LedMTAwcHjvvIlcbiAqL1xuZXhwb3J0IGNvbnN0IGJpb25pY1RleHRPYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcigoZW50cmllcykgPT4ge1xuICAgICAgICBtYW5hZ2VNdXRhdGlvbk9ic2VydmVyKGZhbHNlKVxuICAgICAgICBlbnRyaWVzLmZvckVhY2gocHJvY2Vzc1Zpc2libGVUZXh0RWxlbWVudClcbiAgICAgICAgbWFuYWdlTXV0YXRpb25PYnNlcnZlcih0cnVlKVxufSwgaW50ZXJzZWN0aW9uT2JzZXJ2ZXJPcHRpb25zKVxuXG4vKipcbiAqIOWkhOeQhkludGVyc2VjdGlvbk9ic2VydmVyRW50cnnvvIzlvZPlhYPntKDov5vlhaXop4blj6Pml7blupTnlKjmlofmnKzoioLngrnnmoTku7/nlJ/mlYjmnpzlubbmuIXnkIbmmKDlsITjgIJcbiAqIEBwYXJhbSBlbnRyeSAtIEludGVyc2VjdGlvbk9ic2VydmVy5Zue6LCD5o6l5pS255qE5p2h55uu5a+56LGh77yM5YyF5ZCr55uu5qCH5YWD57Sg5ZKM55u45Lqk54q25oCBXG4gKiBAcmV0dXJucyB7dm9pZH1cbiAqIEByZW1hcmtzXG4gKiDmoLjlv4PlpITnkIbmraXpqqTvvJpcbiAqIDEuIOajgOafpeWFg+e0oOacieaViOaAp++8iOaYr+WQpuS7jeWcqERPTeS4re+8iVxuICogMi4g5bqU55So5Lu/55Sf5pWI5p6c5Yiw5paH5pys6IqC54K577yI5aaC6auY5Lqu44CB5Yqo55S7562J77yJXG4gKiAzLiDmuIXnkIblt7LlrozmiJDlpITnkIbnmoTlhYPntKDkuI7mlofmnKzoioLngrnnmoTmmKDlsITlhbPns7tcbiAqIDQuIOWBnOatouWvueW9k+WJjeWFg+e0oOeahOinguWvn+S7pemBv+WFjemHjeWkjeWkhOeQhlxuICovXG5mdW5jdGlvbiBwcm9jZXNzVmlzaWJsZVRleHRFbGVtZW50KGVudHJ5OiBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBlbnRyeS50YXJnZXQgYXMgRWxlbWVudFxuICAgICAgICBjb25zdCBzZXRUZXh0cyA9IHBhcmVudFRvVGV4dE5vZGVzTWFwLmdldChlbGVtZW50KVxuXG4gICAgICAgIC8vIOWinuWKoCBkb2N1bWVudC5jb250YWlucyDmo4Dmn6XvvIznoa7kv53lhYPntKDku43lnKggRE9NIOS4rVxuICAgICAgICBpZiAoIXNldFRleHRzIHx8ICFlbnRyeS5pc0ludGVyc2VjdGluZyB8fCAhZG9jdW1lbnQuY29udGFpbnMoZWxlbWVudCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgLy8g5bqU55So5Lu/55Sf5pWI5p6c5Yiw5paH5pys6IqC54K577yI5L6L5aaC6auY5Lqu44CB5Yqo55S7562J77yJXG4gICAgICAgIGFwcGx5QmlvbmljRWZmZWN0KEFycmF5LmZyb20oc2V0VGV4dHMpKVxuXG4gICAgICAgIC8vIOa4heeQhuWFg+e0oOS4juaWh+acrOiKgueCueeahOaYoOWwhOWFs+ezu1xuICAgICAgICBjbGVhbnVwQW5kVW5vYnNlcnZlKGVsZW1lbnQpXG59XG5cbi8qKlxuICog5bCG5Lu/55Sf5pWI5p6c5bqU55So5Yiw5oyH5a6a5paH5pys6IqC54K55pWw57uEXG4gKiBAcGFyYW0gdGV4dE5vZGVzIC0g6ZyA6KaB5bqU55So5pWI5p6c55qE5paH5pys6IqC54K55pWw57uEXG4gKiBAcmVtYXJrc1xuICog6LCD55SoZmVhdHVyZS9iaW9uaWMvYmlvbmljTm9kZeS4reeahGJpb25pY1RleHROb2Rl5Ye95pWw5a6e546w5YW35L2T5pWI5p6cXG4gKiBAaW50ZXJuYWxcbiAqIOWunueOsOe7huiKgu+8mumBjeWOhuavj+S4quaWh+acrOiKgueCueW5tuiwg+eUqGJpb25pY1RleHROb2Rl6L+b6KGM5aSE55CGXG4gKi9cbmZ1bmN0aW9uIGFwcGx5QmlvbmljRWZmZWN0KHRleHROb2RlczogVGV4dFtdKSB7XG4gICAgICAgIHRleHROb2Rlcy5mb3JFYWNoKCh0ZXh0KSA9PiBiaW9uaWNUZXh0Tm9kZSh0ZXh0KSlcbn1cblxuLyoqXG4gKiDmuIXnkIbmjIflrprlhYPntKDkuI7mlofmnKzoioLngrnnmoTmmKDlsITlhbPns7vlubblgZzmraLop4Llr59cbiAqIEBwYXJhbSBlbGVtZW50IC0g6ZyA6KaB5riF55CG55qE5YWD57Sg6IqC54K5XG4gKiBAaW50ZXJuYWxcbiAqIOWunueOsOe7huiKgu+8muWIoOmZpOWFg+e0oOaYoOWwhOW5tuiwg+eUqHVub2JzZXJ2ZeWBnOatouinguWvn1xuICovXG5mdW5jdGlvbiBjbGVhbnVwQW5kVW5vYnNlcnZlKGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICAgICAgcGFyZW50VG9UZXh0Tm9kZXNNYXAuZGVsZXRlKGVsZW1lbnQpXG4gICAgICAgIGJpb25pY1RleHRPYnNlcnZlci51bm9ic2VydmUoZWxlbWVudClcbn1cblxuLyoqXG4gKiDliJ3lp4vljJbljZXmrKHkvb/nlKjop4Llr5/lmajvvIzlvIDlp4vop4Llr5/mlofmoaPkuLvkvZNcbiAqIEByZW1hcmtzXG4gKiDkuLvopoHnlKjkuo7liJ3lp4vljJbpmLbmrrXorr7nva7op4Llr5/otbfngrlcbiAqIEBpbnRlcm5hbFxuICog5a6e546w57uG6IqC77ya6LCD55Sob2JzZXJ2ZUVsZW1lbnROb2Rl5pa55rOV6KeC5a+fZG9jdW1lbnQuYm9keVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZVNpbmdsZVVzZU9ic2VydmVyKCkge1xuICAgICAgICBvYnNlcnZlRWxlbWVudE5vZGUoZG9jdW1lbnQuYm9keSlcbn1cblxuLyoqXG4gKiDop4Llr5/mjIflrprlhYPntKDnmoTmiYDmnInmlofmnKzoioLngrlcbiAqIEBwYXJhbSBlbGUgLSDpnIDopoHop4Llr5/nmoTlhYPntKDoioLngrlcbiAqIEByZW1hcmtzXG4gKiDosIPnlKhraXQvZ2V0VGV4dE5vZGVz6I635Y+W5YWD57Sg5LiL55qE5omA5pyJ5paH5pys6IqC54K5XG4gKiBAaW50ZXJuYWxcbiAqIOWunueOsOe7huiKgu+8muiOt+WPluWFg+e0oOS4i+aJgOacieespuWQiOadoeS7tueahOaWh+acrOiKgueCueW5tumAkOS4quinguWvn1xuICovXG5leHBvcnQgZnVuY3Rpb24gb2JzZXJ2ZUVsZW1lbnROb2RlKGVsZTogRWxlbWVudCkge1xuICAgICAgICBnZXRUZXh0Tm9kZXMoZWxlKS5mb3JFYWNoKG9ic2VydmVUZXh0Tm9kZSlcbn1cblxuLyoqXG4gKiDop4Llr5/ljZXkuKrmlofmnKzoioLngrlcbiAqIEBwYXJhbSB0ZXh0IC0g6ZyA6KaB6KeC5a+f55qE5paH5pys6IqC54K5XG4gKiBAcmVtYXJrc1xuICogMS4g5qOA5p+l54i25YWD57Sg5piv5ZCm5a2Y5Zyo5LiU5LuN5ZyoRE9N5LitXG4gKiAyLiDlu7rnq4vmlofmnKzoioLngrnkuI7niLblhYPntKDnmoTlhbPogZTmmKDlsIRcbiAqIEBpbnRlcm5hbFxuICog5a6e546w57uG6IqC77ya6I635Y+W5paH5pys6IqC54K555qE54i25YWD57Sg5bm26LCD55SobGlua1RleHRUb0VsZW1lbnTlu7rnq4vmmKDlsIRcbiAqL1xuZnVuY3Rpb24gb2JzZXJ2ZVRleHROb2RlKHRleHQ6IFRleHQpIHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGV4dC5wYXJlbnRFbGVtZW50XG4gICAgICAgIGlmICghcGFyZW50IHx8ICFkb2N1bWVudC5jb250YWlucyhwYXJlbnQpKSByZXR1cm4gLy8g5paw5aKe5a2Y5Zyo5oCn5qCh6aqMXG5cbiAgICAgICAgLy8g5pu05paw5pig5bCE5YWz57O7XG4gICAgICAgIGxpbmtUZXh0VG9FbGVtZW50KHBhcmVudCwgdGV4dClcbn1cblxuLyoqXG4gKiDlu7rnq4vmlofmnKzoioLngrnkuI7lhbbniLblhYPntKDnmoTlhbPogZTmmKDlsIRcbiAqIEBwYXJhbSBwYXJlbnQgLSDniLblhYPntKDoioLngrlcbiAqIEBwYXJhbSB0ZXh0IC0g5paH5pys6IqC54K5XG4gKiBAcmVtYXJrc1xuICogMS4g5aaC5p6c54i25YWD57Sg5bey5pyJ5pig5bCE5YiZ55u05o6l5re75Yqg5paw5paH5pys6IqC54K5XG4gKiAyLiDlpoLmnpzniLblhYPntKDmsqHmnInmmKDlsITliJnliJvlu7rmlrDnmoTmmKDlsITlubblvIDlp4vop4Llr59cbiAqIEBpbnRlcm5hbFxuICog5a6e546w57uG6IqC77ya5L2/55SoTWFw5a2Y5YKo5YWD57Sg5Yiw5paH5pys6IqC54K56ZuG5ZCI55qE5pig5bCE5YWz57O7XG4gKi9cbmZ1bmN0aW9uIGxpbmtUZXh0VG9FbGVtZW50KHBhcmVudDogRWxlbWVudCwgdGV4dDogVGV4dCkge1xuICAgICAgICBpZiAocGFyZW50VG9UZXh0Tm9kZXNNYXAuaGFzKHBhcmVudCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZXRUZXh0cyA9IHBhcmVudFRvVGV4dE5vZGVzTWFwLmdldChwYXJlbnQpIVxuICAgICAgICAgICAgICAgIGlmICghc2V0VGV4dHMuaGFzKHRleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUZXh0cy5hZGQodGV4dClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2V0VGV4dHMgPSBuZXcgU2V0PFRleHQ+KFt0ZXh0XSlcbiAgICAgICAgICAgICAgICBwYXJlbnRUb1RleHROb2Rlc01hcC5zZXQocGFyZW50LCBzZXRUZXh0cylcbiAgICAgICAgICAgICAgICBiaW9uaWNUZXh0T2JzZXJ2ZXIub2JzZXJ2ZShwYXJlbnQpXG4gICAgICAgIH1cbn1cbiIsIi8qKlxuICog5paH5pys6IqC54K55qOA5p+l5bel5YW35Ye95pWwXG4gKlxuICog5o+Q5L6b5qOA5p+l5YWD57Sg5piv5ZCm5YyF5ZCr5paH5pys6IqC54K555qE5Yqf6IO9XG4gKi9cblxuLyoqXG4gKiDmo4Dmn6XlhYPntKDmmK/lkKbljIXlkKvmlofmnKzoioLngrlcbiAqXG4gKiBAcGFyYW0gZWxlbWVudCAtIOimgeajgOafpeeahCBET00g5YWD57SgXG4gKiBAcmV0dXJucyDlpoLmnpzlrZjlnKjmlofmnKzoioLngrnliJnov5Tlm54gdHJ1Ze+8jOWQpuWImei/lOWbniBmYWxzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzVGV4dE5vZGVzKGVsZW1lbnQ6IEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIGVsZW1lbnQuY2hpbGROb2Rlcykge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnRleHRDb250ZW50Py50cmltKCkgIT09ICcnXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiDojrflj5blhYPntKDkuK3nmoTmiYDmnInmlofmnKzoioLngrlcbiAqXG4gKiBAcGFyYW0gZWxlbWVudCAtIOimgeajgOafpeeahCBET00g5YWD57SgXG4gKiBAcmV0dXJucyDmlofmnKzoioLngrnmlbDnu4RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRleHROb2Rlc0Zyb21FbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBUZXh0W10ge1xuICAgICAgICBjb25zdCB0ZXh0Tm9kZXM6IFRleHRbXSA9IFtdXG4gICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBlbGVtZW50LmNoaWxkTm9kZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS50ZXh0Q29udGVudD8udHJpbSgpICE9PSAnJ1xuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dE5vZGVzLnB1c2gobm9kZSBhcyBUZXh0KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGV4dE5vZGVzXG59XG4iLCIvLyBpbXBvcnQgeyBHZXRUZXh0Tm9kZXNPcHRpb25zIH0gZnJvbSBcIi4vZ2V0VGV4dE5vZGVzXCI7XG5pbXBvcnQgeyBoYXNUZXh0Tm9kZXMgfSBmcm9tICcuL2hhc1RleHROb2RlcydcblxuY29uc3QgRVhDTFVERV9UQUdTID0gbmV3IFNldChbXG4gICAgICAgICdTQ1JJUFQnLFxuICAgICAgICAnU1RZTEUnLFxuICAgICAgICAnTk9TQ1JJUFQnLFxuICAgICAgICAnU1ZHJyxcbiAgICAgICAgJ01BVEgnLFxuICAgICAgICAnVkFSJyxcbiAgICAgICAgJ1NBTVAnLFxuICAgICAgICAnS0JEJyxcbiAgICAgICAgJ1BSRScsXG4gICAgICAgICdURVhUQVJFQScsXG4gICAgICAgICdJTlBVVCcsXG4gICAgICAgICdDT0RFJyxcbl0pXG5cbmNvbnN0IElOTElORV9ESVNQTEFZX1ZBTFVFUyA9IG5ldyBTZXQoW1xuICAgICAgICAnaW5saW5lJyxcbiAgICAgICAgJ2lubGluZS1ibG9jaycsXG4gICAgICAgICdpbmxpbmUtZmxleCcsXG4gICAgICAgICdpbmxpbmUtZ3JpZCcsXG4gICAgICAgICdpbmxpbmUtdGFibGUnLFxuXSlcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRleHRDb250YWluZXJFbGVtZW50KFxuICAgICAgICByb290OiBOb2RlID0gZG9jdW1lbnQuYm9keVxuICAgICAgICAvLyBvcHRpb25zOiBHZXRUZXh0Tm9kZXNPcHRpb25zID0ge31cbik6IEhUTUxFbGVtZW50W10ge1xuICAgICAgICBjb25zdCB3YWxrZXIgPSBnZXRUZXh0Q29udGFpbmVyV2Fsa2VyKHJvb3QpXG5cbiAgICAgICAgLy8g6YGN5Y6G5pS26ZuG5omA5pyJ56ym5ZCI5p2h5Lu255qE5paH5pys6IqC54K5XG4gICAgICAgIGNvbnN0IHRleHROb2RlczogSFRNTEVsZW1lbnRbXSA9IFtdXG4gICAgICAgIHdoaWxlICh3YWxrZXIubmV4dE5vZGUoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB3YWxrZXIuY3VycmVudE5vZGUgYXMgSFRNTEVsZW1lbnRcblxuICAgICAgICAgICAgICAgIC8vIG5vZGUudGV4dENvbnRlbnQgPSBcIlwiO1xuXG4gICAgICAgICAgICAgICAgdGV4dE5vZGVzLnB1c2gobm9kZSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0ZXh0Tm9kZXNcbn1cblxuLyoqXG4gKiDojrflj5bljIXlkKvmnInmlYjmlofmnKzlhoXlrrnnmoTlrrnlmajlhYPntKDpgY3ljoblmahcbiAqXG4gKiBAcGFyYW0gcm9vdCAtIOmBjeWOhui1t+Wni+iKgueCue+8jOm7mOiupOS4umRvY3VtZW50LmJvZHlcbiAqIEBwYXJhbSBvcHRpb25zIC0g6L+H5ruk6YWN572u6YCJ6aG5XG4gKiBAcmV0dXJucyDphY3nva7lpb3nmoRUcmVlV2Fsa2Vy5a6e5L6LXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRleHRDb250YWluZXJXYWxrZXIoXG4gICAgICAgIHJvb3Q6IE5vZGUgPSBkb2N1bWVudC5ib2R5XG4gICAgICAgIC8vIG9wdGlvbnM6IEdldFRleHROb2Rlc09wdGlvbnMgPSB7fVxuKTogVHJlZVdhbGtlciB7XG4gICAgICAgIC8vIGNvbnN0IHsgZXhjbHVkZUhpZGRlbiA9IHRydWUgfSA9IG9wdGlvbnM7XG5cbiAgICAgICAgY29uc3QgYWNjZXB0Tm9kZSA9IChub2RlOiBOb2RlKTogbnVtYmVyID0+IHtcbiAgICAgICAgICAgICAgICAvLyDku4XlpITnkIblhYPntKDoioLngrlcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfU0tJUFxuXG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IG5vZGUgYXMgRWxlbWVudFxuXG4gICAgICAgICAgICAgICAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b1VwcGVyQ2FzZSgpXG5cbiAgICAgICAgICAgICAgICAvLyDmlrDlop7vvJrnm7TmjqXot7Pov4fmjIflrprmoIfnrb5cbiAgICAgICAgICAgICAgICBpZiAoRVhDTFVERV9UQUdTLmhhcyh0YWdOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE5vZGVGaWx0ZXIuRklMVEVSX1JFSkVDVCAvLyDot7Pov4for6XlhYPntKDlj4rlhbbmiYDmnInlrZDoioLngrlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmjpLpmaTpnZ7lrrnlmajmoIfnrb5cbiAgICAgICAgICAgICAgICAvLyBpZiAoRVhDTFVERURfVEFHUy5oYXMoZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBOb2RlRmlsdGVyLkZJTFRFUl9SRUpFQ1Q7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiAoXG4gICAgICAgICAgICAgICAgLy8gICAgIGV4Y2x1ZGVIaWRkZW4gJiZcbiAgICAgICAgICAgICAgICAvLyAgICAgKHN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiIHx8IHN0eWxlLnZpc2liaWxpdHkgPT09IFwiaGlkZGVuXCIpXG4gICAgICAgICAgICAgICAgLy8gKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBOb2RlRmlsdGVyLkZJTFRFUl9SRUpFQ1Q7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIC8vIOaWh+acrOWGheWuueajgOafpVxuICAgICAgICAgICAgICAgIHJldHVybiBpc0VsaWdpYmxlRWxlbWVudFYyKGVsZW1lbnQpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0VsaWdpYmxlRWxlbWVudChlbGVtZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBOb2RlRmlsdGVyLkZJTFRFUl9BQ0NFUFRcbiAgICAgICAgICAgICAgICAgICAgICAgIDogTm9kZUZpbHRlci5GSUxURVJfU0tJUFxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIocm9vdCwgTm9kZUZpbHRlci5TSE9XX0VMRU1FTlQsIHtcbiAgICAgICAgICAgICAgICBhY2NlcHROb2RlLFxuICAgICAgICB9KVxufVxuXG4vKipcbiAqIOWIpOaWree7meWumueahERPTeWFg+e0oOaYr+WQpuespuWQiOeJueWumuadoeS7tu+8iOWMheWQq+aWh+acrOS4lOeItuWFg+e0oOS4jeWMheWQq+aWh+acrO+8jOaOkumZpOeJueWumuihjOWGheWFg+e0oOaDheWGte+8ieOAglxuICogQHBhcmFtIGVsZW1lbnQg6ZyA6KaB5qOA5p+l55qERE9N5YWD57SgXG4gKiBAcmV0dXJucyDlpoLmnpzlhYPntKDnrKblkIjmnaHku7bov5Tlm550cnVl77yM5ZCm5YiZ6L+U5ZueZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNFbGlnaWJsZUVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudEVsZW1lbnRcbiAgICAgICAgaWYgKCFwYXJlbnQpIHJldHVybiBmYWxzZVxuXG4gICAgICAgIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudClcblxuICAgICAgICAvKipcbiAgICAgICAgICog6L+H5ruk6KGM5YaF5YWD57Sg5LiU54i25YWD57Sg5YyF5ZCr5paH5pys55qE5oOF5Ya1XG4gICAgICAgICAqIOmBv+WFjeWwhuWMheWQq+e6r+aWh+acrOeahOWuueWZqOWFg+e0oOS4reeahOihjOWGheWFg+e0oOivr+WIpOS4uuebruagh+WFg+e0oFxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKElOTElORV9ESVNQTEFZX1ZBTFVFUy5oYXMoc3R5bGUuZGlzcGxheSkgJiYgaGFzVGV4dE5vZGVzKHBhcmVudCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhc1RleHQgPSBoYXNUZXh0Tm9kZXMoZWxlbWVudClcbiAgICAgICAgY29uc3QgcGFyZW50SGFzVGV4dCA9IGhhc1RleHROb2RlcyhwYXJlbnQpXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaguOW/g+WIpOWumumAu+i+ke+8muWFg+e0oOiHqui6q+W/hemhu+WMheWQq+aWh+acrOiKgueCuVxuICAgICAgICAgKiDkuJTlhbbniLblhYPntKDkuI3og73nm7TmjqXljIXlkKvmlofmnKzoioLngrlcbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiBoYXNUZXh0ICYmICFwYXJlbnRIYXNUZXh0XG59XG5cbi8qKlxuICog5Yik5pat57uZ5a6a55qERE9N5YWD57Sg5piv5ZCm56ym5ZCI54m55a6a5p2h5Lu244CCXG4gKiBAcGFyYW0gZWxlbWVudCDpnIDopoHmo4Dmn6XnmoRET03lhYPntKBcbiAqIEByZXR1cm5zIOWmguaenOWFg+e0oOespuWQiOadoeS7tui/lOWbnnRydWXvvIzlkKbliJnov5Tlm55mYWxzZVxuICovXG5mdW5jdGlvbiBpc0VsaWdpYmxlRWxlbWVudFYyKGVsZW1lbnQ6IEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKCFoYXNUZXh0Tm9kZXMoZWxlbWVudCkpIHJldHVybiBmYWxzZVxuXG4gICAgICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBlbGVtZW50LmNoaWxkTm9kZXNcblxuICAgICAgICBpZiAoY2hpbGROb2Rlcy5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gY2hpbGROb2Rlc1tpXVxuXG4gICAgICAgICAgICAgICAgLy8g5aSE55CG5paH5pys6IqC54K5XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gbm9kZS5ub2RlVmFsdWU/LnRyaW0oKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRleHQpIGNvbnRpbnVlIC8vIOacieaViOaWh+acrOiKgueCuVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlIC8vIOepuuaWh+acrOiKgueCuVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWkhOeQhuWFg+e0oOiKgueCuVxuICAgICAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGRFbGVtZW50ID0gbm9kZSBhcyBFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGNoaWxkRWxlbWVudClcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5qOA5p+l5piv5ZCm5Li66KGM5YaF5YWD57SgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIUlOTElORV9ESVNQTEFZX1ZBTFVFUy5oYXMoc3R5bGUuZGlzcGxheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmdnuWFg+e0oC/mlofmnKzoioLngrlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIOafpeaJvuaMh+WumuWFg+e0oOacgOi/keeahOmdnuaWh+acrOiKgueCueelluWFiOWFg+e0oOOAglxuICogQHBhcmFtIGVsZW1lbnQgLSDotbflp4vlhYPntKDvvIzku47or6XlhYPntKDlvIDlp4vlkJHkuIrmn6Xmib5cbiAqIEByZXR1cm5zIOacgOi/keeahOmdnuaWh+acrOiKgueCueelluWFiOWFg+e0oO+8m+iLpeaXoOeItuWFg+e0oOWImei/lOWbnuiHqui6q1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZE5lYXJlc3ROb25UZXh0QW5jZXN0b3IoZWxlbWVudDogRWxlbWVudCk6IEVsZW1lbnQge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudEVsZW1lbnRcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIC8vIOajgOafpeeItuWFg+e0oOaYr+WQpuWMheWQq+aWh+acrOiKgueCuVxuICAgICAgICAgICAgICAgIGlmIChoYXNUZXh0Tm9kZXMocGFyZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbmROZWFyZXN0Tm9uVGV4dEFuY2VzdG9yKHBhcmVudClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g54i25YWD57Sg5LiN5ZCr5paH5pys6IqC54K577yM6L+U5Zue5b2T5YmN5YWD57SgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIuaJvuWIsOacgOi/keeahOmdnuaWh+acrOiKgueCueelluWFiOWFg+e0oFwiLGVsZW1lbnQudGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8g6Iul5peg54i25YWD57Sg77yM6L+U5Zue6Ieq6Lqr77yI56Gu5L+d5LiN6L+U5ZueIHVuZGVmaW5lZO+8iVxuICAgICAgICByZXR1cm4gZWxlbWVudFxufVxuIiwiLyoqXG4gKiDlip/og73mjqXlj6PvvIznlKjkuo7nu5/kuIDnrqHnkIblkITkuKrlip/og71cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJRmVhdHVyZSB7XG4gICAgICAgIC8qKiDlip/og73lkI3np7AgKi9cbiAgICAgICAgcmVhZG9ubHkgbmFtZTogc3RyaW5nXG4gICAgICAgIC8qKiDpu5jorqTlkK/nlKjnirbmgIEgKi9cbiAgICAgICAgcmVhZG9ubHkgZGVmYXVsdDogYm9vbGVhblxuICAgICAgICAvKiog5Yid5aeL5YyW5Yqf6IO977yI5Y+v6YCJ77yJICovXG4gICAgICAgIGluaXQ/KCk6IHZvaWQgfCBQcm9taXNlPHZvaWQ+XG4gICAgICAgIC8qKiDlkK/nlKjlip/og70gKi9cbiAgICAgICAgb24oKTogdm9pZCB8IFByb21pc2U8dm9pZD5cbiAgICAgICAgLyoqIOemgeeUqOWKn+iDvSAqL1xuICAgICAgICBvZmYoKTogdm9pZCB8IFByb21pc2U8dm9pZD5cbn1cblxuLyoqXG4gKiDmir3osaHln7rnsbvvvIzmj5Dkvpvpu5jorqTlrp7njrBcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEZlYXR1cmUgaW1wbGVtZW50cyBJRmVhdHVyZSB7XG4gICAgICAgIGFic3RyYWN0IHJlYWRvbmx5IG5hbWU6IHN0cmluZ1xuICAgICAgICBhYnN0cmFjdCByZWFkb25seSBkZWZhdWx0OiBib29sZWFuXG5cbiAgICAgICAgaW5pdD8oKTogdm9pZCB8IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAgICAgICAgIC8vIOm7mOiupOaXoOaTjeS9nFxuICAgICAgICB9XG5cbiAgICAgICAgYWJzdHJhY3Qgb24oKTogdm9pZCB8IFByb21pc2U8dm9pZD5cbiAgICAgICAgYWJzdHJhY3Qgb2ZmKCk6IHZvaWQgfCBQcm9taXNlPHZvaWQ+XG59XG4iLCIvKipcbiAqIOaQnOe0ouW8leaTjumFjee9ruW3peWFt+WHveaVsFxuICpcbiAqIOaPkOS+m+aQnOe0ouW8leaTjuivhuWIq+WSjOmFjee9rueuoeeQhuWKn+iDvVxuICovXG5cbi8qKlxuICog5pCc57Si5byV5pOO6YWN572u5o6l5Y+jXG4gKiDlrprkuYnmkJzntKLlvJXmk47nmoTlkI3np7DjgIHlhbPplK7or43lj4LmlbDlkoxVUkzmqKHlvI9cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hFbmdpbmVDb25maWcge1xuICAgICAgICAvKiog5pCc57Si5byV5pOO5ZCN56ewICovXG4gICAgICAgIG5hbWU6IHN0cmluZ1xuICAgICAgICAvKiogVVJM5Lit6KGo56S65YWz6ZSu6K+N55qE5Y+C5pWw5ZCNICovXG4gICAgICAgIGtleXdvcmRQYXJhbTogc3RyaW5nXG4gICAgICAgIC8qKiDnlKjkuo7ljLnphY3mkJzntKLlvJXmk47nmoRVUkzmqKHlvI8gKi9cbiAgICAgICAgdXJsUGF0dGVybjogc3RyaW5nXG59XG5cbi8qKlxuICog5pSv5oyB55qE5pCc57Si5byV5pOO6YWN572u5YiX6KGoXG4gKiDljIXlkKvkuLvmtYHmkJzntKLlvJXmk47nmoTphY3nva7kv6Hmga9cbiAqL1xuZXhwb3J0IGNvbnN0IHNlYXJjaEVuZ2luZXM6IFNlYXJjaEVuZ2luZUNvbmZpZ1tdID0gW1xuICAgICAgICB7IG5hbWU6ICdHb29nbGUnLCBrZXl3b3JkUGFyYW06ICdxJywgdXJsUGF0dGVybjogJy5nb29nbGUuJyB9LFxuICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1lhaG9vJyxcbiAgICAgICAgICAgICAgICBrZXl3b3JkUGFyYW06ICdwJyxcbiAgICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAnc2VhcmNoLnlhaG9vLicsXG4gICAgICAgIH0sXG4gICAgICAgIHsgbmFtZTogJ0JhaWR1Jywga2V5d29yZFBhcmFtOiAnd2QnLCB1cmxQYXR0ZXJuOiAnLmJhaWR1LmNvbScgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdCYWlkdScsXG4gICAgICAgICAgICAgICAga2V5d29yZFBhcmFtOiAnd29yZCcsXG4gICAgICAgICAgICAgICAgdXJsUGF0dGVybjogJy5iYWlkdS5jb20nLFxuICAgICAgICB9LFxuICAgICAgICB7IG5hbWU6ICdCaW5nJywga2V5d29yZFBhcmFtOiAncScsIHVybFBhdHRlcm46ICcuYmluZy5jb20nIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnRHVja0R1Y2tHbycsXG4gICAgICAgICAgICAgICAga2V5d29yZFBhcmFtOiAncScsXG4gICAgICAgICAgICAgICAgdXJsUGF0dGVybjogJ2R1Y2tkdWNrZ28uY29tJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdTb2dvdScsXG4gICAgICAgICAgICAgICAga2V5d29yZFBhcmFtOiAncXVlcnknLFxuICAgICAgICAgICAgICAgIHVybFBhdHRlcm46ICd3d3cuc29nb3UuY29tJyxcbiAgICAgICAgfSxcbiAgICAgICAgeyBuYW1lOiAnV2VpYm8nLCBrZXl3b3JkUGFyYW06ICdxJywgdXJsUGF0dGVybjogJ3Mud2VpYm8uY29tJyB9LFxuICAgICAgICB7IG5hbWU6ICczNjAnLCBrZXl3b3JkUGFyYW06ICdxJywgdXJsUGF0dGVybjogJy5zby5jb20nIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnWWFuZGV4JyxcbiAgICAgICAgICAgICAgICBrZXl3b3JkUGFyYW06ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAneWFuZGV4LmNvbScsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnQ29tbW9uMScsXG4gICAgICAgICAgICAgICAga2V5d29yZFBhcmFtOiAnc2VhcmNoX3F1ZXJ5JyxcbiAgICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAnJyxcbiAgICAgICAgfSwgLy8g6YCa55So5pCc57Si5byV5pOO5Y+C5pWwXG4gICAgICAgIHsgbmFtZTogJ0NvbW1vbjInLCBrZXl3b3JkUGFyYW06ICdrZXl3b3JkJywgdXJsUGF0dGVybjogJycgfSwgLy8g6YCa55So5pCc57Si5byV5pOO5Y+C5pWwXG5dXG5cbi8qKlxuICog5qC55o2uVVJM6I635Y+W5pCc57Si5byV5pOO6YWN572uXG4gKlxuICogQHBhcmFtIHVybCAtIOimgeajgOafpeeahFVSTFxuICogQHJldHVybnMg5Yy56YWN55qE5pCc57Si5byV5pOO6YWN572u77yM5aaC5p6c5rKh5pyJ5Yy56YWN5YiZ6L+U5ZueIG51bGxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNlYXJjaEVuZ2luZUJ5VXJsKHVybDogc3RyaW5nKTogU2VhcmNoRW5naW5lQ29uZmlnIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IGhvc3QgPSBuZXcgVVJMKHVybCkuaG9zdFxuXG4gICAgICAgIGZvciAoY29uc3QgZW5naW5lIG9mIHNlYXJjaEVuZ2luZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZW5naW5lLnVybFBhdHRlcm4gJiYgaG9zdC5pbmNsdWRlcyhlbmdpbmUudXJsUGF0dGVybikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIOS7jlVSTOS4reaPkOWPluaQnOe0ouWFs+mUruivjVxuICpcbiAqIEBwYXJhbSB1cmwgLSDljIXlkKvmkJzntKLlhbPplK7or43nmoRVUkxcbiAqIEByZXR1cm5zIOaPkOWPlueahOaQnOe0ouWFs+mUruivje+8jOWmguaenOayoeacieaJvuWIsOWImei/lOWbniBudWxsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0U2VhcmNoS2V5d29yZHModXJsOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAgICAgY29uc3QgZW5naW5lID0gZ2V0U2VhcmNoRW5naW5lQnlVcmwodXJsKVxuICAgICAgICBpZiAoIWVuZ2luZSkgcmV0dXJuIG51bGxcblxuICAgICAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHVybClcbiAgICAgICAgY29uc3Qga2V5d29yZCA9IHVybE9iai5zZWFyY2hQYXJhbXMuZ2V0KGVuZ2luZS5rZXl3b3JkUGFyYW0pXG4gICAgICAgIHJldHVybiBrZXl3b3JkIHx8IG51bGxcbn1cblxuLyoqXG4gKiDojrflj5bmiYDmnInmlK/mjIHnmoTmkJzntKLlvJXmk47lkI3np7BcbiAqXG4gKiBAcmV0dXJucyDmkJzntKLlvJXmk47lkI3np7DmlbDnu4RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN1cHBvcnRlZFNlYXJjaEVuZ2luZU5hbWVzKCk6IHN0cmluZ1tdIHtcbiAgICAgICAgcmV0dXJuIHNlYXJjaEVuZ2luZXMubWFwKChlbmdpbmUpID0+IGVuZ2luZS5uYW1lKVxufVxuIiwiLyoqXG4gKiDpobXpnaLkv6Hmga/lt6Xlhbflh73mlbBcbiAqXG4gKiDmj5Dkvpvojrflj5bpobXpnaLor63oqIDjgIHmkJzntKLlvJXmk47or4bliKvnrYnlip/og71cbiAqL1xuXG5pbXBvcnQgeyBzZWFyY2hFbmdpbmVzIH0gZnJvbSAnLi9zZWFyY2gnXG5cbmxldCBsYW5nOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuXG4vKipcbiAqIOiOt+WPlumhtemdouivreiogFxuICpcbiAqIOS7jiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZyDojrflj5bpobXpnaLor63oqIDvvIzlpoLmnpzmsqHmnInorr7nva7liJnov5Tlm54gJ2VuJ1xuICog5L2/55So57yT5a2Y5py65Yi26YG/5YWN6YeN5aSN6K6h566XXG4gKlxuICogQHJldHVybnMg6aG16Z2i6K+t6KiA5Luj56CBXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYWdlTGFuZygpOiBzdHJpbmcge1xuICAgICAgICBpZiAobGFuZyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsYW5nXG4gICAgICAgIH1cbiAgICAgICAgbGFuZyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nIHx8ICdlbidcbiAgICAgICAgcmV0dXJuIGxhbmdcbn1cblxuLyoqXG4gKiDliKTmlq3lvZPliY3pobXpnaLmmK/lkKbmmK/mkJzntKLlvJXmk47pobXpnaJcbiAqXG4gKiDpgJrov4fmo4Dmn6XlvZPliY3pobXpnaLnmoTkuLvmnLrlkI3mmK/lkKbljLnphY3lt7Lnn6XnmoTmkJzntKLlvJXmk47mqKHlvI9cbiAqXG4gKiBAcmV0dXJucyDlpoLmnpzmmK/mkJzntKLlvJXmk47pobXpnaLov5Tlm54gdHJ1Ze+8jOWQpuWImei/lOWbniBmYWxzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTZWFyY2hFbmdpbmVQYWdlKCk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBob3N0ID0gd2luZG93LmxvY2F0aW9uLmhvc3RcblxuICAgICAgICBmb3IgKGNvbnN0IGVuZ2luZSBvZiBzZWFyY2hFbmdpbmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVuZ2luZS51cmxQYXR0ZXJuICYmIGhvc3QuaW5jbHVkZXMoZW5naW5lLnVybFBhdHRlcm4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIOiOt+WPluW9k+WJjemhtemdoueahOaQnOe0ouW8leaTjumFjee9rlxuICpcbiAqIEByZXR1cm5zIOWMuemFjeeahOaQnOe0ouW8leaTjumFjee9ru+8jOWmguaenOayoeacieWMuemFjeWImei/lOWbniBudWxsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50U2VhcmNoRW5naW5lKCk6ICh0eXBlb2Ygc2VhcmNoRW5naW5lcylbMF0gfCBudWxsIHtcbiAgICAgICAgY29uc3QgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0XG5cbiAgICAgICAgZm9yIChjb25zdCBlbmdpbmUgb2Ygc2VhcmNoRW5naW5lcykge1xuICAgICAgICAgICAgICAgIGlmIChlbmdpbmUudXJsUGF0dGVybiAmJiBob3N0LmluY2x1ZGVzKGVuZ2luZS51cmxQYXR0ZXJuKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsXG59XG5cbi8qKlxuICog6I635Y+W6aG16Z2i5qCH6aKYXG4gKlxuICogQHJldHVybnMg6aG16Z2i5qCH6aKYXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYWdlVGl0bGUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LnRpdGxlXG59XG5cbi8qKlxuICog6I635Y+W6aG16Z2iVVJMXG4gKlxuICogQHJldHVybnMg6aG16Z2iVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYWdlVXJsKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24uaHJlZlxufVxuIiwiaW1wb3J0IHtcbiAgICAgICAgaW5pdGlhbGl6ZVRyYW5zbGF0ZU9ic2VydmVyLFxuICAgICAgICBzdG9wVHJhbnNsYXRvck9ic2VydmVyLFxufSBmcm9tICcuLi8uLi9vYnNlcnZlci9pbnRlcnNlY3Rpb25PYnNlcnZlci90cmFuc2xhdGVPYnNlcnZlcidcbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tICcuLi9GZWF0dXJlJ1xuaW1wb3J0IHsgcGFnZUxhbmcgfSBmcm9tICcuLi8uLi91dGlscy9wYWdlL2luZm8nXG5cbmV4cG9ydCB0eXBlIFRyYW5zbGF0b3IgPSAnTVMnIHwgJ0cnXG5cbi8qKlxuICog57+76K+R5Yqf6IO9XG4gKi9cbmV4cG9ydCBjbGFzcyBUcmFuc2xhdGVGZWF0dXJlIGV4dGVuZHMgRmVhdHVyZSB7XG4gICAgICAgIHJlYWRvbmx5IG5hbWUgPSAndHJhbnNsYXRlJ1xuICAgICAgICBnZXQgZGVmYXVsdCgpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFnZUxhbmcoKS5zdGFydHNXaXRoKCdlbicpXG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHRyYW5zbGF0b3I6IFRyYW5zbGF0b3IgPSAnTVMnXG4gICAgICAgIHByaXZhdGUgaXNBY3RpdmUgPSBmYWxzZVxuXG4gICAgICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5pbml0VHJhbnNsYXRvcigpXG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkgcmV0dXJuXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5pbml0VHJhbnNsYXRvcigpXG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZVRyYW5zbGF0ZU9ic2VydmVyKClcbiAgICAgICAgICAgICAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMgb2ZmKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc0FjdGl2ZSkgcmV0dXJuXG4gICAgICAgICAgICAgICAgc3RvcFRyYW5zbGF0b3JPYnNlcnZlcigpXG4gICAgICAgICAgICAgICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICAvLyDku6XkuIvmmK/ku44gdHJhbnNsYXRlTWFuYWdlci50cyDov4Hnp7vnmoTlh73mlbBcbiAgICAgICAgcHJpdmF0ZSBhc3luYyBpbml0VHJhbnNsYXRvcigpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RvcmVkVHJhbnNsYXRvciA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHN0b3JhZ2UuZ2V0SXRlbTxUcmFuc2xhdG9yPihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbG9jYWw6dHJhbnNsYXRvcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yZWRUcmFuc2xhdG9yID09PSAnTVMnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JlZFRyYW5zbGF0b3IgPT09ICdHJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNsYXRvciA9IHN0b3JlZFRyYW5zbGF0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRmFpbGVkIHRvIGxvYWQgdHJhbnNsYXRvciBzZXR0aW5nOicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMgc2V0VHJhbnNsYXRvcihuZXdUcmFuc2xhdG9yOiBUcmFuc2xhdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmFuc2xhdG9yID0gbmV3VHJhbnNsYXRvclxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzdG9yYWdlLnNldEl0ZW0oJ2xvY2FsOnRyYW5zbGF0b3InLCBuZXdUcmFuc2xhdG9yKVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdGYWlsZWQgdG8gc2F2ZSB0cmFuc2xhdG9yIHNldHRpbmc6JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBnZXRUcmFuc2xhdG9yKCk6IFRyYW5zbGF0b3Ige1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zbGF0b3JcbiAgICAgICAgfVxufVxuIiwiaW1wb3J0IHsgVHJhbnNsYXRlRmVhdHVyZSwgVHJhbnNsYXRvciB9IGZyb20gJy4vVHJhbnNsYXRlRmVhdHVyZSdcblxuLy8g5Yib5bu65YWo5bGA5a6e5L6L77yI5Y2V5L6L77yJXG5jb25zdCB0cmFuc2xhdGVGZWF0dXJlID0gbmV3IFRyYW5zbGF0ZUZlYXR1cmUoKVxuXG4vLyDlvZPliY3nv7vor5Hlmajlj5jph4/vvIzkuI4gdHJhbnNsYXRlRmVhdHVyZSDlkIzmraVcbmxldCBjdXJyZW50VHJhbnNsYXRvcjogVHJhbnNsYXRvciA9ICdNUydcblxuLy8g5Yid5aeL5YyW57+76K+R5Zmo6K6+572u77yI5byC5q2l77yJXG50cmFuc2xhdGVGZWF0dXJlXG4gICAgICAgIC5pbml0KClcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRUcmFuc2xhdG9yID0gdHJhbnNsYXRlRmVhdHVyZS5nZXRUcmFuc2xhdG9yKClcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCgpID0+IHt9KVxuXG4vLyDph43mlrDlr7zlh7rnsbvlnovlkozlh73mlbBcbmV4cG9ydCB0eXBlIHsgVHJhbnNsYXRvciB9XG5leHBvcnQgY29uc3QgdHJhbnNsYXRvcjogVHJhbnNsYXRvciA9IGN1cnJlbnRUcmFuc2xhdG9yIC8vIOWvvOWHuuWPmOmHj++8jOS9huazqOaEj+i/meaYr+mdmeaAgeeahO+8m+S9v+eUqCBnZXRUcmFuc2xhdG9yKCkg6I635Y+W5pyA5paw5YC8XG5cbi8vIOiuvue9rue/u+ivkeWZqFxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFRyYW5zbGF0b3IobmV3VHJhbnNsYXRvcjogVHJhbnNsYXRvcikge1xuICAgICAgICBhd2FpdCB0cmFuc2xhdGVGZWF0dXJlLnNldFRyYW5zbGF0b3IobmV3VHJhbnNsYXRvcilcbiAgICAgICAgY3VycmVudFRyYW5zbGF0b3IgPSBuZXdUcmFuc2xhdG9yXG59XG5cbi8vIOiOt+WPluW9k+WJjee/u+ivkeWZqFxuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zbGF0b3IoKTogVHJhbnNsYXRvciB7XG4gICAgICAgIHJldHVybiB0cmFuc2xhdGVGZWF0dXJlLmdldFRyYW5zbGF0b3IoKVxufVxuXG4vLyDku6XkuIvlh73mlbDkuLrkuoblhbzlrrnmgKfkv53nlZnvvIzkvYblrp7pmYXosIPnlKjkvJrlp5TmiZjnu5kgdHJhbnNsYXRlRmVhdHVyZVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wZW5UcmFuc2xhdGUoKSB7XG4gICAgICAgIGF3YWl0IHRyYW5zbGF0ZUZlYXR1cmUub24oKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcFRyYW5zbGF0ZSgpIHtcbiAgICAgICAgdHJhbnNsYXRlRmVhdHVyZS5vZmYoKVxufVxuIiwiaW1wb3J0IHsgZ2V0U2V0dGluZyB9IGZyb20gJy4uLy4uL3NldHRpbmdNYW5hZ2VyJ1xuXG5jb25zdCBFWENMVURFX1RBR1MgPSBbXG4gICAgICAgICdTQ1JJUFQnLFxuICAgICAgICAnU1RZTEUnLFxuICAgICAgICAnTk9TQ1JJUFQnLFxuICAgICAgICAnU1ZHJyxcbiAgICAgICAgJ1ZBUicsXG4gICAgICAgICdLQkQnLFxuICAgICAgICAnSU5QVVQnLFxuICAgICAgICAnUFJFJyxcbiAgICAgICAgJ1RFWFRBUkVBJyxcbiAgICAgICAgJ0lOUFVUJyxcbl1cblxuLy8g5YWo5bGA5qCH6K6w77yM55So5LqO6K6w5b2V5bey57uP6KKr5o6S6Zmk57+76K+R55qE5YWD57SgXG5jb25zdCBleGNsdWRlZEVsZW1lbnRzID0gbmV3IFdlYWtTZXQ8SFRNTEVsZW1lbnQ+KClcblxuY29uc3QgRVhDTFVERV9DTEFTU0VTID0gWydjb2RlLWxpbmUnLCAnYW5jaG9yLWNvbnRhaW5lciddXG5cbi8qKlxuICog5qOA5p+l5Y2V5Liq5YWD57Sg5piv5ZCm5bqU6K+l6KKr5o6S6Zmk57+76K+RXG4gKi9cbmZ1bmN0aW9uIGlzRWxlbWVudEV4Y2x1ZGFibGUoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICAgICAgLy8g5qOA5p+l5YWD57Sg5pys6Lqr5piv5ZCm5piv5o6S6Zmk5qCH562+XG4gICAgICAgIGlmIChFWENMVURFX1RBR1MuaW5jbHVkZXMoZWxlbWVudC50YWdOYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmo4Dmn6XlhYPntKDmmK/lkKblhbfmnInmjpLpmaTnmoTnsbvlkI1cbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xhc3NMaXN0ID0gZWxlbWVudC5jbGFzc05hbWUuc3BsaXQoJyAnKVxuICAgICAgICAgICAgICAgIGlmIChFWENMVURFX0NMQVNTRVMuc29tZSgoY2xzKSA9PiBjbGFzc0xpc3QuaW5jbHVkZXMoY2xzKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qOA5p+l5YWD57Sg5piv5ZCm5YW35pyJIGNvbnRlbnRlZGl0YWJsZSDlsZ7mgKdcbiAgICAgICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKCdjb250ZW50ZWRpdGFibGUnKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVkaXRhYmxlVmFsdWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJylcbiAgICAgICAgICAgICAgICAvLyBjb250ZW50ZWRpdGFibGUg5Li6IHRydWUg5oiW56m65a2X56ym5Liy5pe277yM5YWD57Sg5Y+v57yW6L6RXG4gICAgICAgICAgICAgICAgaWYgKGVkaXRhYmxlVmFsdWUgPT09ICd0cnVlJyB8fCBlZGl0YWJsZVZhbHVlID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiDmo4Dmn6XlhYPntKDmiJblhbbnpZblhYjmmK/lkKblnKjmjpLpmaTmoIfnrb7lhoVcbiAqIOi/meS4quaWueazleehruS/nee/u+ivkeihjOS4uuS4jkRPTee7k+aehOmhuuW6j+aXoOWFs1xuICovXG5mdW5jdGlvbiBpc0VsZW1lbnRFeGNsdWRlZChlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgICAgICAvLyDlpoLmnpzlt7Lnu4/lnKjmjpLpmaTpm4blkIjkuK3vvIznm7TmjqXov5Tlm55cbiAgICAgICAgaWYgKGV4Y2x1ZGVkRWxlbWVudHMuaGFzKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOajgOafpeWFg+e0oOacrOi6q+aYr+WQpuW6lOivpeiiq+aOkumZpFxuICAgICAgICBpZiAoaXNFbGVtZW50RXhjbHVkYWJsZShlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIGV4Y2x1ZGVkRWxlbWVudHMuYWRkKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOajgOafpeelluWFiOWFg+e0oOmTvuS4reaYr+WQpuacieaOkumZpOagh+etvlxuICAgICAgICBsZXQgcGFyZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50XG4gICAgICAgIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50ICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRWxlbWVudEV4Y2x1ZGFibGUocGFyZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhjbHVkZWRFbGVtZW50cy5hZGQoZWxlbWVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiDku47mjIflrprnmoRIVE1M5YWD57Sg5Lit5o+Q5Y+W5omA5pyJ5pyq6KKr5o6S6Zmk55qE5paH5pys6IqC54K55YaF5a6544CCXG4gKiDor6Xlh73mlbDkvJrpgJLlvZLpgY3ljoblhYPntKDnmoTmiYDmnInlrZDoioLngrnvvIzmjpLpmaTnibnlrprniLbmoIfnrb7kuIvnmoTmlofmnKzoioLngrnvvIxcbiAqIOW5tuWQiOW5tuWJqeS9meeahOacieaViOaWh+acrOeJh+auteOAglxuICpcbiAqIEBwYXJhbSBlbGVtZW50IC0g5qC5SFRNTOWFg+e0oO+8jOS9nOS4uuaWh+acrOaPkOWPlueahOi1t+Wni+iKgueCuVxuICogQHJldHVybnMgUHJvbWlzZTxzdHJpbmc+IC0g5ZCI5bm25ZCO55qE57qv5paH5pys5a2X56ym5Liy77yM5bey56e76Zmk5omA5pyJ5o2i6KGM56ymXG4gKi9cbi8vIOmihOiuoeeul+eahOaOkumZpOWFg+e0oOaYoOWwhO+8jOeUqOS6juW/q+mAn+afpeaJvlxuY29uc3QgZXhjbHVkZWRBbmNlc3RvcnMgPSBuZXcgV2Vha1NldDxIVE1MRWxlbWVudD4oKVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFRleHRGcmFnbWVudHMoXG4gICAgICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50XG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyDpppblhYjmo4Dmn6XlhYPntKDmmK/lkKbooqvmjpLpmaRcbiAgICAgICAgaWYgKGlzRWxlbWVudEV4Y2x1ZGVkKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnXG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5L2/55So5LyY5YyW55qEVHJlZVdhbGtlcumBjeWOhuaJgOacieaWh+acrOiKgueCuVxuICAgICAgICAgKiDkv53mjIHljp/mnInpgLvovpHkuI3lj5jvvIzkvYbkvJjljJbpgY3ljobmgKfog71cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IHdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIoXG4gICAgICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgICAgICBOb2RlRmlsdGVyLlNIT1dfVEVYVCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NlcHROb2RlOiAobm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlv6vpgJ/mo4Dmn6XvvJrlpoLmnpzniLblhYPntKDlnKjpooTorqHnrpfnmoTmjpLpmaTmmKDlsITkuK3vvIznm7TmjqXmi5Lnu51cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnRFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgZXhjbHVkZWRBbmNlc3RvcnMuaGFzKHBhcmVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfUkVKRUNUXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDkv53mjIHljp/mnInnmoTniLblhYPntKDpk77mo4Dmn6XpgLvovpFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJlbnRQYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ICE9PSBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVYQ0xVREVfVEFHUy5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhcmVudC50YWdOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlsIbmjpLpmaTnmoTnpZblhYjmt7vliqDliLDpooTorqHnrpfmmKDlsITkuK3vvIzkvpvlkI7nu63lv6vpgJ/mo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGVkQW5jZXN0b3JzLmFkZChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE5vZGVGaWx0ZXIuRklMVEVSX1JFSkVDVFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQucGFyZW50RWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBOb2RlRmlsdGVyLkZJTFRFUl9BQ0NFUFRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICApXG5cbiAgICAgICAgLy8g5pS26ZuG5pyJ5pWI5paH5pys54mH5q6155qE5pWw57uEXG4gICAgICAgIGNvbnN0IHRleHRGcmFnbWVudHM6IHN0cmluZ1tdID0gW11cblxuICAgICAgICAvKipcbiAgICAgICAgICog6YGN5Y6G5omA5pyJ6YCa6L+H6L+H5ruk55qE5paH5pys6IqC54K577yaXG4gICAgICAgICAqIDEuIOenu+mZpOaWh+acrOS4reeahOaNouihjOesplxuICAgICAgICAgKiAyLiDov4fmu6TnqbrlrZfnrKbkuLJcbiAgICAgICAgICogMy4g5bCG5pyJ5pWI5paH5pys5Yqg5YWl57uT5p6c5pWw57uEXG4gICAgICAgICAqL1xuICAgICAgICBsZXQgY3VycmVudE5vZGU6IE5vZGUgfCBudWxsID0gd2Fsa2VyLm5leHROb2RlKClcbiAgICAgICAgd2hpbGUgKGN1cnJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50Py5yZXBsYWNlKC9cXG4vZywgJycpLnRyaW0oKVxuICAgICAgICAgICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RnJhZ21lbnRzLnB1c2godGV4dClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VycmVudE5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5ZCI5bm25omA5pyJ5paH5pys54mH5q615bm26L+U5Zue5pyA57uI57uT5p6cXG4gICAgICAgIHJldHVybiB0ZXh0RnJhZ21lbnRzLmpvaW4oJycpXG59XG5cbi8qKlxuICog5LyY5YyW5paH5pys5qOA5rWL77ya5re75Yqg6ZW/5bqm5qOA5p+l5ZKM5pu057K+56Gu55qE6Iux5paH5qOA5rWLXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRTa2lwVHJhbnNsYXRpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghdGV4dCB8fCB0ZXh0Lmxlbmd0aCA8IDIpIHJldHVybiB0cnVlXG5cbiAgICAgICAgLy8g5LyY5YyW5q2j5YiZ6KGo6L6+5byP77yM5Y+q5qOA5p+l5piv5ZCm5YyF5ZCr6Iux5paH5a2X5q+NXG4gICAgICAgIGNvbnN0IEVOX0xFVFRFUl9SRUdFWCA9IC9bYS16QS1aXS9cbiAgICAgICAgcmV0dXJuICFFTl9MRVRURVJfUkVHRVgudGVzdCh0ZXh0KVxufVxuXG4vKipcbiAqIOajgOafpeaYr+WQpuW6lOivpei3s+i/h+WFg+e0oOe/u+ivkVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkU2tpcEVsZW1lbnRUcmFuc2xhdGlvbihlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgICAgICAvLyDmj5DliY3mo4Dmn6Xorr7nva7vvIzpgb/lhY3kuI3lv4XopoHnmoTlpITnkIZcbiAgICAgICAgaWYgKGdldFNldHRpbmcoKS50cmFuc2xhdGUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmqjOivgeWPguaVsOacieaViOaAp1xuICAgICAgICBpZiAoIShlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOajgOafpeaYr+WQpuW3sue7j+aciee/u+ivkee7k+aenFxuICAgICAgICBpZiAoZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcudHJhbnNsYXRpb24tcmVzdWx0JykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCduby10cmFuc2xhdGUnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmo4Dmn6XlhYPntKDmmK/lkKbooqvmjpLpmaRcbiAgICAgICAgaWYgKGlzRWxlbWVudEV4Y2x1ZGVkKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxufVxuXG4vLyDpooTlpITnkIbnmoTmoLnlhYPntKDorrDlvZXvvIzpgb/lhY3ph43lpI3lpITnkIZcbmNvbnN0IHByb2Nlc3NlZFJvb3RzID0gbmV3IFdlYWtTZXQ8RWxlbWVudD4oKVxuXG4vKipcbiAqIOaJuemHj+mihOWkhOeQhuWFg+e0oO+8jOagh+iusOaJgOacieW6lOivpeaOkumZpOe/u+ivkeeahOWFg+e0oFxuICog5a6M5YWo6YG/5YWN6YGN5Y6G5pW05Liq5paH5qGj77yM6YeH55So5oyJ6ZyA5aSE55CG5ZKM5aKe6YeP5pu05paw562W55WlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmVwcm9jZXNzRXhjbHVkZWRFbGVtZW50cyhcbiAgICAgICAgcm9vdDogRWxlbWVudCA9IGRvY3VtZW50LmJvZHlcbik6IHZvaWQge1xuICAgICAgICAvLyDlpoLmnpzlt7Lnu4/lpITnkIbov4fov5nkuKrmoLnlhYPntKDvvIzliJnot7Pov4dcbiAgICAgICAgaWYgKHByb2Nlc3NlZFJvb3RzLmhhcyhyb290KSkge1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5L2/55So57K+56Gu55qE6YCJ5oup5Zmo5Y+q6I635Y+W6ZyA6KaB5o6S6Zmk55qE5YWD57Sg57G75Z6L77yM6YG/5YWN5YWo5paH5qGj6YGN5Y6GXG4gICAgICAgIGNvbnN0IGV4Y2x1ZGVTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAgICAgLy8g5o6S6Zmk5qCH562+XG4gICAgICAgICAgICAgICAgLi4uRVhDTFVERV9UQUdTLm1hcCgodGFnKSA9PiB0YWcudG9Mb3dlckNhc2UoKSksXG4gICAgICAgICAgICAgICAgLy8g5Y+v57yW6L6R5YWD57SgXG4gICAgICAgICAgICAgICAgJ1tjb250ZW50ZWRpdGFibGU9XCJ0cnVlXCJdJyxcbiAgICAgICAgICAgICAgICAnW2NvbnRlbnRlZGl0YWJsZT1cIlwiXScsXG4gICAgICAgICAgICAgICAgLy8g5o6S6Zmk57G7XG4gICAgICAgICAgICAgICAgLi4uRVhDTFVERV9DTEFTU0VTLm1hcCgoY2xzKSA9PiBgLiR7Y2xzfWApLFxuICAgICAgICBdLmpvaW4oJywnKVxuXG4gICAgICAgIC8vIOWPquafpeivoumcgOimgeaOkumZpOeahOWFg+e0oO+8jOiAjOS4jeaYr+aJgOacieWFg+e0oFxuICAgICAgICBjb25zdCBkaXJlY3RFeGNsdWRlZEVsZW1lbnRzID0gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKGV4Y2x1ZGVTZWxlY3RvcnMpXG5cbiAgICAgICAgLy8g5qCH6K6w55u05o6l5o6S6Zmk55qE5YWD57SgXG4gICAgICAgIGRpcmVjdEV4Y2x1ZGVkRWxlbWVudHMuZm9yRWFjaCgoZWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBodG1sRWwgPSBlbCBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICAgIGV4Y2x1ZGVkRWxlbWVudHMuYWRkKGh0bWxFbClcbiAgICAgICAgICAgICAgICBleGNsdWRlZEFuY2VzdG9ycy5hZGQoaHRtbEVsKVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIOS9v+eUqOWinumHj+WkhOeQhuetlueVpe+8muWPquWkhOeQhuWPr+ingeWMuuWfn+eahOWFg+e0oFxuICAgICAgICAvLyDlr7nkuo7lpKflnovmlofmoaPvvIzmiJHku6zlj6rpooTlpITnkIbpppblsY/lhoXlrrnvvIzlhbbkvZnpg6jliIbmjInpnIDlpITnkIZcbiAgICAgICAgaWYgKHJvb3QgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgICAgICAvLyDkvb/nlKhJbnRlcnNlY3Rpb25PYnNlcnZlcuadpeW7tui/n+WkhOeQhuinhuWPo+WklueahOWFg+e0oFxuICAgICAgICAgICAgICAgIGNvbnN0IGxhenlPYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIChlbnRyaWVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJpZXMuZm9yRWFjaCgoZW50cnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50cnkuaXNJbnRlcnNlY3RpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeS50YXJnZXQgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWvueS6jui/m+WFpeinhuWPo+eahOWFg+e0oO+8jOajgOafpeaYr+WQpumcgOimgeaOkumZpFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0VsZW1lbnRFeGNsdWRhYmxlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGVkRWxlbWVudHMuYWRkKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGNsdWRlZEFuY2VzdG9ycy5hZGQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXp5T2JzZXJ2ZXIudW5vYnNlcnZlKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdE1hcmdpbjogJzUwcHgnLCAvLyDmj5DliY01MHB45byA5aeL6KeC5a+fXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgLy8g5Y+q6KeC5a+f55u05o6l5a2Q5YWD57Sg5Lit55qE5r2c5Zyo5o6S6Zmk5YWD57Sg77yM6YG/5YWN5oCn6IO95byA6ZSAXG4gICAgICAgICAgICAgICAgY29uc3QgcG90ZW50aWFsRWxlbWVudHMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJyonKVxuICAgICAgICAgICAgICAgIC8vIOmZkOWItuWIneWni+inguWvn+aVsOmHj++8jOmBv+WFjeaAp+iDvemXrumimFxuICAgICAgICAgICAgICAgIGNvbnN0IG1heEluaXRpYWxPYnNlcnZlID0gMTAwXG4gICAgICAgICAgICAgICAgZm9yIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgPFxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4ocG90ZW50aWFsRWxlbWVudHMubGVuZ3RoLCBtYXhJbml0aWFsT2JzZXJ2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpKytcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gcG90ZW50aWFsRWxlbWVudHNbaV0gYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW/q+mAn+ajgOafpeaYr+WQpumcgOimgeinguWvn1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFWENMVURFX1RBR1MuaW5jbHVkZXMoZWwudGFnTmFtZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwuaGFzQXR0cmlidXRlKCdjb250ZW50ZWRpdGFibGUnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFWENMVURFX0NMQVNTRVMuc29tZSgoY2xzKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5jb250YWlucyhjbHMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXp5T2JzZXJ2ZXIub2JzZXJ2ZShlbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmoIforrDov5nkuKrmoLnlhYPntKDkuLrlt7LlpITnkIZcbiAgICAgICAgcHJvY2Vzc2VkUm9vdHMuYWRkKHJvb3QpXG59XG4iLCIvKipcbiAqIOe/u+ivkeebuOWFs+W3peWFt+WHveaVsFxuICpcbiAqIOaPkOS+m+aWh+acrOe/u+ivkeebuOWFs+eahOWKn+iDvVxuICovXG5cbi8qKlxuICog5Yik5pat5paH5pys5piv5ZCm5bqU6K+l6Lez6L+H57+76K+RXG4gKlxuICogQHBhcmFtIHRleHQgLSDopoHmo4Dmn6XnmoTmlofmnKxcbiAqIEByZXR1cm5zIOWmguaenOW6lOivpei3s+i/h+e/u+ivkei/lOWbniB0cnVl77yM5ZCm5YiZ6L+U5ZueIGZhbHNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRTa2lwVHJhbnNsYXRpb24odGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghdGV4dCB8fCB0ZXh0Lmxlbmd0aCA8IDIpIHJldHVybiB0cnVlXG5cbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5Li657qv5pWw5a2X5oiW56ym5Y+3XG4gICAgICAgIGlmICgvXltcXGRcXHNcXC1cXCtcXC5cXCxdKyQvLnRlc3QodGV4dCkpIHJldHVybiB0cnVlXG5cbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5Li6IFVSTCDmiJbmlofku7bot6/lvoRcbiAgICAgICAgaWYgKC9eKGh0dHBzPzpcXC9cXC98ZnRwOlxcL1xcL3xmaWxlOlxcL1xcL3x3d3dcXC58XFwvW1xcd1xcL10pL2kudGVzdCh0ZXh0KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIC8vIOajgOafpeaYr+WQpuS4uumCrueuseWcsOWdgFxuICAgICAgICBpZiAoL15bXFx3XFwuXFwtXStAW1xcd1xcLlxcLV0rXFwuXFx3KyQvLnRlc3QodGV4dCkpIHJldHVybiB0cnVlXG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICog5Yik5pat5YWD57Sg5piv5ZCm5bqU6K+l6Lez6L+H57+76K+RXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgLSDopoHmo4Dmn6XnmoTlhYPntKBcbiAqIEByZXR1cm5zIOWmguaenOW6lOivpei3s+i/h+e/u+ivkei/lOWbniB0cnVl77yM5ZCm5YiZ6L+U5ZueIGZhbHNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRTa2lwRWxlbWVudFRyYW5zbGF0aW9uKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgICAgIC8vIOaPkOWJjeajgOafpeiuvue9ru+8jOmBv+WFjeS4jeW/heimgeeahOWkhOeQhlxuICAgICAgICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKClcblxuICAgICAgICAvLyDmjpLpmaTnibnlrprmoIfnrb5cbiAgICAgICAgY29uc3QgZXhjbHVkZWRUYWdzID0gbmV3IFNldChbXG4gICAgICAgICAgICAgICAgJ3NjcmlwdCcsXG4gICAgICAgICAgICAgICAgJ3N0eWxlJyxcbiAgICAgICAgICAgICAgICAnbm9zY3JpcHQnLFxuICAgICAgICAgICAgICAgICd0ZW1wbGF0ZScsXG4gICAgICAgICAgICAgICAgJ2NvZGUnLFxuICAgICAgICAgICAgICAgICdwcmUnLFxuICAgICAgICAgICAgICAgICdrYmQnLFxuICAgICAgICAgICAgICAgICdzYW1wJyxcbiAgICAgICAgICAgICAgICAndmFyJyxcbiAgICAgICAgXSlcblxuICAgICAgICBpZiAoZXhjbHVkZWRUYWdzLmhhcyh0YWdOYW1lKSkgcmV0dXJuIHRydWVcblxuICAgICAgICAvLyDmo4Dmn6XlhYPntKDmmK/lkKbpmpDol49cbiAgICAgICAgY29uc3Qgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KVxuICAgICAgICBpZiAoc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnIHx8IHN0eWxlLnZpc2liaWxpdHkgPT09ICdoaWRkZW4nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOajgOafpeaYr+WQpuS4uui+k+WFpeWFg+e0oFxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgfHxcbiAgICAgICAgICAgICAgICBlbGVtZW50IGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudFxuICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICog6aKE5aSE55CG5o6S6Zmk5YWD57SgXG4gKlxuICogQHBhcmFtIHJvb3QgLSDmoLnlhYPntKDvvIzpu5jorqTkuLogZG9jdW1lbnQuYm9keVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJlcHJvY2Vzc0V4Y2x1ZGVkRWxlbWVudHMoXG4gICAgICAgIHJvb3Q6IEVsZW1lbnQgPSBkb2N1bWVudC5ib2R5XG4pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgRVhDTFVERV9UQUdTID0gbmV3IFNldChbXG4gICAgICAgICAgICAgICAgJ1NDUklQVCcsXG4gICAgICAgICAgICAgICAgJ1NUWUxFJyxcbiAgICAgICAgICAgICAgICAnTk9TQ1JJUFQnLFxuICAgICAgICAgICAgICAgICdTVkcnLFxuICAgICAgICAgICAgICAgICdNQVRIJyxcbiAgICAgICAgICAgICAgICAnVkFSJyxcbiAgICAgICAgICAgICAgICAnU0FNUCcsXG4gICAgICAgICAgICAgICAgJ0tCRCcsXG4gICAgICAgICAgICAgICAgJ1BSRScsXG4gICAgICAgICAgICAgICAgJ1RFWFRBUkVBJyxcbiAgICAgICAgICAgICAgICAnSU5QVVQnLFxuICAgICAgICAgICAgICAgICdDT0RFJyxcbiAgICAgICAgXSlcblxuICAgICAgICBjb25zdCBhbGxFbGVtZW50cyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCgnKicpXG5cbiAgICAgICAgYWxsRWxlbWVudHMuZm9yRWFjaCgoZWwpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YWdOYW1lID0gZWwudGFnTmFtZS50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICAgaWYgKEVYQ0xVREVfVEFHUy5oYXModGFnTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOi/memHjOWPr+S7pea3u+WKoOaOkumZpOWFg+e0oOeahOWkhOeQhumAu+i+kVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbn1cblxuLyoqXG4gKiDmuIXpmaTmjpLpmaTnvJPlrZhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyRXhjbHVzaW9uQ2FjaGUoKTogdm9pZCB7XG4gICAgICAgIC8vIFdlYWtTZXQg5Lya6Ieq5Yqo5Z6D5Zy+5Zue5pS277yM5oiR5Lus5Y+q6ZyA6KaB5Yib5bu65LiA5Liq5paw55qEXG4gICAgICAgIC8vIOi/memHjOWPr+S7pea3u+WKoOe8k+WtmOa4heeQhumAu+i+kVxufVxuXG4vKipcbiAqIOaPkOWPluaWh+acrOeJh+autei/m+ihjOe/u+ivkVxuICpcbiAqIEBwYXJhbSBlbGVtZW50IC0g6KaB5o+Q5Y+W5paH5pys55qE5YWD57SgXG4gKiBAcmV0dXJucyDmlofmnKzniYfmrrXmlbDnu4RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUZXh0RnJhZ21lbnRzKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogc3RyaW5nW10ge1xuICAgICAgICBjb25zdCBmcmFnbWVudHM6IHN0cmluZ1tdID0gW11cbiAgICAgICAgY29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihcbiAgICAgICAgICAgICAgICBlbGVtZW50LFxuICAgICAgICAgICAgICAgIE5vZGVGaWx0ZXIuU0hPV19URVhULFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdE5vZGU6IChub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBub2RlLnRleHRDb250ZW50Py50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0ZXh0IHx8IHNob3VsZFNraXBUcmFuc2xhdGlvbih0ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBOb2RlRmlsdGVyLkZJTFRFUl9SRUpFQ1RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfQUNDRVBUXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgKVxuXG4gICAgICAgIGxldCBub2RlOiBOb2RlIHwgbnVsbFxuICAgICAgICB3aGlsZSAoKG5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gbm9kZS50ZXh0Q29udGVudD8udHJpbSgpXG4gICAgICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoKHRleHQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZyYWdtZW50c1xufVxuXG4vKipcbiAqIOaJuemHj+e/u+ivkeaWh+acrFxuICpcbiAqIEBwYXJhbSB0ZXh0cyAtIOimgee/u+ivkeeahOaWh+acrOaVsOe7hFxuICogQHBhcmFtIHRyYW5zbGF0b3IgLSDnv7vor5Hlmajlh73mlbBcbiAqIEByZXR1cm5zIOe/u+ivkee7k+aenOaVsOe7hFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmF0Y2hUcmFuc2xhdGVUZXh0cyhcbiAgICAgICAgdGV4dHM6IHN0cmluZ1tdLFxuICAgICAgICB0cmFuc2xhdG9yOiAodGV4dDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz5cbik6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0czogc3RyaW5nW10gPSBbXVxuXG4gICAgICAgIGZvciAoY29uc3QgdGV4dCBvZiB0ZXh0cykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2xhdGVkID0gYXdhaXQgdHJhbnNsYXRvcih0ZXh0KVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHRyYW5zbGF0ZWQpXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybihg57+76K+R5aSx6LSlOiAke3RleHR9YCwgZXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2godGV4dCkgLy8g5aSx6LSl5pe26L+U5Zue5Y6f5paHXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcbn1cblxuLyoqXG4gKiDliJvlu7rnv7vor5HlrrnlmajlhYPntKBcbiAqXG4gKiBAcGFyYW0gb3JpZ2luYWxUZXh0IC0g5Y6f5paHXG4gKiBAcGFyYW0gdHJhbnNsYXRlZFRleHQgLSDor5HmlodcbiAqIEBwYXJhbSBzaG91bGRXcmFwIC0g5piv5ZCm5L2/55So6KGM5YaF5a655ZmoXG4gKiBAcmV0dXJucyDnv7vor5HlrrnlmajlhYPntKBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zbGF0aW9uQ29udGFpbmVyKFxuICAgICAgICBvcmlnaW5hbFRleHQ6IHN0cmluZyxcbiAgICAgICAgdHJhbnNsYXRlZFRleHQ6IHN0cmluZyxcbiAgICAgICAgc2hvdWxkV3JhcDogYm9vbGVhblxuKTogSFRNTEVsZW1lbnQge1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ2JyZWFkLXRyYW5zbGF0aW9uLWNvbnRhaW5lcidcblxuICAgICAgICBpZiAoc2hvdWxkV3JhcCkge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSdcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRyYW5zbGF0aW9uRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICAgICAgICB0cmFuc2xhdGlvbkVsZW1lbnQuY2xhc3NOYW1lID0gJ2JyZWFkLXRyYW5zbGF0aW9uJ1xuICAgICAgICB0cmFuc2xhdGlvbkVsZW1lbnQudGV4dENvbnRlbnQgPSB0cmFuc2xhdGVkVGV4dFxuXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0cmFuc2xhdGlvbkVsZW1lbnQpXG4gICAgICAgIHJldHVybiBjb250YWluZXJcbn1cblxuLy8g6aG555uu5Lit5L2/55So55qE5bi46YePXG5jb25zdCBVUkxfR09PR0xFX1RSQU4gPSAnaHR0cHM6Ly90cmFuc2xhdGUuZ29vZ2xlYXBpcy5jb20vdHJhbnNsYXRlX2Evc2luZ2xlJ1xuXG4vLyDnlJ/miJDosLfmrYznv7vor5Hor7fmsYJcbmNvbnN0IGdlbkdvb2dsZSA9ICh7XG4gICAgICAgIHRleHQsXG4gICAgICAgIGZyb20sXG4gICAgICAgIHRvLFxuICAgICAgICB1cmwgPSBVUkxfR09PR0xFX1RSQU4sXG59OiB7XG4gICAgICAgIHRleHQ6IHN0cmluZ1xuICAgICAgICBmcm9tOiBzdHJpbmdcbiAgICAgICAgdG86IHN0cmluZ1xuICAgICAgICB1cmw/OiBzdHJpbmdcbn0pID0+IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGNsaWVudDogJ2d0eCcsXG4gICAgICAgICAgICAgICAgZHQ6ICd0JyxcbiAgICAgICAgICAgICAgICBkajogJzEnLFxuICAgICAgICAgICAgICAgIGllOiAnVVRGLTgnLFxuICAgICAgICAgICAgICAgIHNsOiBmcm9tLFxuICAgICAgICAgICAgICAgIHRsOiB0byxcbiAgICAgICAgICAgICAgICBxOiB0ZXh0LFxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlucHV0ID0gYCR7dXJsfT8ke25ldyBVUkxTZWFyY2hQYXJhbXMocGFyYW1zKS50b1N0cmluZygpfWBcbiAgICAgICAgY29uc3QgaW5pdCA9IHtcbiAgICAgICAgICAgICAgICAvLyBHRVTor7fmsYLkuI3pnIDopoFDb250ZW50LVR5cGXlpLRcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IGlucHV0LCBpbml0IH1cbn1cblxuLy8g5Y+R6YCBSFRUUOivt+axglxuY29uc3QgZmV0Y2hUcmFuc2xhdGlvbiA9IGFzeW5jICh1cmw6IHN0cmluZywgaW5pdDogUmVxdWVzdEluaXQpID0+IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIGluaXQpXG4gICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgZXJyb3IhIHN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9YClcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKClcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBKU09OIGZyb20gcmVzcG9uc2U6JywgZXJyb3IpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0ZhaWxlZCB0byBmZXRjaCB0cmFuc2xhdGlvbiwgaW52YWxpZCBKU09OIHJlc3BvbnNlLidcbiAgICAgICAgICAgICAgICApXG4gICAgICAgIH1cbn1cblxuLy8g6LC35q2M57+76K+R5Ye95pWwXG5leHBvcnQgY29uc3QgdHJhbnNsYXRlQ29udGVudEdvb2dsZSA9IGFzeW5jIChcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmcm9tOiBzdHJpbmcgPSAnZW4nLFxuICAgICAgICB0bzogc3RyaW5nXG4pID0+IHtcbiAgICAgICAgY29uc3QgeyBpbnB1dCwgaW5pdCB9ID0gZ2VuR29vZ2xlKHsgdGV4dCwgZnJvbSwgdG8gfSlcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGZldGNoVHJhbnNsYXRpb24oaW5wdXQsIGluaXQpXG4gICAgICAgIC8vIOino+aekOe/u+ivkee7k+aenFxuICAgICAgICBjb25zdCB0cmFuc2xhdGVkVGV4dCA9IGRhdGEuc2VudGVuY2VzPy5bMF0/LnRyYW5zIHx8ICcnXG4gICAgICAgIHJldHVybiB0cmFuc2xhdGVkVGV4dFxufVxuXG4vLyDlvq7ova/nv7vor5Hnm7jlhbPmjqXlj6PlkozluLjph49cbmludGVyZmFjZSBNaWNyb3NvZnRBdXRoVG9rZW4ge1xuICAgICAgICB2YWx1ZTogc3RyaW5nXG4gICAgICAgIGV4cGlyYXRpb25UaW1lc3RhbXA6IG51bWJlclxufVxuXG5pbnRlcmZhY2UgVHJhbnNsYXRpb25SZXF1ZXN0IHtcbiAgICAgICAgY29udGVudDogc3RyaW5nXG4gICAgICAgIHNvdXJjZUxhbmc/OiBzdHJpbmdcbiAgICAgICAgdGFyZ2V0TGFuZz86IHN0cmluZ1xufVxuXG5jb25zdCBNSUNST1NPRlRfQVVUSF9FTkRQT0lOVCA9ICdodHRwczovL2VkZ2UubWljcm9zb2Z0LmNvbS90cmFuc2xhdGUvYXV0aCdcbmNvbnN0IE1JQ1JPU09GVF9UUkFOU0xBVEVfQVBJX1VSTCA9XG4gICAgICAgICdodHRwczovL2FwaS1lZGdlLmNvZ25pdGl2ZS5taWNyb3NvZnR0cmFuc2xhdG9yLmNvbS90cmFuc2xhdGUnXG5cbi8qKlxuICog6Kej56CBSldU5Luk54mM5bm25o+Q5Y+W6L+H5pyf5pe26Ze05oizXG4gKi9cbmNvbnN0IGRlY29kZUF1dGhUb2tlbkV4cGlyYXRpb24gPSAodG9rZW46IHN0cmluZyk6IG51bWJlciA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoYXRvYih0b2tlbi5zcGxpdCgnLicpWzFdKSkuZXhwXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVG9rZW4gZGVjb2RpbmcgZmFpbGVkOicsIGVycm9yKVxuICAgICAgICAgICAgICAgIHJldHVybiBEYXRlLm5vdygpXG4gICAgICAgIH1cbn1cblxuLyoqXG4gKiDojrflj5blvq7ova/orqTor4Hku6TniYxcbiAqL1xuY29uc3QgYWNxdWlyZUF1dGhUb2tlbiA9IGFzeW5jICgpOiBQcm9taXNlPE1pY3Jvc29mdEF1dGhUb2tlbj4gPT4ge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKE1JQ1JPU09GVF9BVVRIX0VORFBPSU5UKVxuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBdXRoZW50aWNhdGlvbiBmYWlsZWQ6ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRva2VuVmFsdWUgPSBhd2FpdCByZXNwb25zZS50ZXh0KClcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogdG9rZW5WYWx1ZSxcbiAgICAgICAgICAgICAgICBleHBpcmF0aW9uVGltZXN0YW1wOiBkZWNvZGVBdXRoVG9rZW5FeHBpcmF0aW9uKHRva2VuVmFsdWUpLFxuICAgICAgICB9XG59XG5cbmxldCBjYWNoZWRBdXRoVG9rZW46IHN0cmluZyB8IG51bGwgPSBudWxsXG5cbi8qKlxuICog5Yi35paw6Lqr5Lu96aqM6K+B5Luk54mM5bm26L+U5Zue5paw5Luk54mM5Y+K6L+H5pyf5pe26Ze0XG4gKi9cbmNvbnN0IHJlZnJlc2hBdXRoVG9rZW4gPSBhc3luYyAoKTogUHJvbWlzZTxbc3RyaW5nLCBudW1iZXJdPiA9PiB7XG4gICAgICAgIGlmIChjYWNoZWRBdXRoVG9rZW4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBleHBpcmF0aW9uID0gZGVjb2RlQXV0aFRva2VuRXhwaXJhdGlvbihjYWNoZWRBdXRoVG9rZW4pXG4gICAgICAgICAgICAgICAgaWYgKGV4cGlyYXRpb24gKiAxMDAwID4gRGF0ZS5ub3coKSArIDEwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbY2FjaGVkQXV0aFRva2VuLCBleHBpcmF0aW9uXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHZhbHVlLCBleHBpcmF0aW9uVGltZXN0YW1wIH0gPSBhd2FpdCBhY3F1aXJlQXV0aFRva2VuKClcbiAgICAgICAgY2FjaGVkQXV0aFRva2VuID0gdmFsdWVcbiAgICAgICAgcmV0dXJuIFt2YWx1ZSwgZXhwaXJhdGlvblRpbWVzdGFtcF1cbn1cblxuLyoqXG4gKiDmnoTlu7rlvq7ova/nv7vor5FBUEnor7fmsYLphY3nva7lkoxVUkxcbiAqL1xuY29uc3QgYnVpbGRUcmFuc2xhdGlvblJlcXVlc3QgPSBhc3luYyAoXG4gICAgICAgIHJlcXVlc3Q6IFRyYW5zbGF0aW9uUmVxdWVzdFxuKTogUHJvbWlzZTxbc3RyaW5nLCBSZXF1ZXN0SW5pdF0+ID0+IHtcbiAgICAgICAgY29uc3QgW2F1dGhUb2tlbl0gPSBhd2FpdCByZWZyZXNoQXV0aFRva2VuKClcbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbWV0ZXJzID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh7XG4gICAgICAgICAgICAgICAgZnJvbTogcmVxdWVzdC5zb3VyY2VMYW5nIHx8ICdhdXRvJyxcbiAgICAgICAgICAgICAgICB0bzogcmVxdWVzdC50YXJnZXRMYW5nIHx8ICd6aC1DTicsXG4gICAgICAgICAgICAgICAgJ2FwaS12ZXJzaW9uJzogJzMuMCcsXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgYCR7TUlDUk9TT0ZUX1RSQU5TTEFURV9BUElfVVJMfT8ke3F1ZXJ5UGFyYW1ldGVyc31gLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2F1dGhUb2tlbn1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoW3sgVGV4dDogcmVxdWVzdC5jb250ZW50IH1dKSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICBdXG59XG5cbi8qKlxuICog5omn6KGM57+76K+R6K+35rGC55qE5byC5q2l5Ye95pWwXG4gKi9cbmNvbnN0IGV4ZWN1dGVUcmFuc2xhdGlvbiA9IGFzeW5jIChcbiAgICAgICAgZW5kcG9pbnQ6IHN0cmluZyxcbiAgICAgICAgY29uZmlnOiBSZXF1ZXN0SW5pdFxuKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCwgY29uZmlnKVxuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUcmFuc2xhdGlvbiBmYWlsZWQ6ICR7cmVzcG9uc2Uuc3RhdHVzfWApXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXG4gICAgICAgIHJldHVybiByZXN1bHRbMF0udHJhbnNsYXRpb25zWzBdLnRleHRcbn1cblxuLyoqXG4gKiDlvq7ova/nv7vor5Hlh73mlbBcbiAqL1xuZXhwb3J0IGNvbnN0IHRyYW5zbGF0ZUNvbnRlbnRNaWNyb3NvZnQgPSBhc3luYyAoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgc291cmNlTGFuZyA9ICdlbicsXG4gICAgICAgIHRhcmdldExhbmcgPSAnemgtQ04nXG4pOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IFthcGlFbmRwb2ludCwgcmVxdWVzdENvbmZpZ10gPVxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgYnVpbGRUcmFuc2xhdGlvblJlcXVlc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VMYW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRMYW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgZXhlY3V0ZVRyYW5zbGF0aW9uKGFwaUVuZHBvaW50LCByZXF1ZXN0Q29uZmlnKVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RyYW5zbGF0aW9uIHdvcmtmbG93IGVycm9yOicsIGVycm9yKVxuICAgICAgICAgICAgICAgIHJldHVybiB0ZXh0XG4gICAgICAgIH1cbn1cbiIsImltcG9ydCB7IHRyYW5zbGF0ZUNvbnRlbnRHb29nbGUgYXMgdHJhbnNsYXRlRyB9IGZyb20gJy4uLy4uL3V0aWxzL3RleHQvdHJhbnNsYXRpb24nXG5pbXBvcnQgeyB0cmFuc2xhdGVDb250ZW50TWljcm9zb2Z0IGFzIHRyYW5zbGF0ZU1TIH0gZnJvbSAnLi4vLi4vdXRpbHMvdGV4dC90cmFuc2xhdGlvbidcbmltcG9ydCB7IGdldFRyYW5zbGF0b3IgfSBmcm9tICcuLi8uLi9mZWF0dXJlL3RyYW5zbGF0ZS90cmFuc2xhdGVBZGFwdGVyJ1xuXG5jbGFzcyBTaW1wbGVUcmFuc2xhdGlvbkNhY2hlIHtcbiAgICAgICAgcHJpdmF0ZSBjYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBNQVhfQ0FDSEVfU0laRSA9IDEwMDBcblxuICAgICAgICBnZXQoa2V5OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZS5nZXQoa2V5KSB8fCBudWxsXG4gICAgICAgIH1cblxuICAgICAgICBzZXQoa2V5OiBzdHJpbmcsIHJlc3VsdDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWNoZS5zZXQoa2V5LCByZXN1bHQpXG5cbiAgICAgICAgICAgICAgICAvLyDnroDljZXnmoTnvJPlrZjmuIXnkIZcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYWNoZS5zaXplID4gdGhpcy5NQVhfQ0FDSEVfU0laRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlyc3RLZXkgPSB0aGlzLmNhY2hlLmtleXMoKS5uZXh0KCkudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdEtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhY2hlLmRlbGV0ZShmaXJzdEtleSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjbGVhcigpOiB2b2lkIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlLmNsZWFyKClcbiAgICAgICAgfVxufVxuXG5jb25zdCBjYWNoZSA9IG5ldyBTaW1wbGVUcmFuc2xhdGlvbkNhY2hlKClcblxuY2xhc3MgU2ltcGxlQmF0Y2hUcmFuc2xhdG9yIHtcbiAgICAgICAgcHJpdmF0ZSBxdWV1ZTogQXJyYXk8e1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsVGV4dDogc3RyaW5nXG4gICAgICAgICAgICAgICAgdGFyZ2V0TGFuZzogc3RyaW5nXG4gICAgICAgICAgICAgICAgcmVzb2x2ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWRcbiAgICAgICAgICAgICAgICByZWplY3Q6IChyZWFzb24/OiB1bmtub3duKSA9PiB2b2lkXG4gICAgICAgIH0+ID0gW11cbiAgICAgICAgcHJpdmF0ZSBwcm9jZXNzaW5nID0gZmFsc2VcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBCQVRDSF9ERUxBWSA9IDEwIC8vIOWbuuWumuW7tui/nzEwbXNcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBCQVRDSF9TSVpFID0gNSAvLyDlm7rlrprmibnph4/lpKflsI9cblxuICAgICAgICBhc3luYyBhZGRUb0JhdGNoKFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsVGV4dDogc3RyaW5nLFxuICAgICAgICAgICAgICAgIHRhcmdldExhbmc6IHN0cmluZ1xuICAgICAgICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldExhbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NCYXRjaCgpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgYXN5bmMgcHJvY2Vzc0JhdGNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb2Nlc3NpbmcgfHwgdGhpcy5xdWV1ZS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzaW5nID0gdHJ1ZVxuXG4gICAgICAgICAgICAgICAgLy8g5L2/55So5Zu65a6a5bu26L+fXG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChyZXNvbHZlLCB0aGlzLkJBVENIX0RFTEFZKVxuICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgIC8vIOWkhOeQhuWbuuWumuWkp+Wwj+eahOaJueasoVxuICAgICAgICAgICAgICAgIGNvbnN0IGJhdGNoID0gdGhpcy5xdWV1ZS5zcGxpY2UoMCwgdGhpcy5CQVRDSF9TSVpFKVxuICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc2luZyA9IGZhbHNlXG5cbiAgICAgICAgICAgICAgICAvLyDlubbooYzlpITnkIbmibnmrKFcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IGJhdGNoLm1hcCgoaXRlbSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGVyZm9ybVNpbmdsZVRyYW5zbGF0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm9yaWdpbmFsVGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS50YXJnZXRMYW5nXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKChyZXN1bHQpID0+ICh7IGl0ZW0sIHJlc3VsdCB9KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4gKHsgaXRlbSwgZXJyb3IgfSkpXG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChwcm9taXNlcylcblxuICAgICAgICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSByZXN1bHQudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCdyZXN1bHQnIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUuaXRlbS5yZXNvbHZlKHZhbHVlLnJlc3VsdClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS5pdGVtLnJlamVjdCh2YWx1ZS5lcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAvLyDlpITnkIbliankvZnor7fmsYJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NCYXRjaCgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtU2luZ2xlVHJhbnNsYXRpb24oXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxUZXh0OiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgdGFyZ2V0TGFuZzogc3RyaW5nXG4gICAgICAgICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFRyYW5zbGF0b3IgPSBnZXRUcmFuc2xhdG9yKClcbiAgICAgICAgICAgICAgICBjb25zdCBjYWNoZUtleSA9IGAke29yaWdpbmFsVGV4dH06JHt0YXJnZXRMYW5nfToke2N1cnJlbnRUcmFuc2xhdG9yfWBcblxuICAgICAgICAgICAgICAgIC8vIOajgOafpee8k+WtmFxuICAgICAgICAgICAgICAgIGNvbnN0IGNhY2hlZFJlc3VsdCA9IGNhY2hlLmdldChjYWNoZUtleSlcbiAgICAgICAgICAgICAgICBpZiAoY2FjaGVkUmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkUmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5paH5pys6ZW/5bqm6ZmQ5Yi2XG4gICAgICAgICAgICAgICAgaWYgKG9yaWdpbmFsVGV4dC5sZW5ndGggPiA1MDAwMCB8fCBvcmlnaW5hbFRleHQubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsVGV4dFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQ6IHN0cmluZyA9ICcnXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VHJhbnNsYXRvciA9PT0gJ01TJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0cmFuc2xhdGVNUyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldExhbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50VHJhbnNsYXRvciA9PT0gJ0cnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHRyYW5zbGF0ZUcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxUZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRMYW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g56Gu5L+d57uT5p6c5pyJ5pWIXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdCB8fCByZXN1bHQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBvcmlnaW5hbFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g57+76K+R5aSx6LSl5pe26L+U5Zue5Y6f5paHXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBvcmlnaW5hbFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1RyYW5zbGF0aW9uIGZhaWxlZCwgdXNpbmcgb3JpZ2luYWwgdGV4dDonLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOabtOaWsOe8k+WtmFxuICAgICAgICAgICAgICAgIGNhY2hlLnNldChjYWNoZUtleSwgcmVzdWx0KVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICB9XG59XG5cbmNvbnN0IGJhdGNoVHJhbnNsYXRvciA9IG5ldyBTaW1wbGVCYXRjaFRyYW5zbGF0b3IoKVxuXG4vKipcbiAqIOe/u+ivkeaTjeS9nFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGVyZm9ybVRyYW5zbGF0aW9uKFxuICAgICAgICBfdHJhbnNsYXRvcjogc3RyaW5nLFxuICAgICAgICBvcmlnaW5hbFRleHQ6IHN0cmluZyxcbiAgICAgICAgdGFyZ2V0TGFuZzogc3RyaW5nXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gYmF0Y2hUcmFuc2xhdG9yLmFkZFRvQmF0Y2gob3JpZ2luYWxUZXh0LCB0YXJnZXRMYW5nKVxufVxuIiwiLyoqXG4gKiDliKTmlq3mjIflrppIVE1M5YWD57Sg5piv5ZCm5Li65YaF6IGU5YWD57SgXG4gKiBAcGFyYW0gZWxlbWVudCDpnIDopoHmo4DmtYvnmoRIVE1M5YWD57SgXG4gKiBAcmV0dXJucyDlvZPlhYPntKDmmL7npLrmqKHlvI/kuLppbmxpbmUvaW5saW5lLWJsb2Nr5pe26L+U5ZuedHJ1Ze+8jOWQpuWImei/lOWbnmZhbHNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0lubGluZUVsZW1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICAgICAgLy8g5a6a5LmJ5YaF6IGU5pi+56S65qih5byP55qE5ZCI5rOV5p6a5Li+5YC8XG4gICAgICAgIGNvbnN0IElOTElORV9ESVNQTEFZUyA9IFsnaW5saW5lJywgJ2lubGluZS1ibG9jaycsICdpbmxpbmUtZmxleCddXG5cbiAgICAgICAgLypcbiAgICAgICAgICog6I635Y+W5bm25qCH5YeG5YyW5YWD57Sg55qEIGRpc3BsYXkg5qC35byP5YC8XG4gICAgICAgICAqIC0g5L2/55SoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlIOehruS/neiOt+WPluacgOe7iOW6lOeUqOeahOagt+W8j1xuICAgICAgICAgKiAtIHRyaW0oKSDljrvpmaTpppblsL7nqbrnmb1cbiAgICAgICAgICogLSB0b0xvd2VyQ2FzZSgpIOS/neivgeS4juaemuS4vuWAvOWMuemFjVxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgZGlzcGxheSA9IHdpbmRvd1xuICAgICAgICAgICAgICAgIC5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgLmRpc3BsYXkudHJpbSgpXG4gICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcblxuICAgICAgICByZXR1cm4gSU5MSU5FX0RJU1BMQVlTLmluY2x1ZGVzKGRpc3BsYXkpXG59XG4vL+e7neWvueWumuS9jS/lm7rlrprlrprkvY3lhYPntKDpgJrluLjmnInnibnmrorluIPlsYDpnIDmsYLvvIzooYzlhoXlrrnlmajmm7TliKnkuo7kv53mjIHljp/mnInlrprkvY3lhbPns7tcbmV4cG9ydCBmdW5jdGlvbiBpc1Bvc2l0aW9uZWRFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkucG9zaXRpb25cbiAgICAgICAgcmV0dXJuIFsnYWJzb2x1dGUnLCAnZml4ZWQnLCAnc3RpY2t5J10uaW5jbHVkZXMocG9zaXRpb24pXG59XG4vL+W8ueaAp+W4g+WxgC/nvZHmoLzluIPlsYDkuK3nmoTlrZDlhYPntKDkvb/nlKjlnZfnuqflrrnlmajlj6/og73noLTlnY/luIPlsYDnu5PmnoRcbmV4cG9ydCBmdW5jdGlvbiBpc0luRmxleENvbnRleHQoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50XG4gICAgICAgIGlmICghcGFyZW50KSByZXR1cm4gZmFsc2VcbiAgICAgICAgY29uc3QgZGlzcGxheSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHBhcmVudCkuZGlzcGxheVxuICAgICAgICByZXR1cm4gZGlzcGxheS5pbmNsdWRlcygnZmxleCcpIHx8IGRpc3BsYXkuaW5jbHVkZXMoJ2dyaWQnKVxufVxuLy/mnInmmI7noa7lrr3luqbpmZDliLbnmoTlhYPntKDkvb/nlKjlnZfnuqflrrnlmajlj6/og73lr7zoh7TmlofmnKzmiKrmlq1cbmV4cG9ydCBmdW5jdGlvbiBoYXNTaXplQ29uc3RyYWludHMoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KVxuICAgICAgICByZXR1cm4gc3R5bGUud2lkdGgudHJpbSgpICE9PSAnYXV0bycgfHwgc3R5bGUubWF4V2lkdGgudHJpbSgpICE9PSAnbm9uZSdcbn1cbi8v6ZyA6KaB5paH5pys5rqi5Ye65aSE55CG55qE5YWD57Sg5pu06YCC5ZCI6KGM5YaF5a655Zmo5L+d5oyB5Y6f5pyJ5oiq5pat5pWI5p6cXG5leHBvcnQgZnVuY3Rpb24gaGFzVGV4dE92ZXJmbG93KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IG92ZXJmbG93ID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkub3ZlcmZsb3dcbiAgICAgICAgcmV0dXJuIG92ZXJmbG93LmluY2x1ZGVzKCdoaWRkZW4nKSB8fCBvdmVyZmxvdy5pbmNsdWRlcygnc2Nyb2xsJylcbn1cbi8v6K6+572u54m55q6K5Z6C55u05a+56b2Q5pa55byP55qE5YWD57Sg5L2/55So5Z2X57qn5a655Zmo5Y+v6IO956C05Z2P5a+56b2Q5pWI5p6cXG5leHBvcnQgZnVuY3Rpb24gaGFzVmVydGljYWxBbGlnbihlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBhbGlnbiA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpLnZlcnRpY2FsQWxpZ25cbiAgICAgICAgcmV0dXJuIGFsaWduICE9PSAnYXV0bycgJiYgYWxpZ24gIT09ICdiYXNlbGluZSdcbn1cbi8vIC8v5YyF5ZCr5YW25LuWRE9N5YWD57Sg55qE5re35ZCI5YaF5a655pu06YCC5ZCI5L2/55So6KGM5YaF5a655Zmo5YyF6KO5XG4vLyBleHBvcnQgZnVuY3Rpb24gaGFzTWl4ZWRDb250ZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4vLyAgICAgcmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKS5zb21lKFxuLy8gICAgICAgICAobm9kZSkgPT5cbi8vICAgICAgICAgICAgIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFICYmXG4vLyAgICAgICAgICAgICBub2RlICE9PSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIudHJhbnNsYXRpb24tcmVzdWx0XCIpXG4vLyAgICAgKTtcbi8vIH1cbi8qKlxuICog5Yik5pat5YWD57Sg5piv5ZCm6K6+572u5LqG5paH5pys6Ieq5Yqo5o2i6KGM5qC35byPXG4gKiBAcGFyYW0gZWxlbWVudCAtIOmcgOimgeajgOa1i+eahEhUTUzlhYPntKBcbiAqIEByZXR1cm5zIOW9k+WFg+e0oOeahHRleHRXcmFwTW9kZeS4uid3cmFwJ+aXtui/lOWbnnRydWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZFdyYXBFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgICAgIC8vIOiOt+WPluWFg+e0oOW9k+WJjeiuoeeul+WQjueahOaWh+acrOaNouihjOaooeW8j1xuICAgICAgICBjb25zdCB0ZXh0V3JhcE1vZGUgPSB3aW5kb3dcbiAgICAgICAgICAgICAgICAuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KVxuICAgICAgICAgICAgICAgIC50ZXh0V3JhcE1vZGUudHJpbSgpXG4gICAgICAgIC8vIOWIpOaWreaYr+WQpuS4uuW8uuWItuaNouihjOaooeW8j1xuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0V3JhcE1vZGUpXG4gICAgICAgIHJldHVybiB0ZXh0V3JhcE1vZGUgPT09ICd3cmFwJyB8fCB0ZXh0V3JhcE1vZGUgPT09ICcnXG59XG4iLCJpbXBvcnQge1xuICAgICAgICBoYXNWZXJ0aWNhbEFsaWduLFxuICAgICAgICBpc0luRmxleENvbnRleHQsXG4gICAgICAgIGlzSW5saW5lRWxlbWVudCxcbiAgICAgICAgaXNQb3NpdGlvbmVkRWxlbWVudCxcbiAgICAgICAgc2hvdWxkV3JhcEVsZW1lbnQsXG59IGZyb20gJy4vZWxlbWVudFN0eWxlJ1xuXG4vLyDpq5jmgKfog73moLflvI/nvJPlrZjns7vnu59cbmNvbnN0IHN0eWxlQ2FjaGUgPSBuZXcgV2Vha01hcDxcbiAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgIHsgc2hvdWxkVXNlSW5saW5lOiBib29sZWFuOyBzaG91bGRXcmFwOiBib29sZWFuIH1cbj4oKVxuXG4vLyDluLjop4HlhYPntKDmoLflvI/pooTorqHnrpcgLSDln7rkuo7moIfnrb7lkI3nmoTlv6vpgJ/nvJPlrZhcbmNvbnN0IHRhZ05hbWVTdHlsZUNhY2hlID0gbmV3IE1hcDxcbiAgICAgICAgc3RyaW5nLFxuICAgICAgICB7IHNob3VsZFVzZUlubGluZTogYm9vbGVhbjsgc2hvdWxkV3JhcDogYm9vbGVhbiB9XG4+KFtcbiAgICAgICAgWydESVYnLCB7IHNob3VsZFVzZUlubGluZTogZmFsc2UsIHNob3VsZFdyYXA6IHRydWUgfV0sXG4gICAgICAgIFsnU1BBTicsIHsgc2hvdWxkVXNlSW5saW5lOiB0cnVlLCBzaG91bGRXcmFwOiBmYWxzZSB9XSxcbiAgICAgICAgWydQJywgeyBzaG91bGRVc2VJbmxpbmU6IGZhbHNlLCBzaG91bGRXcmFwOiB0cnVlIH1dLFxuICAgICAgICBbJ0EnLCB7IHNob3VsZFVzZUlubGluZTogdHJ1ZSwgc2hvdWxkV3JhcDogZmFsc2UgfV0sXG4gICAgICAgIFsnU1RST05HJywgeyBzaG91bGRVc2VJbmxpbmU6IHRydWUsIHNob3VsZFdyYXA6IGZhbHNlIH1dLFxuICAgICAgICBbJ0VNJywgeyBzaG91bGRVc2VJbmxpbmU6IHRydWUsIHNob3VsZFdyYXA6IGZhbHNlIH1dLFxuICAgICAgICBbJ0xJJywgeyBzaG91bGRVc2VJbmxpbmU6IGZhbHNlLCBzaG91bGRXcmFwOiB0cnVlIH1dLFxuICAgICAgICBbJ0gxJywgeyBzaG91bGRVc2VJbmxpbmU6IGZhbHNlLCBzaG91bGRXcmFwOiB0cnVlIH1dLFxuICAgICAgICBbJ0gyJywgeyBzaG91bGRVc2VJbmxpbmU6IGZhbHNlLCBzaG91bGRXcmFwOiB0cnVlIH1dLFxuICAgICAgICBbJ0gzJywgeyBzaG91bGRVc2VJbmxpbmU6IGZhbHNlLCBzaG91bGRXcmFwOiB0cnVlIH1dLFxuICAgICAgICBbJ0g0JywgeyBzaG91bGRVc2VJbmxpbmU6IGZhbHNlLCBzaG91bGRXcmFwOiB0cnVlIH1dLFxuICAgICAgICBbJ0g1JywgeyBzaG91bGRVc2VJbmxpbmU6IGZhbHNlLCBzaG91bGRXcmFwOiB0cnVlIH1dLFxuICAgICAgICBbJ0g2JywgeyBzaG91bGRVc2VJbmxpbmU6IGZhbHNlLCBzaG91bGRXcmFwOiB0cnVlIH1dLFxuXSlcblxuZnVuY3Rpb24gZGVzU3RyaW5nKGNvbnRlbnQ6IHN0cmluZywgc2hvdWxkV3JhcDogYm9vbGVhbik6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHJlc3VsdENvbnRlbnQgPSBzaG91bGRXcmFwXG4gICAgICAgICAgICAgICAgPyAnLSAnICsgY29udGVudFxuICAgICAgICAgICAgICAgIDogJyA8JyArIGNvbnRlbnQgKyAnPiAnXG4gICAgICAgIHJldHVybiByZXN1bHRDb250ZW50XG59XG5cbi8qKlxuICog5Yib5bu655So5LqO5bGV56S657+76K+R57uT5p6c55qE5a655Zmo5YWD57SgXG4gKiBAcGFyYW0gdHJhbnNsYXRlZFRleHQg6ZyA6KaB5bGV56S655qE57+76K+R5paH5pys5YaF5a65XG4gKiBAcGFyYW0gc2hvdWxkV3JhcCDmmK/lkKbpnIDopoHkvb/nlKjlnZfnuqflhYPntKDljIXoo7lcbiAqIEByZXR1cm5zIOWIm+W7uueahEhUTUzlhYPntKDlrrnlmahcbiAqL1xuZnVuY3Rpb24gY3JlYXRlVHJhbnNsYXRpb25Db250YWluZXIoXG4gICAgICAgIHRyYW5zbGF0ZWRUZXh0OiBzdHJpbmcsXG4gICAgICAgIHNob3VsZFdyYXA6IGJvb2xlYW5cbik6IEhUTUxFbGVtZW50IHtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChzaG91bGRXcmFwID8gJ2RpdicgOiAnc3BhbicpXG5cbiAgICAgICAgLy8g5Yib5bu65Z+656GA5a655Zmo5YWD57Sg77yaXG4gICAgICAgIC8vIDEuIOagueaNrnNob3VsZFdyYXDlj4LmlbDlhrPlrprliJvlu7pkaXbmiJZzcGFu5YWD57SgXG4gICAgICAgIC8vIDIuIOWdl+e6p+WFg+e0oChkaXYp55So5LqO6ZyA6KaB54us56uL5biD5bGA55qE5Zy65pmvXG4gICAgICAgIC8vIDMuIOihjOWGheWFg+e0oChzcGFuKeeUqOS6juWGheiBlOaYvuekuuWcuuaZr1xuXG4gICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCd0cmFuc2xhdGlvbi1yZXN1bHQnKVxuXG4gICAgICAgIC8vIOS4uuihjOWGheWFg+e0oOa3u+WKoHRpdGxl5bGe5oCn77yaXG4gICAgICAgIC8vIOWcqOmdnuWMheijueaooeW8j+S4i++8jOmAmui/h3RpdGxl5bGe5oCn5bGV56S65a6M5pW057+76K+R5paH5pysXG4gICAgICAgIC8vIOi/meWPr+S7peehruS/neW9k+WGheWuueiiq+aIquaWreaXtuS7jeiDvemAmui/h+aCrOWBnOafpeeci+WujOaVtOaWh+acrFxuICAgICAgICBpZiAoIXNob3VsZFdyYXApIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIudGl0bGUgPSB0cmFuc2xhdGVkVGV4dFxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcblxuICAgICAgICAvLyDkvb/nlKjmlofmoaPniYfmrrXov5vooYzlhoXlrrnloavlhYXvvJpcbiAgICAgICAgLy8gMS4g6YCa6L+HZGVzU3RyaW5n5aSE55CG5paH5pys5YaF5a6577yI5YW35L2T5aSE55CG6YC76L6R5pyq5bGV56S677yJXG4gICAgICAgIC8vIDIuIOaWh+aho+eJh+auteaTjeS9nOWPr+WHj+WwkURPTemHjeaOkuasoeaVsO+8jOaPkOWNh+aAp+iDvVxuICAgICAgICAvLyAzLiDmnIDnu4jlsIblpITnkIblkI7nmoTlhoXlrrnmt7vliqDliLDlrrnlmajkuK1cbiAgICAgICAgZnJhZ21lbnQudGV4dENvbnRlbnQgPSBkZXNTdHJpbmcodHJhbnNsYXRlZFRleHQsIHNob3VsZFdyYXApXG5cbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGZyYWdtZW50KVxuXG4gICAgICAgIHJldHVybiBjb250YWluZXJcbn1cblxuLyoqXG4gKiDmm7TmlrDmiJbliJvlu7rnv7vor5HlrrnlmajlhYPntKBcbiAqIOWmguaenOebruagh+WFg+e0oOW3suWMheWQq+e/u+ivkeWuueWZqOWImeS4jeWBmuS7u+S9leaTjeS9nO+8jOWQpuWImeagueaNruWPguaVsOWIm+W7uuaWsOeahOe/u+ivkeWuueWZqOW5tua3u+WKoOWIsOebruagh+WFg+e0oOS4rVxuICpcbiAqIEBwYXJhbSBlbGVtZW50IC0g55uu5qCHSFRNTOWFg+e0oO+8jOeUqOS6juafpeaJvuaIluaMgui9vee/u+ivkeWuueWZqFxuICogQHBhcmFtIHRyYW5zbGF0ZWRUZXh0IC0g6ZyA6KaB5pi+56S655qE57+76K+R5paH5pys5YaF5a65XG4gKiBAcGFyYW0gc2hvdWxkV3JhcCAtIOaYr+WQpuWFgeiuuOaWh+acrOaNouihjOeahOW4g+WwlOagh+W/l1xuICpcbiAqIEByZXR1cm5zIHZvaWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZU9yQ3JlYXRlVHJhbnNsYXRpb25Db250YWluZXIoXG4gICAgICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgICAgICB0cmFuc2xhdGVkVGV4dDogc3RyaW5nLFxuICAgICAgICBzaG91bGRXcmFwOiBib29sZWFuXG4pOiB2b2lkIHtcbiAgICAgICAgLy8g5p+l5om+5bey5a2Y5Zyo55qE57+76K+R5a655Zmo5YWD57SgXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkcmVuKS5maW5kKChjaGlsZCkgPT5cbiAgICAgICAgICAgICAgICBjaGlsZC5jbGFzc0xpc3QuY29udGFpbnMoJ3RyYW5zbGF0aW9uLXJlc3VsdCcpXG4gICAgICAgIClcblxuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRDb250YWluZXIgPSBjcmVhdGVUcmFuc2xhdGlvbkNvbnRhaW5lcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZWRUZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkV3JhcFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICBpbnNlcnRBZnRlckxhc3RUZXh0RWxlbWVudChlbGVtZW50LCByZXN1bHRDb250YWluZXIpXG4gICAgICAgIH1cbn1cblxuLy8g5om56YePRE9N5pON5L2c6Zif5YiXXG5jb25zdCBkb21PcGVyYXRpb25RdWV1ZTogeyBlbGVtZW50OiBIVE1MRWxlbWVudDsgY29udGFpbmVyOiBIVE1MRWxlbWVudCB9W10gPSBbXVxubGV0IGRvbU9wZXJhdGlvblNjaGVkdWxlZCA9IGZhbHNlXG5cbi8qKlxuICog6LCD5bqm5om56YePRE9N5pON5L2cXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRG9tT3BlcmF0aW9uKFxuICAgICAgICBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICAgICAgY29udGFpbmVyOiBIVE1MRWxlbWVudFxuKTogdm9pZCB7XG4gICAgICAgIGRvbU9wZXJhdGlvblF1ZXVlLnB1c2goeyBlbGVtZW50LCBjb250YWluZXIgfSlcblxuICAgICAgICBpZiAoIWRvbU9wZXJhdGlvblNjaGVkdWxlZCkge1xuICAgICAgICAgICAgICAgIGRvbU9wZXJhdGlvblNjaGVkdWxlZCA9IHRydWVcblxuICAgICAgICAgICAgICAgIC8vIOS9v+eUqCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUg5Zyo5LiL5LiA5bin5om56YeP5aSE55CGRE9N5pON5L2cXG4gICAgICAgICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRG9tT3BlcmF0aW9uUXVldWUoKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbn1cblxuLyoqXG4gKiDlpITnkIbmibnph49ET03mk43kvZzpmJ/liJdcbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc0RvbU9wZXJhdGlvblF1ZXVlKCk6IHZvaWQge1xuICAgICAgICBkb21PcGVyYXRpb25TY2hlZHVsZWQgPSBmYWxzZVxuXG4gICAgICAgIGNvbnN0IG9wZXJhdGlvbnMgPSBbLi4uZG9tT3BlcmF0aW9uUXVldWVdXG4gICAgICAgIGRvbU9wZXJhdGlvblF1ZXVlLmxlbmd0aCA9IDBcblxuICAgICAgICAvLyDmibnph4/lpITnkIbmiYDmnIlET03mk43kvZxcbiAgICAgICAgb3BlcmF0aW9ucy5mb3JFYWNoKCh7IGVsZW1lbnQsIGNvbnRhaW5lciB9KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9zaXRpb24gPSBmaW5kT3B0aW1hbEluc2VydFBvc2l0aW9uKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uLm5vZGUgJiYgcG9zaXRpb24uaXNBZnRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ubm9kZS5wYXJlbnROb2RlPy5pbnNlcnRCZWZvcmUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ubm9kZS5uZXh0U2libGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocG9zaXRpb24ubm9kZSAmJiAhcG9zaXRpb24uaXNBZnRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ubm9kZS5wYXJlbnROb2RlPy5pbnNlcnRCZWZvcmUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ubm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNvbnRhaW5lcilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0pXG59XG5cbi8qKlxuICog5LyY5YyW55qE5o+S5YWl5L2N572u5p+l5om+566X5rOVXG4gKi9cbmZ1bmN0aW9uIGZpbmRPcHRpbWFsSW5zZXJ0UG9zaXRpb24oZWxlbWVudDogSFRNTEVsZW1lbnQpOiB7XG4gICAgICAgIG5vZGU6IE5vZGUgfCBudWxsXG4gICAgICAgIGlzQWZ0ZXI6IGJvb2xlYW5cbn0ge1xuICAgICAgICAvLyDlv6vpgJ/mo4Dmn6XvvJrlpoLmnpzlhYPntKDmsqHmnInlrZDoioLngrnvvIznm7TmjqXov5Tlm55udWxs6KGo56S66L+95Yqg5Yiw5pyr5bC+XG4gICAgICAgIGlmICghZWxlbWVudC5sYXN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBub2RlOiBudWxsLCBpc0FmdGVyOiBmYWxzZSB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDku47mnIDlkI7kuIDkuKrlrZDoioLngrnlvIDlp4vlkJHliY3mn6Xmib5cbiAgICAgICAgbGV0IG5vZGU6IE5vZGUgfCBudWxsID0gZWxlbWVudC5sYXN0Q2hpbGRcblxuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgICAgIC8vIOW/q+mAn+ajgOafpe+8muWmguaenOaYr+aWh+acrOiKgueCueS4lOWMheWQq+WGheWuuVxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnRleHRDb250ZW50Py50cmltKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IG5vZGUsIGlzQWZ0ZXI6IHRydWUgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWmguaenOaYr+WFg+e0oOiKgueCuVxuICAgICAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWwgPSBub2RlIGFzIEhUTUxFbGVtZW50XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW/q+mAn+aOkumZpOe/u+ivkee7k+aenOWuueWZqFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsLmNsYXNzTGlzdD8uY29udGFpbnMoJ3RyYW5zbGF0aW9uLXJlc3VsdCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnByZXZpb3VzU2libGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmo4Dmn6XmmK/lkKbljIXlkKvmlofmnKzlhoXlrrlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbC50ZXh0Q29udGVudD8udHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IG5vZGUsIGlzQWZ0ZXI6IHRydWUgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmo4Dmn6XmmK/lkKbljIXlkKtTVkdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbC5xdWVyeVNlbGVjdG9yKCdzdmcnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBub2RlLCBpc0FmdGVyOiB0cnVlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5wcmV2aW91c1NpYmxpbmdcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IG5vZGU6IG51bGwsIGlzQWZ0ZXI6IGZhbHNlIH1cbn1cblxuLyoqXG4gKiDlsIbnv7vor5Hnu5Pmnpzlrrnlmajmj5LlhaXliLDnm67moIflhYPntKDkuK3mnIDlkI7kuIDkuKrmnInmlofmnKzmiJZzdmfnmoTlhYPntKDkuYvlkI5cbiAqIOS9v+eUqOaJuemHj0RPTeaTjeS9nOWSjOS8mOWMlueul+azlVxuICogQHBhcmFtIGVsZW1lbnQgLSDnm67moIdIVE1M5YWD57SgXG4gKiBAcGFyYW0gcmVzdWx0Q29udGFpbmVyIC0g57+76K+R57uT5p6c5a655Zmo5YWD57SgXG4gKi9cbmZ1bmN0aW9uIGluc2VydEFmdGVyTGFzdFRleHRFbGVtZW50KFxuICAgICAgICBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICAgICAgcmVzdWx0Q29udGFpbmVyOiBIVE1MRWxlbWVudFxuKTogdm9pZCB7XG4gICAgICAgIC8vIOS9v+eUqOaJuemHj0RPTeaTjeS9nOiwg+W6plxuICAgICAgICBzY2hlZHVsZURvbU9wZXJhdGlvbihlbGVtZW50LCByZXN1bHRDb250YWluZXIpXG59XG5cbi8qKlxuICog6I635Y+W5YWD57Sg55qE5qC35byP5L+h5oGvIC0g5LyY5YyW54mI5pysXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbGVtZW50U3R5bGVJbmZvKGVsZW1lbnQ6IEhUTUxFbGVtZW50KToge1xuICAgICAgICBzaG91bGRVc2VJbmxpbmU6IGJvb2xlYW5cbiAgICAgICAgc2hvdWxkV3JhcDogYm9vbGVhblxufSB7XG4gICAgICAgIC8vIOmmluWFiOajgOafpVdlYWtNYXDnvJPlrZhcbiAgICAgICAgbGV0IHN0eWxlSW5mbyA9IHN0eWxlQ2FjaGUuZ2V0KGVsZW1lbnQpXG4gICAgICAgIGlmIChzdHlsZUluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGVJbmZvXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmo4Dmn6XmoIfnrb7lkI3nvJPlrZhcbiAgICAgICAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZVxuICAgICAgICBjb25zdCB0YWdTdHlsZSA9IHRhZ05hbWVTdHlsZUNhY2hlLmdldCh0YWdOYW1lKVxuXG4gICAgICAgIGxldCBzaG91bGRVc2VJbmxpbmU6IGJvb2xlYW5cbiAgICAgICAgbGV0IHNob3VsZFdyYXA6IGJvb2xlYW5cblxuICAgICAgICBpZiAodGFnU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAvLyDkvb/nlKjpooTorqHnrpfnmoTmoIfnrb7moLflvI/kvZzkuLrln7rlh4ZcbiAgICAgICAgICAgICAgICBzaG91bGRVc2VJbmxpbmUgPSB0YWdTdHlsZS5zaG91bGRVc2VJbmxpbmVcbiAgICAgICAgICAgICAgICBzaG91bGRXcmFwID0gdGFnU3R5bGUuc2hvdWxkV3JhcFxuXG4gICAgICAgICAgICAgICAgLy8g5a+55LqO6aKE5a6a5LmJ5qC35byP77yM5Y+q5Zyo5a6e6ZmF6ZyA6KaB5pe26L+b6KGM6K+m57uG5qOA5p+lXG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZFVzZUlubGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6KGM5YaF5YWD57Sg5Y+v6IO96ZyA6KaB6aKd5aSW5qOA5p+l5a6a5L2N5ZKMZmxleOS4iuS4i+aWh1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkVXNlSW5saW5lID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIWlzUG9zaXRpb25lZEVsZW1lbnQoZWxlbWVudCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIWlzSW5GbGV4Q29udGV4dChlbGVtZW50KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDmnKrnn6XmoIfnrb7vvIzov5vooYzlrozmlbTorqHnrpdcbiAgICAgICAgICAgICAgICBzaG91bGRVc2VJbmxpbmUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgaXNJbmxpbmVFbGVtZW50KGVsZW1lbnQpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1Bvc2l0aW9uZWRFbGVtZW50KGVsZW1lbnQpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0luRmxleENvbnRleHQoZWxlbWVudCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhc1ZlcnRpY2FsQWxpZ24oZWxlbWVudClcblxuICAgICAgICAgICAgICAgIHNob3VsZFdyYXAgPSAhc2hvdWxkVXNlSW5saW5lICYmIHNob3VsZFdyYXBFbGVtZW50KGVsZW1lbnQpXG4gICAgICAgIH1cblxuICAgICAgICBzdHlsZUluZm8gPSB7IHNob3VsZFVzZUlubGluZSwgc2hvdWxkV3JhcCB9XG4gICAgICAgIHN0eWxlQ2FjaGUuc2V0KGVsZW1lbnQsIHN0eWxlSW5mbylcblxuICAgICAgICByZXR1cm4gc3R5bGVJbmZvXG59XG4iLCJpbXBvcnQgeyB0cmFuc2xhdG9yIH0gZnJvbSAnLi4vLi4vZmVhdHVyZS90cmFuc2xhdGUvdHJhbnNsYXRlQWRhcHRlcidcbmltcG9ydCB7XG4gICAgICAgIGV4dHJhY3RUZXh0RnJhZ21lbnRzLFxuICAgICAgICBzaG91bGRTa2lwVHJhbnNsYXRpb24sXG4gICAgICAgIHNob3VsZFNraXBFbGVtZW50VHJhbnNsYXRpb24sXG59IGZyb20gJy4vdGV4dEV4dHJhY3RvcidcbmltcG9ydCB7IHBlcmZvcm1UcmFuc2xhdGlvbiB9IGZyb20gJy4vdHJhbnNsYXRpb25DYWNoZSdcbmltcG9ydCB7XG4gICAgICAgIHVwZGF0ZU9yQ3JlYXRlVHJhbnNsYXRpb25Db250YWluZXIsXG4gICAgICAgIGdldEVsZW1lbnRTdHlsZUluZm8sXG59IGZyb20gJy4vZG9tUmVuZGVyZXInXG5cbi8qKlxuICog57+76K+R5oyH5a6aSFRNTOWFg+e0oOeahOWGheWuueW5tuabtOaWsOWFtuaYvuekulxuICogQHBhcmFtIGVsZW1lbnQg6ZyA6KaB57+76K+R55qESFRNTOWFg+e0oOWvueixoVxuICogQHBhcmFtIHRhcmdldExhbmcg55uu5qCH6K+t6KiA5Luj56CB77yI6buY6K6k5YC8OiBcInpoLUNOXCLvvIlcbiAqIEByZXR1cm5zIOi/lOWbnlByb21pc2U8dm9pZD7vvIzooajnpLrlvILmraXnv7vor5Hmk43kvZzlrozmiJBcbiAqL1xuZXhwb3J0IGNvbnN0IHRyYW5zbGF0ZUVsZW1lbnQgPSBhc3luYyAoXG4gICAgICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgICAgICB0YXJnZXRMYW5nID0gJ3poLUNOJ1xuKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgICAgIC8vIOaPkOWJjeajgOafpeaYr+WQpuW6lOivpei3s+i/h+e/u+ivkVxuICAgICAgICBpZiAoc2hvdWxkU2tpcEVsZW1lbnRUcmFuc2xhdGlvbihlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5o+Q5Y+W5YWD57Sg5paH5pys5YaF5a656L+b6KGM57+76K+R5aSE55CGXG4gICAgICAgIGNvbnN0IG9yaWdpbmFsVGV4dCA9IGF3YWl0IGV4dHJhY3RUZXh0RnJhZ21lbnRzKGVsZW1lbnQpXG4gICAgICAgIGlmIChzaG91bGRTa2lwVHJhbnNsYXRpb24ob3JpZ2luYWxUZXh0KSkge1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDmiafooYzmlofmnKznv7vor5Hmk43kvZxcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2xhdGVkVGV4dCA9IGF3YWl0IHBlcmZvcm1UcmFuc2xhdGlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRMYW5nXG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c57+76K+R57uT5p6c5LiO5Y6f5paH5pys55u45ZCM5YiZ6Lez6L+H5pu05pawXG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zbGF0ZWRUZXh0ID09PSBvcmlnaW5hbFRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOiOt+WPluWFg+e0oOagt+W8j+S/oeaBr1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0eWxlSW5mbyA9IGdldEVsZW1lbnRTdHlsZUluZm8oZWxlbWVudClcblxuICAgICAgICAgICAgICAgIC8vIOabtOaWsOaIluWIm+W7uue/u+ivkeWGheWuueWuueWZqFxuICAgICAgICAgICAgICAgIHVwZGF0ZU9yQ3JlYXRlVHJhbnNsYXRpb25Db250YWluZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNsYXRlZFRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZUluZm8uc2hvdWxkV3JhcFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFbGVtZW50IHRyYW5zbGF0aW9uIGZhaWxlZDonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9XG59XG4iLCJpbXBvcnQgeyBpbnRlcnNlY3Rpb25PYnNlcnZlck9wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnXG5cbmltcG9ydCB7IG1hbmFnZU11dGF0aW9uT2JzZXJ2ZXIgfSBmcm9tICcuLi9kb21NdXRhdGlvbk9ic2VydmVyJ1xuaW1wb3J0IHsgZ2V0VGV4dENvbnRhaW5lckVsZW1lbnQgfSBmcm9tICcuLi8uLi91dGlscy9kb20vdHJhdmVyc2FsJ1xuaW1wb3J0IHsgdHJhbnNsYXRlRWxlbWVudCB9IGZyb20gJy4uLy4uL2ZlYXR1cmUvdHJhbnNsYXRlL3RyYW5zbGF0ZUVsZW1lbnQnXG5pbXBvcnQgeyBwcmVwcm9jZXNzRXhjbHVkZWRFbGVtZW50cyB9IGZyb20gJy4uLy4uL2ZlYXR1cmUvdHJhbnNsYXRlL3RleHRFeHRyYWN0b3InXG5cbmNvbnN0IHRyYW5zbGF0ZU9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKChlbnRyaWVzKSA9PiB7XG4gICAgICAgIG1hbmFnZU11dGF0aW9uT2JzZXJ2ZXIoZmFsc2UpXG4gICAgICAgIC8vICDlpITnkIbmiYDmnInmnaHnm65cbiAgICAgICAgZW50cmllcy5maWx0ZXIoKGUpID0+IGUuaXNJbnRlcnNlY3RpbmcpLmZvckVhY2gocHJvY2Vzc0VsZW1lbnQpXG5cbiAgICAgICAgbWFuYWdlTXV0YXRpb25PYnNlcnZlcih0cnVlKVxufSwgaW50ZXJzZWN0aW9uT2JzZXJ2ZXJPcHRpb25zKVxuXG4vLyDkuLvlpITnkIbpgLvovpFcbmZ1bmN0aW9uIHByb2Nlc3NFbGVtZW50KGVudHJ5OiBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5KSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBlbnRyeS50YXJnZXQgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgdHJhbnNsYXRlRWxlbWVudChlbGVtZW50KVxuICAgICAgICB0cmFuc2xhdGVPYnNlcnZlci51bm9ic2VydmUoZWxlbWVudCkgLy8g56uL5Y2z5riF55CGXG59XG5cbi8vIOWIneWni+WMluWFpeWPo1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVUcmFuc2xhdGVPYnNlcnZlcigpIHtcbiAgICAgICAgLy8g6aKE5aSE55CG5o6S6Zmk5YWD57Sg77yM56Gu5L+d57+76K+R6KGM5Li65LiORE9N57uT5p6E6aG65bqP5peg5YWzXG4gICAgICAgIHByZXByb2Nlc3NFeGNsdWRlZEVsZW1lbnRzKGRvY3VtZW50LmJvZHkpXG4gICAgICAgIG9ic2VydmVUcmFuc2xhdGVFbGVtZW50cyhkb2N1bWVudC5ib2R5KVxufVxuXG4vLyDnu5/kuIDop4Llr5/mlrnms5VcbmV4cG9ydCBmdW5jdGlvbiBvYnNlcnZlVHJhbnNsYXRlRWxlbWVudHMocm9vdDogRWxlbWVudCkge1xuICAgICAgICBnZXRUZXh0Q29udGFpbmVyRWxlbWVudChyb290KS5mb3JFYWNoKChlbCkgPT5cbiAgICAgICAgICAgICAgICB0cmFuc2xhdGVPYnNlcnZlci5vYnNlcnZlKGVsKVxuICAgICAgICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wVHJhbnNsYXRvck9ic2VydmVyKCkge1xuICAgICAgICB0cmFuc2xhdGVPYnNlcnZlci5kaXNjb25uZWN0KClcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oJy50cmFuc2xhdGlvbi1yZXN1bHQnKS5mb3JFYWNoKFxuICAgICAgICAgICAgICAgICh0cikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHIucmVtb3ZlKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIClcbn1cbiIsImltcG9ydCB7IHNlYXJjaEVuZ2luZXMsIFNlYXJjaEVuZ2luZUNvbmZpZyB9IGZyb20gJy4uLy4uL3V0aWxzL3BhZ2Uvc2VhcmNoJ1xuXG4vKipcbiAqIOWFs+mUruivjeadpea6kOaOpeWPo1xuICog5o+P6L+w5YWz6ZSu6K+N55qE5p2l5rqQ5ZKM5Y+v5L+h5bqmXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5d29yZFNvdXJjZSB7XG4gICAgICAgIHR5cGU6XG4gICAgICAgICAgICAgICAgfCAnc2VhcmNoX2VuZ2luZSdcbiAgICAgICAgICAgICAgICB8ICdyZWZlcmVyJ1xuICAgICAgICAgICAgICAgIHwgJ2lucHV0X2JveCdcbiAgICAgICAgICAgICAgICB8ICdoaXN0b3J5J1xuICAgICAgICAgICAgICAgIHwgJ2luaGVyaXRlZCcgLy8g5p2l5rqQ57G75Z6LXG4gICAgICAgIGtleXdvcmRzOiBzdHJpbmdbXSAvLyDlhbPplK7or43liJfooahcbiAgICAgICAgY29uZmlkZW5jZTogbnVtYmVyIC8vIOWPr+S/oeW6puWIhuaVsCAoMC0xKVxufVxuXG4vKipcbiAqIOWFs+mUruivjeaPkOWPluWZqFxuICog6LSf6LSj5LuO5pCc57Si5byV5pOOVVJM44CB6aG16Z2i5YWD57Sg562J6Ieq5Yqo5o+Q5Y+W5pCc57Si5YWz6ZSu6K+NXG4gKi9cbmV4cG9ydCBjbGFzcyBLZXl3b3JkRXh0cmFjdG9yIHtcbiAgICAgICAgLy8g5pSv5oyB55qE5pCc57Si5byV5pOO6YWN572u5YiX6KGoXG4gICAgICAgIHByaXZhdGUgc2VhcmNoRW5naW5lczogU2VhcmNoRW5naW5lQ29uZmlnW10gPSBzZWFyY2hFbmdpbmVzXG5cbiAgICAgICAgLy8g5pCc57Si5qGG6YCJ5oup5Zmo5YiX6KGo77yM55So5LqO6K+G5Yir6aG16Z2i5Lit55qE5pCc57Si6L6T5YWl5qGGXG4gICAgICAgIHByaXZhdGUgaW5wdXRTZWxlY3RvcnMgPSBbXG4gICAgICAgICAgICAgICAgJyNxdWVyeScsXG4gICAgICAgICAgICAgICAgJyNzZWFyY2gnLFxuICAgICAgICAgICAgICAgICcja2V5d29yZCcsXG4gICAgICAgICAgICAgICAgJyNzY3JpcHRfcScsXG4gICAgICAgICAgICAgICAgJyNzZWFyY2gtcScsXG4gICAgICAgICAgICAgICAgJy5pbnB1dCcsXG4gICAgICAgIF1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5LuO5aSa5Liq5p2l5rqQ5o+Q5Y+W5YWz6ZSu6K+NXG4gICAgICAgICAqIOaMieWPr+S/oeW6puaOkuW6j+i/lOWbnuWFs+mUruivjeadpea6kOWIl+ihqFxuICAgICAgICAgKiBAcmV0dXJucyDmjpLluo/lkI7nmoTlhbPplK7or43mnaXmupDmlbDnu4RcbiAgICAgICAgICovXG4gICAgICAgIGV4dHJhY3RLZXl3b3JkcygpOiBLZXl3b3JkU291cmNlW10ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNvdXJjZXM6IEtleXdvcmRTb3VyY2VbXSA9IFtdXG5cbiAgICAgICAgICAgICAgICAvLyAxLiDku47lvZPliY3pobXpnaLnmoTmkJzntKLlvJXmk45VUkzmj5Dlj5bvvIjlj6/kv6HluqbmnIDpq5jvvIlcbiAgICAgICAgICAgICAgICBjb25zdCBzZWFyY2hFbmdpbmVLZXl3b3JkcyA9IHRoaXMuZXh0cmFjdEZyb21TZWFyY2hFbmdpbmUoKVxuICAgICAgICAgICAgICAgIGlmIChzZWFyY2hFbmdpbmVLZXl3b3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc2VhcmNoX2VuZ2luZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXdvcmRzOiBzZWFyY2hFbmdpbmVLZXl3b3JkcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlkZW5jZTogMC45LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyAyLiDku47lvJXnlKjpobXpnaLvvIhyZWZlcmVy77yJ55qE5pCc57Si5byV5pOOVVJM5o+Q5Y+WXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmZXJlcktleXdvcmRzID0gdGhpcy5leHRyYWN0RnJvbVJlZmVyZXIoKVxuICAgICAgICAgICAgICAgIGlmIChyZWZlcmVyS2V5d29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3JlZmVyZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXl3b3JkczogcmVmZXJlcktleXdvcmRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWRlbmNlOiAwLjcsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIDMuIOS7jumhtemdouS4reeahOi+k+WFpeahhuaPkOWPllxuICAgICAgICAgICAgICAgIGNvbnN0IGlucHV0Qm94S2V5d29yZHMgPSB0aGlzLmV4dHJhY3RGcm9tSW5wdXRCb3hlcygpXG4gICAgICAgICAgICAgICAgaWYgKGlucHV0Qm94S2V5d29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2lucHV0X2JveCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXdvcmRzOiBpbnB1dEJveEtleXdvcmRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWRlbmNlOiAwLjYsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIDQuIOS7jue7p+aJv+eahOWFs+mUruivjeaPkOWPlu+8iOmAmui/h3dpbmRvdy5uYW1l5Lyg6YCS77yJXG4gICAgICAgICAgICAgICAgY29uc3QgaW5oZXJpdGVkS2V5d29yZHMgPSB0aGlzLmV4dHJhY3RGcm9tSW5oZXJpdGVkKClcbiAgICAgICAgICAgICAgICBpZiAoaW5oZXJpdGVkS2V5d29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2luaGVyaXRlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXdvcmRzOiBpbmhlcml0ZWRLZXl3b3JkcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlkZW5jZTogMC44LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmjInlj6/kv6HluqbpmY3luo/mjpLluo9cbiAgICAgICAgICAgICAgICByZXR1cm4gc291cmNlcy5zb3J0KChhLCBiKSA9PiBiLmNvbmZpZGVuY2UgLSBhLmNvbmZpZGVuY2UpXG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGV4dHJhY3RGcm9tU2VhcmNoRW5naW5lKCk6IHN0cmluZ1tdIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50VXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWZcbiAgICAgICAgICAgICAgICBjb25zdCBob3N0ID0gd2luZG93LmxvY2F0aW9uLmhvc3RcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZW5naW5lIG9mIHRoaXMuc2VhcmNoRW5naW5lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUudXJsUGF0dGVybiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3N0LmluY2x1ZGVzKGVuZ2luZS51cmxQYXR0ZXJuKVxuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXdvcmRzID0gdGhpcy5nZXRLZXl3b3Jkc0Zyb21VcmwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUua2V5d29yZFBhcmFtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleXdvcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2V5d29yZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgZXh0cmFjdEZyb21SZWZlcmVyKCk6IHN0cmluZ1tdIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZWZlcmVyID0gZG9jdW1lbnQucmVmZXJyZXJcbiAgICAgICAgICAgICAgICBpZiAoIXJlZmVyZXIpIHJldHVybiBbXVxuXG4gICAgICAgICAgICAgICAgY29uc3QgaG9zdCA9IG5ldyBVUkwocmVmZXJlcikuaG9zdFxuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBlbmdpbmUgb2YgdGhpcy5zZWFyY2hFbmdpbmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS51cmxQYXR0ZXJuICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvc3QuaW5jbHVkZXMoZW5naW5lLnVybFBhdHRlcm4pXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5d29yZHMgPSB0aGlzLmdldEtleXdvcmRzRnJvbVVybChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5rZXl3b3JkUGFyYW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5d29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXl3b3Jkc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBleHRyYWN0RnJvbUlucHV0Qm94ZXMoKTogc3RyaW5nW10ge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgdGhpcy5pbnB1dFNlbGVjdG9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQgJiYgaW5wdXQudmFsdWUgJiYgaW5wdXQudmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb2Nlc3NLZXl3b3JkcyhpbnB1dC52YWx1ZS50cmltKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBleHRyYWN0RnJvbUluaGVyaXRlZCgpOiBzdHJpbmdbXSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm5hbWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5uYW1lLnN0YXJ0c1dpdGgoJ2JyZWFkX2hpZ2hsaWdodDo6JylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gd2luZG93Lm5hbWUubWF0Y2goL2JyZWFkX2hpZ2hsaWdodDo6KC4rKS8pXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2hbMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkZWNvZGVkID0gZGVjb2RlVVJJQ29tcG9uZW50KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvY2Vzc0tleXdvcmRzKGRlY29kZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBnZXRLZXl3b3Jkc0Zyb21VcmwodXJsOiBzdHJpbmcsIHBhcmFtOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVybE9iaiA9IG5ldyBVUkwodXJsKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5d29yZFN0ciA9IHVybE9iai5zZWFyY2hQYXJhbXMuZ2V0KHBhcmFtKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleXdvcmRTdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvY2Vzc0tleXdvcmRzKGtleXdvcmRTdHIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHByb2Nlc3NLZXl3b3JkcyhrZXl3b3JkU3RyOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgICAgICAgICAgICAgbGV0IHByb2Nlc3NlZCA9IGtleXdvcmRTdHIucmVwbGFjZSgvXFwrL2csICcgJykudHJpbSgpXG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkID0gZGVjb2RlVVJJQ29tcG9uZW50KHByb2Nlc3NlZClcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBrZXl3b3JkcyA9IHRoaXMuc3BsaXRLZXl3b3Jkcyhwcm9jZXNzZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyS2V5d29yZHMoa2V5d29yZHMpXG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHNwbGl0S2V5d29yZHModGV4dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleXdvcmRzOiBzdHJpbmdbXSA9IFtdXG5cbiAgICAgICAgICAgICAgICBjb25zdCBzZWdtZW50cyA9IHRleHQuc3BsaXQoL1tcXHMs77yM44CBO++8m10rLylcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHNlZ21lbnQgb2Ygc2VnbWVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWdtZW50LnRyaW0oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXl3b3Jkcy5wdXNoKHNlZ21lbnQudHJpbSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBrZXl3b3Jkc1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBmaWx0ZXJLZXl3b3JkcyhrZXl3b3Jkczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2tpcFdvcmRzID0gbmV3IFNldChbXG4gICAgICAgICAgICAgICAgICAgICAgICAndGhlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICd0bycsXG4gICAgICAgICAgICAgICAgICAgICAgICAnaW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdhbW9uZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAnYmV0d2VlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnYW5kJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnb2YnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2J5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICd3aXRoJyxcbiAgICAgICAgICAgICAgICBdKVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleXdvcmRzLmZpbHRlcigoa2V5d29yZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleXdvcmQubGVuZ3RoIDw9IDEpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBza2lwV29yZHMuaGFzKGtleXdvcmQudG9Mb3dlckNhc2UoKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5d29yZCA9PT0ga2V5d29yZC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzZXRXaW5kb3dLZXl3b3JkcyhrZXl3b3Jkczogc3RyaW5nW10pIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5d29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZW5jb2RlZCA9IGVuY29kZVVSSUNvbXBvbmVudChrZXl3b3Jkcy5qb2luKCcgJykpXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubmFtZSA9IGBicmVhZF9oaWdobGlnaHQ6OiR7ZW5jb2RlZH1gXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG4iLCIvKipcbiAqIOmrmOS6ruivjemFjee9ruaOpeWPo1xuICog5a6a5LmJ5Y2V5Liq6auY5Lqu6K+N55qE5a6M5pW06YWN572u5L+h5oGvXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSGlnaGxpZ2h0V29yZCB7XG4gICAgICAgIHRleHQ6IHN0cmluZyAvLyDopoHljLnphY3nmoTmlofmnKzlhoXlrrlcbiAgICAgICAgZW5hYmxlZDogYm9vbGVhbiAvLyDmmK/lkKblkK/nlKjmraTpq5jkuq7or41cbiAgICAgICAgY29sb3JJbmRleDogbnVtYmVyIC8vIOminOiJsue0ouW8le+8jOWvueW6lOminOiJsuaWueahiOS4reeahOminOiJslxuICAgICAgICBjYXNlU2Vuc2l0aXZlOiBib29sZWFuIC8vIOaYr+WQpuWMuuWIhuWkp+Wwj+WGmVxuICAgICAgICByZWdleDogYm9vbGVhbiAvLyDmmK/lkKbkvb/nlKjmraPliJnooajovr7lvI/ljLnphY1cbn1cblxuLyoqXG4gKiDpq5jkuq7lip/og73lhajlsYDphY3nva7mjqXlj6NcbiAqIOaOp+WItumrmOS6ruWKn+iDveeahOaVtOS9k+ihjOS4uuWSjOiuvue9rlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEhpZ2hsaWdodENvbmZpZyB7XG4gICAgICAgIHdvcmRzOiBIaWdobGlnaHRXb3JkW10gLy8g6auY5Lqu6K+N5YiX6KGoXG4gICAgICAgIGF1dG9FeHRyYWN0OiBib29sZWFuIC8vIOaYr+WQpuiHquWKqOS7juaQnOe0ouW8leaTjuaPkOWPluWFs+mUruivjVxuICAgICAgICBjb2xvclNjaGVtZTogbnVtYmVyIC8vIOminOiJsuaWueahiOe0ouW8le+8jOWvueW6lFNUWUxFX0NPTE9SU+aVsOe7hFxuICAgICAgICBza2lwU2hvcnRXb3JkczogYm9vbGVhbiAvLyDmmK/lkKbot7Pov4fnn63or43vvIjplb/luqblsI/kuo4z55qE5Y2V6K+N77yJXG4gICAgICAgIHNvcnRCeUxlbmd0aDogYm9vbGVhbiAvLyDmmK/lkKbmjInor43plb/mjpLluo/pq5jkuq7or41cbiAgICAgICAgc2hvd0luZGljYXRvcjogYm9vbGVhbiAvLyDmmK/lkKbmmL7npLrpq5jkuq7mjIfnpLrlmahcbn1cblxuLyoqXG4gKiDpooTlrprkuYnpq5jkuq7popzoibLmlrnmoYhcbiAqIOaPkOS+m+Wkmue7hOe+juingueahOminOiJsuaWueahiO+8jOavj+e7hOWMheWQqzEw56eN6aKc6ImyXG4gKi9cbmV4cG9ydCBjb25zdCBTVFlMRV9DT0xPUlMgPSBbXG4gICAgICAgIFtcbiAgICAgICAgICAgICAgICAnI0ZGRkY4MCcsXG4gICAgICAgICAgICAgICAgJyM5OWNjZmYnLFxuICAgICAgICAgICAgICAgICcjZmY5OWNjJyxcbiAgICAgICAgICAgICAgICAnIzY2Y2M2NicsXG4gICAgICAgICAgICAgICAgJyNjYzk5ZmYnLFxuICAgICAgICAgICAgICAgICcjZmZjYzY2JyxcbiAgICAgICAgICAgICAgICAnIzY2YWFhYScsXG4gICAgICAgICAgICAgICAgJyNkZDk5NjYnLFxuICAgICAgICAgICAgICAgICcjYWFhYWFhJyxcbiAgICAgICAgICAgICAgICAnI2RkNjY5OScsXG4gICAgICAgIF0sIC8vIOaWueahiDDvvJrmmI7kuq7oibLns7tcbiAgICAgICAgW1xuICAgICAgICAgICAgICAgICcjRkZGRmEwJyxcbiAgICAgICAgICAgICAgICAnI2JiZWVmZicsXG4gICAgICAgICAgICAgICAgJyNmZmJiY2MnLFxuICAgICAgICAgICAgICAgICcjODhlZTg4JyxcbiAgICAgICAgICAgICAgICAnI2NjYmJmZicsXG4gICAgICAgICAgICAgICAgJyNmZmVlODgnLFxuICAgICAgICAgICAgICAgICcjODhjY2NjJyxcbiAgICAgICAgICAgICAgICAnI2ZmYmI4OCcsXG4gICAgICAgICAgICAgICAgJyNjY2NjY2MnLFxuICAgICAgICAgICAgICAgICcjZmZhYWJiJyxcbiAgICAgICAgXSwgLy8g5pa55qGIMe+8muaflOWSjOiJsuezu1xuICAgICAgICBbXG4gICAgICAgICAgICAgICAgJyNENkUxOUMnLFxuICAgICAgICAgICAgICAgICcjQTJCRkUxJyxcbiAgICAgICAgICAgICAgICAnI0RDOTVCRicsXG4gICAgICAgICAgICAgICAgJyMxRkM2QjInLFxuICAgICAgICAgICAgICAgICcjOTI4QUQzJyxcbiAgICAgICAgICAgICAgICAnI0U0Qzk5NCcsXG4gICAgICAgICAgICAgICAgJyM5NENDQzMnLFxuICAgICAgICAgICAgICAgICcjRDVCODdDJyxcbiAgICAgICAgICAgICAgICAnI0IyRDFEMycsXG4gICAgICAgICAgICAgICAgJyNERDhEQjAnLFxuICAgICAgICBdLCAvLyDmlrnmoYgy77ya6Ieq54S26Imy57O7XG4gICAgICAgIFtcbiAgICAgICAgICAgICAgICAnI2ZmNzU3NScsXG4gICAgICAgICAgICAgICAgJyNmZjkxNzUnLFxuICAgICAgICAgICAgICAgICcjZmZjYTc1JyxcbiAgICAgICAgICAgICAgICAnI2ZmZmY3NScsXG4gICAgICAgICAgICAgICAgJyM3NWZmNzUnLFxuICAgICAgICAgICAgICAgICcjNzVmZmYxJyxcbiAgICAgICAgICAgICAgICAnIzc1YzFmZicsXG4gICAgICAgICAgICAgICAgJyM3NTdhZmYnLFxuICAgICAgICAgICAgICAgICcjZDY3NWZmJyxcbiAgICAgICAgICAgICAgICAnI2ZmNzVjYycsXG4gICAgICAgIF0sIC8vIOaWueahiDPvvJrpspzoibPoibLns7tcbiAgICAgICAgW1xuICAgICAgICAgICAgICAgICcjRUJEOUNCJyxcbiAgICAgICAgICAgICAgICAnI0Q4QjBCMCcsXG4gICAgICAgICAgICAgICAgJyNBQ0Q0RDYnLFxuICAgICAgICAgICAgICAgICcjQzNCQUIxJyxcbiAgICAgICAgICAgICAgICAnI0U3QURBQycsXG4gICAgICAgICAgICAgICAgJyNFQkMxQTgnLFxuICAgICAgICAgICAgICAgICcjQTZCQUFGJyxcbiAgICAgICAgICAgICAgICAnI0I5OEE4MicsXG4gICAgICAgICAgICAgICAgJyNlOGQxY2InLFxuICAgICAgICAgICAgICAgICcjREVDRUNFJyxcbiAgICAgICAgXSwgLy8g5pa55qGINO+8muWkjeWPpOiJsuezu1xuICAgICAgICBbXG4gICAgICAgICAgICAgICAgJyNGRkYzNkQnLFxuICAgICAgICAgICAgICAgICcjOERFOTcxJyxcbiAgICAgICAgICAgICAgICAnI0ZGQ0Q4QScsXG4gICAgICAgICAgICAgICAgJyNGRkFDQjYnLFxuICAgICAgICAgICAgICAgICcjRjNDOUU0JyxcbiAgICAgICAgICAgICAgICAnI0ZGOURFNScsXG4gICAgICAgICAgICAgICAgJyM2REQ1QzMnLFxuICAgICAgICAgICAgICAgICcjQjI5RUU3JyxcbiAgICAgICAgICAgICAgICAnI0E2RERFQScsXG4gICAgICAgICAgICAgICAgJyM1MEMyRTEnLFxuICAgICAgICBdLCAvLyDmlrnmoYg177ya546w5Luj6Imy57O7XG5dXG5cbi8qKlxuICog6aKE5a6a5LmJ6L655qGG6aKc6Imy5pa55qGIXG4gKiDkuI5TVFlMRV9DT0xPUlPlr7nlupTnmoTovrnmoYbpopzoibLvvIznlKjkuo7pq5jkuq7moYbnmoTovrnmoYZcbiAqL1xuZXhwb3J0IGNvbnN0IEJPUkRFUl9DT0xPUlMgPSBbXG4gICAgICAgIFtcbiAgICAgICAgICAgICAgICAnI2FhYWEyMCcsXG4gICAgICAgICAgICAgICAgJyM0NDc3YWEnLFxuICAgICAgICAgICAgICAgICcjYWE0NDc3JyxcbiAgICAgICAgICAgICAgICAnIzExNzcxMScsXG4gICAgICAgICAgICAgICAgJyM3NzQ0YWEnLFxuICAgICAgICAgICAgICAgICcjYWE3NzExJyxcbiAgICAgICAgICAgICAgICAnIzExNTU1NScsXG4gICAgICAgICAgICAgICAgJyM4ODQ0MTEnLFxuICAgICAgICAgICAgICAgICcjNTU1NTU1JyxcbiAgICAgICAgICAgICAgICAnIzg4MTE0NCcsXG4gICAgICAgIF0sIC8vIOaWueahiDDlr7nlupTnmoTovrnmoYboibJcbiAgICAgICAgW1xuICAgICAgICAgICAgICAgICcjYWFhYTQwJyxcbiAgICAgICAgICAgICAgICAnIzY2OTlhYScsXG4gICAgICAgICAgICAgICAgJyNhYTY2OTknLFxuICAgICAgICAgICAgICAgICcjMzM5OTMzJyxcbiAgICAgICAgICAgICAgICAnIzk5NjZhYScsXG4gICAgICAgICAgICAgICAgJyNhYTk5MzMnLFxuICAgICAgICAgICAgICAgICcjMzM3Nzc3JyxcbiAgICAgICAgICAgICAgICAnI2FhNjYzMycsXG4gICAgICAgICAgICAgICAgJyM3Nzc3NzcnLFxuICAgICAgICAgICAgICAgICcjYWEzMzY2JyxcbiAgICAgICAgXSwgLy8g5pa55qGIMeWvueW6lOeahOi+ueahhuiJslxuICAgICAgICBbXG4gICAgICAgICAgICAgICAgJyNhZWI3ODAnLFxuICAgICAgICAgICAgICAgICcjODY5ZWI5JyxcbiAgICAgICAgICAgICAgICAnIzllNmM4OScsXG4gICAgICAgICAgICAgICAgJyMxNTg2NzknLFxuICAgICAgICAgICAgICAgICcjNWY1OTg4JyxcbiAgICAgICAgICAgICAgICAnIzhiN2I1OScsXG4gICAgICAgICAgICAgICAgJyM1ZTgzN2MnLFxuICAgICAgICAgICAgICAgICcjOGE3NzUwJyxcbiAgICAgICAgICAgICAgICAnIzcyODc4OScsXG4gICAgICAgICAgICAgICAgJyM5NTVmNzcnLFxuICAgICAgICBdLCAvLyDmlrnmoYgy5a+55bqU55qE6L655qGG6ImyXG4gICAgICAgIFtcbiAgICAgICAgICAgICAgICAnI2JlNTg1OCcsXG4gICAgICAgICAgICAgICAgJyNiODZhNTYnLFxuICAgICAgICAgICAgICAgICcjYjg5MjU0JyxcbiAgICAgICAgICAgICAgICAnI2I4Yjg1NScsXG4gICAgICAgICAgICAgICAgJyM1MmI2NTInLFxuICAgICAgICAgICAgICAgICcjNTRiNmFjJyxcbiAgICAgICAgICAgICAgICAnIzRmODViMicsXG4gICAgICAgICAgICAgICAgJyM0ZjUzYjMnLFxuICAgICAgICAgICAgICAgICcjOTQ1MGIyJyxcbiAgICAgICAgICAgICAgICAnI2FkNGU4YScsXG4gICAgICAgIF0sIC8vIOaWueahiDPlr7nlupTnmoTovrnmoYboibJcbiAgICAgICAgW1xuICAgICAgICAgICAgICAgICcjYWM5Zjk1JyxcbiAgICAgICAgICAgICAgICAnIzk0Nzg3OCcsXG4gICAgICAgICAgICAgICAgJyM3NDhlOGYnLFxuICAgICAgICAgICAgICAgICcjN2Y3OTczJyxcbiAgICAgICAgICAgICAgICAnIzk1NmU2ZScsXG4gICAgICAgICAgICAgICAgJyM5NzdhNmEnLFxuICAgICAgICAgICAgICAgICcjNmE3NjZmJyxcbiAgICAgICAgICAgICAgICAnIzZkNTI0ZCcsXG4gICAgICAgICAgICAgICAgJyM5NDg2ODInLFxuICAgICAgICAgICAgICAgICcjOTI4Nzg3JyxcbiAgICAgICAgXSwgLy8g5pa55qGINOWvueW6lOeahOi+ueahhuiJslxuICAgICAgICBbXG4gICAgICAgICAgICAgICAgJyNiYmIyNTAnLFxuICAgICAgICAgICAgICAgICcjNjJhMjRmJyxcbiAgICAgICAgICAgICAgICAnI2I2OTE2MCcsXG4gICAgICAgICAgICAgICAgJyNiNTc5ODAnLFxuICAgICAgICAgICAgICAgICcjYWQ4ZWEyJyxcbiAgICAgICAgICAgICAgICAnI2FlNjc5YicsXG4gICAgICAgICAgICAgICAgJyM0ODkyODUnLFxuICAgICAgICAgICAgICAgICcjN2I2ZGEyJyxcbiAgICAgICAgICAgICAgICAnIzZmOTU5ZScsXG4gICAgICAgICAgICAgICAgJyMzNDgxOTYnLFxuICAgICAgICBdLCAvLyDmlrnmoYg15a+55bqU55qE6L655qGG6ImyXG5dXG5cbi8qKlxuICog6buY6K6k6auY5Lqu6YWN572uXG4gKiDpq5jkuq7lip/og73nmoTliJ3lp4vpu5jorqTorr7nva5cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfQ09ORklHOiBIaWdobGlnaHRDb25maWcgPSB7XG4gICAgICAgIHdvcmRzOiBbXSwgLy8g6buY6K6k6auY5Lqu6K+N5YiX6KGo5Li656m6XG4gICAgICAgIGF1dG9FeHRyYWN0OiB0cnVlLCAvLyDpu5jorqTlkK/nlKjoh6rliqjmj5Dlj5ZcbiAgICAgICAgY29sb3JTY2hlbWU6IDAsIC8vIOm7mOiupOS9v+eUqOesrOS4gOS4quminOiJsuaWueahiFxuICAgICAgICBza2lwU2hvcnRXb3JkczogdHJ1ZSwgLy8g6buY6K6k6Lez6L+H55+t6K+NXG4gICAgICAgIHNvcnRCeUxlbmd0aDogdHJ1ZSwgLy8g6buY6K6k5oyJ6K+N6ZW/5o6S5bqPXG4gICAgICAgIHNob3dJbmRpY2F0b3I6IHRydWUsIC8vIOm7mOiupOaYvuekuuaMh+ekuuWZqFxufVxuXG4vKipcbiAqIOWIm+W7uumrmOS6ruivjeWvueixoVxuICogQHBhcmFtIHRleHQg6KaB5Yy56YWN55qE5paH5pysXG4gKiBAcGFyYW0gZW5hYmxlZCDmmK/lkKblkK/nlKjvvIzpu5jorqTkuLp0cnVlXG4gKiBAcmV0dXJucyDlrozmlbTnmoTpq5jkuq7or43phY3nva7lr7nosaFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUhpZ2hsaWdodFdvcmQoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZW5hYmxlZDogYm9vbGVhbiA9IHRydWVcbik6IEhpZ2hsaWdodFdvcmQge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICAgICAgZW5hYmxlZCxcbiAgICAgICAgICAgICAgICBjb2xvckluZGV4OiAwLCAvLyDpu5jorqTkvb/nlKjnrKzkuIDkuKrpopzoibJcbiAgICAgICAgICAgICAgICBjYXNlU2Vuc2l0aXZlOiBmYWxzZSwgLy8g6buY6K6k5LiN5Yy65YiG5aSn5bCP5YaZXG4gICAgICAgICAgICAgICAgcmVnZXg6IGZhbHNlLCAvLyDpu5jorqTkuI3kvb/nlKjmraPliJnooajovr7lvI9cbiAgICAgICAgfVxufVxuXG4vKipcbiAqIOiOt+WPlumrmOS6ruagt+W8j0NTU+Wtl+espuS4slxuICogQHBhcmFtIGNvbG9yU2NoZW1lIOminOiJsuaWueahiOe0ouW8le+8jOm7mOiupOS4ujBcbiAqIEByZXR1cm5zIOWMheWQq+aJgOaciemrmOS6ruminOiJsueahENTU+agt+W8j+Wtl+espuS4slxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0U3R5bGUoY29sb3JTY2hlbWU6IG51bWJlciA9IDApOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBjb2xvcnMgPSBTVFlMRV9DT0xPUlNbY29sb3JTY2hlbWVdIHx8IFNUWUxFX0NPTE9SU1swXVxuICAgICAgICBjb25zdCBib3JkZXJDb2xvcnMgPSBCT1JERVJfQ09MT1JTW2NvbG9yU2NoZW1lXSB8fCBCT1JERVJfQ09MT1JTWzBdXG5cbiAgICAgICAgbGV0IHN0eWxlcyA9ICcnXG5cbiAgICAgICAgLy8g5Li65q+P56eN6aKc6Imy55Sf5oiQ5a+55bqU55qEQ1NT57G7XG4gICAgICAgIGNvbG9ycy5mb3JFYWNoKChjb2xvciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBzdHlsZXMgKz0gYFxuICAgICAgICAgICAgLmJyZWFkLWhpZ2hsaWdodC1jb2xvci0ke2luZGV4fSB7XG4gICAgICAgICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICR7Y29sb3J9ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgY29sb3I6IGJsYWNrICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogMCAxcHggIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiAycHggIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAke2JvcmRlckNvbG9yc1tpbmRleF19ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIGBcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gc3R5bGVzXG59XG4iLCIvLyBoaWdobGlnaHROb2RlLnRzXG5pbXBvcnQgeyBnZXRUZXh0V2Fsa2VyLCBHZXRUZXh0Tm9kZXNPcHRpb25zIH0gZnJvbSAnLi4vLi4vdXRpbHMvZG9tL3RleHROb2RlcydcbmludGVyZmFjZSBUZXh0Tm9kZUVudHJ5IHtcbiAgICAgICAgbm9kZTogVGV4dFxuICAgICAgICBzdGFydDogbnVtYmVyXG4gICAgICAgIGVuZDogbnVtYmVyXG59XG5cbi8qKlxuICog6I635Y+W5oyH5a6a5qC56IqC54K55LiL5omA5pyJ56ym5ZCI5p2h5Lu255qE5paH5pys6IqC54K5XG4gKlxuICogQHBhcmFtIHJvb3QgLSDpgY3ljobnmoTotbflp4vmoLnoioLngrnvvIzpu5jorqTkuLpkb2N1bWVudC5ib2R5XG4gKiBAcGFyYW0gb3B0aW9ucyAtIOmFjee9rumAiemhueWvueixoVxuICogQHBhcmFtIG9wdGlvbnMuZXhjbHVkZUhpZGRlbiAtIOaYr+WQpuaOkumZpOmakOiXj+WFg+e0oO+8iOm7mOiupHRydWXvvIlcbiAqIEBwYXJhbSBvcHRpb25zLm1pbkNvbnRlbnRMZW5ndGggLSDmlofmnKzlhoXlrrnnmoTmnIDlsI/plb/luqbopoHmsYLvvIjpu5jorqQx77yJXG4gKiBAcmV0dXJucyDnrKblkIjov4fmu6TmnaHku7bnmoTmlofmnKzoioLngrnmlbDnu4RcbiAqXG4gKiDlip/og73or7TmmI7vvJpcbiAqIDEuIOiHquWKqOaOkumZpOmihOWumuS5ieeahOmdnuWGheWuueWei+agh+etvu+8iGlucHV0L3RleHRhcmVh562J77yJXG4gKiAyLiDlj6/pgInov4fmu6TpmpDol4/lhYPntKDvvIjpgJrov4dDU1PorqHnrpfmoLflvI/liKTmlq3vvIlcbiAqIDMuIOi/h+a7pOepuueZveWGheWuueWPiua7oei2s+acgOWwj+mVv+W6puimgeaxgueahOaWh+acrFxuICovXG5mdW5jdGlvbiBnZXRUZXh0cyhcbiAgICAgICAgcm9vdDogTm9kZSA9IGRvY3VtZW50LmJvZHksXG4gICAgICAgIG9wdGlvbnM6IEdldFRleHROb2Rlc09wdGlvbnMgPSB7fVxuKTogeyB0ZXh0czogVGV4dE5vZGVFbnRyeVtdOyBtZXJnZWRUZXh0OiBzdHJpbmcgfSB7XG4gICAgICAgIC8vIOWIm+W7ulRyZWVXYWxrZXLov5vooYzoioLngrnpgY3ljobvvIzphY3nva7lpI3lkIjov4fmu6TmnaHku7ZcbiAgICAgICAgY29uc3Qgd2Fsa2VyID0gZ2V0VGV4dFdhbGtlcihyb290LCBvcHRpb25zKVxuXG4gICAgICAgIGNvbnN0IHRleHRzOiBUZXh0Tm9kZUVudHJ5W10gPSBbXVxuICAgICAgICBsZXQgb2Zmc2V0ID0gMFxuICAgICAgICBsZXQgbWVyZ2VkVGV4dEJ1aWxkZXIgPSAnJ1xuXG4gICAgICAgIC8vIOmBjeWOhuaUtumbhuaJgOacieespuWQiOadoeS7tueahOaWh+acrOiKgueCuVxuICAgICAgICB3aGlsZSAod2Fsa2VyLm5leHROb2RlKCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gd2Fsa2VyLmN1cnJlbnROb2RlIGFzIFRleHRcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygn5o2V6I636IqC54K5OicsIEpTT04uc3RyaW5naWZ5KG5vZGUudGV4dENvbnRlbnQpKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gbm9kZS50ZXh0Q29udGVudCB8fCAnJ1xuICAgICAgICAgICAgICAgIG1lcmdlZFRleHRCdWlsZGVyICs9IHRleHQudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIHRleHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBvZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IG9mZnNldCArIHRleHQubGVuZ3RoLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRleHQubGVuZ3RoXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRleHRzLFxuICAgICAgICAgICAgICAgIG1lcmdlZFRleHQ6IG1lcmdlZFRleHRCdWlsZGVyLFxuICAgICAgICB9XG59XG5cbi8qKlxuICog6auY5Lqu5pi+56S65paH5qGj5Lit5LiO5oyH5a6a5paH5pys5Yy56YWN55qE5paH5pys6IqC54K5XG4gKlxuICogQHBhcmFtIHRleHQgLSDopoHpq5jkuq7nmoTmlofmnKxcbiAqIEBwYXJhbSByb290IC0g6ZyA6KaB6YGN5Y6G55qERE9N5qC56IqC54K577yM6buY6K6k5Li6ZG9jdW1lbnQuYm9keeOAguWHveaVsOS8muWcqOatpOiKgueCueeahOWtkOagkeS4reafpeaJvuWMuemFjVxuICogQHBhcmFtIGV4Y2x1ZGVTZWxlY3Rpb24gLSDmmK/lkKbmjpLpmaTlvZPliY3pgInkuK3mlofmnKzvvIzpu5jorqTkuLp0cnVlXG4gKiBAcGFyYW0gY29sb3JJbmRleCAtIOminOiJsue0ouW8le+8jOm7mOiupOS4ujBcbiAqIEByZXR1cm5zIHZvaWQg5pys5Ye95pWw5LiN6L+U5Zue5Lu75L2V5YC8XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoaWdobGlnaHRUZXh0SW5Ob2RlKFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHJvb3Q6IE5vZGUgPSBkb2N1bWVudC5ib2R5LFxuICAgICAgICBleGNsdWRlU2VsZWN0aW9uOiBib29sZWFuID0gdHJ1ZSxcbiAgICAgICAgY29sb3JJbmRleDogbnVtYmVyID0gMFxuKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiaGlnaGxpZ2h0VGV4dEluTm9kZVwiLCByb290KTtcblxuICAgICAgICAvLyDku4XlvZPlrZjlnKjmnInmlYjmlofmnKzml7bmiafooYzpq5jkuq5cbiAgICAgICAgaWYgKHRleHQgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgLy8g6I635Y+W5omA5pyJ5paH5pys6IqC54K55Y+K5YW25ZCI5bm25ZCO55qE5a6M5pW05paH5pys5YaF5a65XG4gICAgICAgICAgICAgICAgY29uc3QgeyB0ZXh0cywgbWVyZ2VkVGV4dCB9ID0gZ2V0VGV4dHMocm9vdClcblxuICAgICAgICAgICAgICAgIC8vIOWtmOWcqOacieaViOaWh+acrOaXtuaJp+ihjOWMuemFjemAu+i+kVxuICAgICAgICAgICAgICAgIGlmICh0ZXh0cy5sZW5ndGggPiAwICYmIHRleHQgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlnKjlkIjlubbmlofmnKzkuK3mn6Xmib7miYDmnInljLnphY3kvY3nva5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSBmaW5kTWF0Y2hlcyhtZXJnZWRUZXh0LCB0ZXh0KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmoLnmja7lj4LmlbDlhrPlrprmmK/lkKbov4fmu6TpgInkuK3mlofmnKxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWx0ZXJlZE1hdGNoZXMgPSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhjbHVkZVNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZE1hdGNoZXMgPSBtYXRjaGVzLmZpbHRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFpc0luU2VsZWN0aW9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6LCD6K+V5L+h5oGv77ya6L6T5Ye65omA5pyJ5Yy56YWN6aG56K+m5oOFXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLnRhYmxlKFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIG1hdGNoZXMubWFwKChtKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAuLi5tLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICB0ZXh0OiBtZXJnZWRUZXh0LnN1YnN0cmluZyhtLnN0YXJ0LCBtLmVuZCksXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlr7nov4fmu6TlkI7nmoTljLnphY3pobnlupTnlKjpq5jkuq5cbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodE1hdGNoZXModGV4dHMsIGZpbHRlcmVkTWF0Y2hlcywgY29sb3JJbmRleClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbi8qKlxuICog6auY5Lqu5pi+56S65paH5qGj5Lit5aSa5Liq5YWz6ZSu6K+NXG4gKlxuICogQHBhcmFtIHdvcmRzIC0g6KaB6auY5Lqu55qE5YWz6ZSu6K+N5pWw57uE77yI5a2X56ym5Liy5pWw57uE5oiW5bim6aKc6Imy57Si5byV55qE5a+56LGh5pWw57uE77yJXG4gKiBAcGFyYW0gcm9vdCAtIOmcgOimgemBjeWOhueahERPTeagueiKgueCue+8jOm7mOiupOS4umRvY3VtZW50LmJvZHlcbiAqIEByZXR1cm5zIHZvaWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhpZ2hsaWdodFdvcmRzSW5Eb2N1bWVudChcbiAgICAgICAgd29yZHM6IChzdHJpbmcgfCB7IHRleHQ6IHN0cmluZzsgY29sb3JJbmRleDogbnVtYmVyIH0pW10sXG4gICAgICAgIHJvb3Q6IE5vZGUgPSBkb2N1bWVudC5ib2R5XG4pIHtcbiAgICAgICAgLy8g5YWI56e76Zmk5omA5pyJ546w5pyJ6auY5LquXG4gICAgICAgIHJlbW92ZUhpZ2hsaWdodHMoKVxuXG4gICAgICAgIC8vIOWvueavj+S4quWFs+mUruivjei/m+ihjOmrmOS6ru+8iOS4jeaOkumZpOmAieS4reaWh+acrO+8ie+8jOS9v+eUqOS4jeWQjOeahOminOiJsue0ouW8lVxuICAgICAgICB3b3Jkcy5mb3JFYWNoKCh3b3JkLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCB0ZXh0OiBzdHJpbmdcbiAgICAgICAgICAgICAgICBsZXQgY29sb3JJbmRleDogbnVtYmVyXG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdvcmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gd29yZFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JJbmRleCA9IGluZGV4ICUgMTAgLy8g5L2/55SoMTDnp43popzoibLlvqrnjq9cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IHdvcmQudGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JJbmRleCA9IHdvcmQuY29sb3JJbmRleFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0ZXh0ICYmIHRleHQudHJpbSgpICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0VGV4dEluTm9kZSh0ZXh0LCByb290LCBmYWxzZSwgY29sb3JJbmRleClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVIaWdobGlnaHRzKCkge1xuICAgICAgICAvLyDmn6Xmib7miYDmnInpq5jkuq7lhYPntKBcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oJy5icmVhZC1oaWdobGlnaHQnKS5mb3JFYWNoKFxuICAgICAgICAgICAgICAgIChtYXJrKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDliJvlu7rmlrDnmoTmlofmnKzoioLngrnmm7/ku6Ppq5jkuq7lhYPntKBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyay50ZXh0Q29udGVudCB8fCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgbWFyay5wYXJlbnROb2RlPy5yZXBsYWNlQ2hpbGQodGV4dCwgbWFyaylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIClcbn1cblxuLyoqXG4gKiDliKTmlq3ljLnphY3pobnmmK/lkKblnKjlvZPliY3pgInkuK3nmoTmlofmnKzojIPlm7TlhoVcbiAqXG4gKiBAcGFyYW0gbWF0Y2ggLSDpnIDopoHmo4Dmn6XnmoTljLnphY3ojIPlm7RcbiAqIEBwYXJhbSB0ZXh0cyAtIOaWh+acrOiKgueCueS9jee9ruS/oeaBr+aVsOe7hFxuICogQHBhcmFtIHNlbGVjdGlvbiAtIOW9k+WJjeaWh+aho+mAieWMuuWvueixoVxuICogQHJldHVybnMg5aaC5p6c5Yy56YWN6aG55Zyo6YCJ5Yy65YaF6L+U5ZuedHJ1Ze+8jOWQpuWImWZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzSW5TZWxlY3Rpb24oXG4gICAgICAgIG1hdGNoOiBNYXRjaFJhbmdlLFxuICAgICAgICB0ZXh0czogVGV4dE5vZGVFbnRyeVtdLFxuICAgICAgICBzZWxlY3Rpb246IFNlbGVjdGlvbiB8IG51bGxcbik6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoIXNlbGVjdGlvbiB8fCBzZWxlY3Rpb24ucmFuZ2VDb3VudCA9PT0gMCkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgLy8g6I635Y+W56ys5LiA5Liq6YCJ5Yy66IyD5Zu077yI6YCa5bi45Y+q5pyJ5LiA5Liq77yJXG4gICAgICAgIGNvbnN0IHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMClcbiAgICAgICAgY29uc3QgeyBzdGFydENvbnRhaW5lciwgc3RhcnRPZmZzZXQsIGVuZENvbnRhaW5lciwgZW5kT2Zmc2V0IH0gPSByYW5nZVxuXG4gICAgICAgIC8vIOafpeaJvumAieWMuui1t+Wni+iKgueCueWvueW6lOeahOWFqOWxgOWBj+enu1xuICAgICAgICBjb25zdCBmaW5kR2xvYmFsT2Zmc2V0ID0gKG5vZGU6IE5vZGUsIG9mZnNldDogbnVtYmVyKTogbnVtYmVyID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRleHRzLmZpbmQoKHQpID0+IHQubm9kZSA9PT0gbm9kZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZW50cnkgPyBlbnRyeS5zdGFydCArIG9mZnNldCA6IC0xXG4gICAgICAgIH1cblxuICAgICAgICAvLyDorqHnrpfpgInljLrlhajlsYDojIPlm7RcbiAgICAgICAgY29uc3Qgc2VsU3RhcnQgPSBmaW5kR2xvYmFsT2Zmc2V0KHN0YXJ0Q29udGFpbmVyLCBzdGFydE9mZnNldClcbiAgICAgICAgY29uc3Qgc2VsRW5kID0gZmluZEdsb2JhbE9mZnNldChlbmRDb250YWluZXIsIGVuZE9mZnNldClcblxuICAgICAgICAvLyDmnInmlYjmgKfmo4Dmn6VcbiAgICAgICAgaWYgKHNlbFN0YXJ0ID09PSAtMSB8fCBzZWxFbmQgPT09IC0xKSByZXR1cm4gZmFsc2VcblxuICAgICAgICAvLyDliKTmlq3ljLnphY3ojIPlm7TmmK/lkKbkuI7pgInljLrojIPlm7Tph43lj6BcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAobWF0Y2guc3RhcnQgPj0gc2VsU3RhcnQgJiYgbWF0Y2guZW5kIDw9IHNlbEVuZCkgfHwgLy8g5a6M5YWo5YyF5ZCrXG4gICAgICAgICAgICAgICAgKG1hdGNoLnN0YXJ0IDwgc2VsRW5kICYmIG1hdGNoLmVuZCA+IHNlbFN0YXJ0KSAvLyDpg6jliIbph43lj6BcbiAgICAgICAgKVxufVxuXG5pbnRlcmZhY2UgTWF0Y2hSYW5nZSB7XG4gICAgICAgIHN0YXJ0OiBudW1iZXJcbiAgICAgICAgZW5kOiBudW1iZXJcbn1cblxuLyoqXG4gKiDlnKjnm67moIfmlofmnKzkuK3mn6Xmib7mjIflrprlrZDmlofmnKznmoTmiYDmnInljLnphY3ojIPlm7RcbiAqXG4gKiBAcGFyYW0gbWVyZ2VkVGV4dCDooqvmkJzntKLnmoTkuLvmlofmnKzlhoXlrrlcbiAqIEBwYXJhbSBzZWxlY3RlZFRleHQg6ZyA6KaB5p+l5om+55qE5a2Q5paH5pys5YaF5a65XG4gKiBAcmV0dXJucyDov5Tlm57ljIXlkKvmiYDmnInljLnphY3kvY3nva7kv6Hmga/nmoTmlbDnu4TvvIzmr4/kuKrlhYPntKDljIXlkKvljLnphY3nmoTotbflp4soc3RhcnQp5ZKM57uT5p2fKGVuZCnntKLlvJVcbiAqL1xuZnVuY3Rpb24gZmluZE1hdGNoZXMobWVyZ2VkVGV4dDogc3RyaW5nLCBzZWxlY3RlZFRleHQ6IHN0cmluZyk6IE1hdGNoUmFuZ2VbXSB7XG4gICAgICAgIGNvbnN0IG1hdGNoZXM6IE1hdGNoUmFuZ2VbXSA9IFtdXG5cbiAgICAgICAgLy8g5qOA5p+l5pCc57Si5paH5pys5pyJ5pWI5oCn77ya5b2T5pCc57Si5paH5pys5Li656m65pe25o+Q5YmN6L+U5ZueXG4gICAgICAgIGlmICghc2VsZWN0ZWRUZXh0IHx8IHNlbGVjdGVkVGV4dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgc2VhcmNoIHRleHQnKVxuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaGVzXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaW5kZXggPSAwXG5cbiAgICAgICAgLy8g5aSn5bCP5YaZ5b+955WlXG4gICAgICAgIGNvbnN0IHNlYXJjaFRleHQgPSBzZWxlY3RlZFRleHQudG9Mb3dlckNhc2UoKVxuICAgICAgICBjb25zdCBzZWFyY2hNZXJnZWRUZXh0ID0gbWVyZ2VkVGV4dC50b0xvd2VyQ2FzZSgpXG5cbiAgICAgICAgLy8g5b6q546v5p+l5om+5omA5pyJ5Yy56YWN6aG5XG4gICAgICAgIHdoaWxlICgoaW5kZXggPSBzZWFyY2hNZXJnZWRUZXh0LmluZGV4T2Yoc2VhcmNoVGV4dCwgaW5kZXgpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyDorrDlvZXljLnphY3ojIPlm7TvvIjlt6bpl63lj7PlvIDljLrpl7TvvIlcbiAgICAgICAgICAgICAgICBtYXRjaGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IGluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBpbmRleCArIHNlbGVjdGVkVGV4dC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICBpbmRleCArPSBzZWxlY3RlZFRleHQubGVuZ3RoIC8vIOi3s+i/h+W3suWMuemFjeWMuuWfn+e7p+e7reaQnOe0olxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hdGNoZXNcbn1cblxuLyoqXG4gKiDlnKjmlofmnKzoioLngrnkuK3pq5jkuq7mmL7npLrmjIflrprnmoTljLnphY3ojIPlm7RcbiAqXG4gKiBAcGFyYW0gdGV4dHMg5paH5pys6IqC54K55p2h55uu5pWw57uE77yM5YyF5ZCr6ZyA6KaB5aSE55CG55qE5paH5pys6IqC54K55Y+K5YW25L2N572u5L+h5oGvXG4gKiBAcGFyYW0gbWF0Y2hlcyDpnIDopoHpq5jkuq7nmoTljLnphY3ojIPlm7TmlbDnu4TvvIzljIXlkKvljp/lp4vmlofmoaPkuK3nmoTnu53lr7nkvY3nva7kv6Hmga9cbiAqIEByZXR1cm5zIHZvaWRcbiAqL1xuZnVuY3Rpb24gaGlnaGxpZ2h0TWF0Y2hlcyhcbiAgICAgICAgdGV4dHM6IFRleHROb2RlRW50cnlbXSxcbiAgICAgICAgbWF0Y2hlczogTWF0Y2hSYW5nZVtdLFxuICAgICAgICBjb2xvckluZGV4OiBudW1iZXIgPSAwXG4pOiB2b2lkIHtcbiAgICAgICAgLy8g6aKE5aSE55CG77ya5bCG5Yy56YWN6aG55oyJ6LW35aeL5L2N572u5o6S5bqPXG4gICAgICAgIGNvbnN0IHNvcnRlZE1hdGNoZXMgPSBbLi4ubWF0Y2hlc10uc29ydCgoYSwgYikgPT4gYS5zdGFydCAtIGIuc3RhcnQpXG5cbiAgICAgICAgdGV4dHMuZm9yRWFjaCgoZW50cnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gZW50cnkubm9kZVxuXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlIHx8ICFub2RlLnRleHRDb250ZW50KSByZXR1cm5cbiAgICAgICAgICAgICAgICBjb25zdCBub2RlQ29udGVudCA9IG5vZGUudGV4dENvbnRlbnQgfHwgJydcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeVN0YXJ0ID0gZW50cnkuc3RhcnRcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeUVuZCA9IGVudHJ5LmVuZFxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVMZW5ndGggPSBub2RlQ29udGVudC5sZW5ndGhcblxuICAgICAgICAgICAgICAgIC8vIOaJvuWHuuaJgOacieS4juW9k+WJjeaWh+acrOiKgueCueebuOWFs+eahOWMuemFjeiMg+WbtFxuICAgICAgICAgICAgICAgIGNvbnN0IHJlbGV2YW50TWF0Y2hlcyA9IHNvcnRlZE1hdGNoZXMuZmlsdGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgKG1hdGNoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaC5zdGFydCA8IGVudHJ5RW5kICYmIG1hdGNoLmVuZCA+IGVudHJ5U3RhcnRcbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAvLyDovazmjaLkuLrnm7jlr7nkuo7lvZPliY3oioLngrnnmoTlsYDpg6jojIPlm7RcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NhbFJhbmdlcyA9IHJlbGV2YW50TWF0Y2hlcy5tYXAoKG1hdGNoKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IE1hdGgubWF4KDAsIG1hdGNoLnN0YXJ0IC0gZW50cnlTdGFydCksXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IE1hdGgubWluKG5vZGVMZW5ndGgsIG1hdGNoLmVuZCAtIGVudHJ5U3RhcnQpLFxuICAgICAgICAgICAgICAgIH0pKVxuXG4gICAgICAgICAgICAgICAgLy8g5ZCI5bm26YeN5Y+gL+ebuOmCu+eahOiMg+WbtFxuICAgICAgICAgICAgICAgIGNvbnN0IG1lcmdlZFJhbmdlcyA9IG1lcmdlUmFuZ2VzKGxvY2FsUmFuZ2VzKVxuXG4gICAgICAgICAgICAgICAgaWYgKG1lcmdlZFJhbmdlcy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gICAgICAgICAgICAgICAgLy8g5oyJ6LW35aeL5L2N572u6ZmN5bqP5aSE55CG77yM6YG/5YWN5YiG5Ymy5b2x5ZON57Si5byVXG4gICAgICAgICAgICAgICAgbWVyZ2VkUmFuZ2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gYi5zdGFydCAtIGEuc3RhcnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZm9yRWFjaCgocmFuZ2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSByYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGDpq5jkuq7ojIPlm7Q6IFske3N0YXJ0fS0ke2VuZH1dIFwiJHtub2RlQ29udGVudC5zbGljZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBzdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBlbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICl9XCJgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5YiG5YmyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZSA9IG5vZGUuc3BsaXRUZXh0KHN0YXJ0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBoaWdobGlnaHRlZCA9IHByZS5zcGxpdFRleHQoZW5kIC0gc3RhcnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBjcmVhdGVNYXJrRWxlbWVudChjb2xvckluZGV4KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwYW4uYXBwZW5kQ2hpbGQocHJlLmNsb25lTm9kZSh0cnVlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5wYXJlbnROb2RlPy5yZXBsYWNlQ2hpbGQoc3BhbiwgcHJlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoaWdobGlnaHRlZC50ZXh0Q29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwYW4uYWZ0ZXIoaGlnaGxpZ2h0ZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG59XG5cbi8qKlxuICog5ZCI5bm26YeN5Y+g5oiW55u46YK755qE6IyD5Zu05Yy66Ze077yM6L+U5Zue5paw55qE5pyJ5bqP6IyD5Zu05pWw57uEXG4gKlxuICog5a6e546w5Y6f55CG77yaXG4gKiAxLiDlhYjlr7nojIPlm7TmjInotbflp4vkvY3nva7mjpLluo9cbiAqIDIuIOS+neasoeWQiOW5tuebuOmCu+eahOmHjeWPoOiMg+WbtFxuICpcbiAqIEBwYXJhbSByYW5nZXMgLSDpnIDopoHlkIjlubbnmoTojIPlm7TmlbDnu4TvvIzmr4/kuKrojIPlm7TlupTljIXlkKsgc3RhcnQg5ZKMIGVuZCDlsZ7mgKdcbiAqICAgICAgICAgICAgICAgICAo56S65L6LOiBbe3N0YXJ0OjEsZW5kOjN9LCB7c3RhcnQ6MixlbmQ6NX1dKVxuICogQHJldHVybnMg5ZCI5bm25ZCO55qE5paw6IyD5Zu05pWw57uE77yM5oyJ6LW35aeL5L2N572u5Y2H5bqP5o6S5YiX5LiU5peg6YeN5Y+gXG4gKiAgICAgICAgICAo56S65L6L6L6T5YWl6L+U5ZueOiBbe3N0YXJ0OjEsZW5kOjV9XSlcbiAqL1xuZnVuY3Rpb24gbWVyZ2VSYW5nZXMocmFuZ2VzOiBNYXRjaFJhbmdlW10pOiBNYXRjaFJhbmdlW10ge1xuICAgICAgICAvLyDlpITnkIbnqbrovpPlhaXnibnmrormg4XlhrVcbiAgICAgICAgaWYgKHJhbmdlcy5sZW5ndGggPT09IDApIHJldHVybiBbXVxuXG4gICAgICAgIC8vIOWIm+W7uuaOkuW6j+WJr+acrOS7peS/neaMgeWOn+Wni+aVsOaNruS4jeWPmO+8jOaMiei1t+Wni+S9jee9ruWNh+W6j+aOkuWIl1xuICAgICAgICBjb25zdCBzb3J0ZWQgPSBbLi4ucmFuZ2VzXS5zb3J0KChhLCBiKSA9PiBhLnN0YXJ0IC0gYi5zdGFydClcbiAgICAgICAgY29uc3QgbWVyZ2VkID0gW3NvcnRlZFswXV1cblxuICAgICAgICAvLyDpgY3ljoblpITnkIbmr4/kuKrojIPlm7TvvIzlkIjlubbph43lj6Av55u46YK755qE5Yy66Ze0XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgc29ydGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFzdCA9IG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gc29ydGVkW2ldXG5cbiAgICAgICAgICAgICAgICAvLyDlvZPlvZPliY3ljLrpl7TkuI7mnIDlkI7lkIjlubbljLrpl7Tph43lj6Dml7bvvIzmianlsZXlkIjlubbljLrpl7TnmoTnu5PmnZ/kvY3nva5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudC5zdGFydCA8PSBsYXN0LmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdC5lbmQgPSBNYXRoLm1heChsYXN0LmVuZCwgY3VycmVudC5lbmQpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmdnumHjeWPoOWMuumXtOebtOaOpea3u+WKoOWIsOe7k+aenOmbhlxuICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VkLnB1c2goY3VycmVudClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWVyZ2VkXG59XG5cbi8qKlxuICog5Yib5bu65LiA5Liq5bim5pyJ6auY5Lqu5qC35byP55qEc3BhbuWFg+e0oFxuICpcbiAqIOivpeWHveaVsOeUqOS6juWIm+W7uuS4gOS4quaWsOeahHNwYW7lhYPntKDvvIzlubbkuLrlhbborr7nva7nibnlrprnmoTmoLflvI/lkoznsbvlkI1cbiAqIOS7peS+v+WcqOmhtemdouS4remrmOS6ruaYvuekuuaWh+acrFxuICpcbiAqIEByZXR1cm5zIOi/lOWbnuS4gOS4quW4puaciemrmOS6ruagt+W8j+eahHNwYW7lhYPntKBcbiAqL1xuZnVuY3Rpb24gY3JlYXRlTWFya0VsZW1lbnQoY29sb3JJbmRleDogbnVtYmVyID0gMCk6IEhUTUxFbGVtZW50IHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ21hcmsnKVxuICAgICAgICBzcGFuLmNsYXNzTmFtZSA9IGBicmVhZC1oaWdobGlnaHQgYnJlYWQtaGlnaGxpZ2h0LWNvbG9yLSR7Y29sb3JJbmRleH1gXG4gICAgICAgIHJldHVybiBzcGFuXG59XG4iLCIvKipcbiAqIOmrmOS6ruivjeeuoeeQhuWZqFxuICog57uf5LiA566h55CG5omA5pyJ6KaB6auY5Lqu55qE6K+N77yM5YyF5ous5oyB5LmF6auY5Lqu5ZKM5pCc57Si5YWz6ZSu6K+NXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBIaWdobGlnaHRXb3JkIHtcbiAgICAgICAgdGV4dDogc3RyaW5nXG4gICAgICAgIGVuYWJsZWQ6IGJvb2xlYW5cbiAgICAgICAgY29sb3JJbmRleDogbnVtYmVyXG4gICAgICAgIGNhc2VTZW5zaXRpdmU6IGJvb2xlYW5cbiAgICAgICAgcmVnZXg6IGJvb2xlYW5cbiAgICAgICAgc291cmNlOiAncGVyc2lzdGVudCcgfCAnc2VhcmNoJyAvLyDmnaXmupDvvJrmjIHkuYXpq5jkuq7miJbmkJzntKLlhbPplK7or41cbn1cblxuZXhwb3J0IHR5cGUgV29yZHNVcGRhdGVDYWxsYmFjayA9ICh3b3JkczogSGlnaGxpZ2h0V29yZFtdKSA9PiB2b2lkXG5cbmNsYXNzIFdvcmRzTWFuYWdlciB7XG4gICAgICAgIHByaXZhdGUgcGVyc2lzdGVudFdvcmRzOiBIaWdobGlnaHRXb3JkW10gPSBbXVxuICAgICAgICBwcml2YXRlIHNlYXJjaFdvcmRzOiBIaWdobGlnaHRXb3JkW10gPSBbXVxuICAgICAgICBwcml2YXRlIGNhbGxiYWNrczogV29yZHNVcGRhdGVDYWxsYmFja1tdID0gW11cblxuICAgICAgICAvKipcbiAgICAgICAgICog5pu05paw5oyB5LmF6auY5Lqu6K+NXG4gICAgICAgICAqL1xuICAgICAgICB1cGRhdGVQZXJzaXN0ZW50V29yZHMod29yZHM6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgdGhpcy5wZXJzaXN0ZW50V29yZHMgPSB3b3Jkcy5tYXAoKHdvcmQsIGluZGV4KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9ySW5kZXg6IGluZGV4ICUgNSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlU2Vuc2l0aXZlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2V4OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogJ3BlcnNpc3RlbnQnLFxuICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5Q2FsbGJhY2tzKClcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmm7TmlrDmkJzntKLlhbPplK7or41cbiAgICAgICAgICovXG4gICAgICAgIHVwZGF0ZVNlYXJjaFdvcmRzKHdvcmRzOiBzdHJpbmdbXSk6IHZvaWQge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoV29yZHMgPSB3b3Jkcy5tYXAoKHdvcmQsIGluZGV4KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9ySW5kZXg6IChpbmRleCAlIDUpICsgNSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlU2Vuc2l0aXZlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2V4OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogJ3NlYXJjaCcsXG4gICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZnlDYWxsYmFja3MoKVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOa3u+WKoOmrmOS6ruivjVxuICAgICAgICAgKi9cbiAgICAgICAgYWRkV29yZHMod29yZHM6IEhpZ2hsaWdodFdvcmRbXSk6IHZvaWQge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgbmV3V29yZCBvZiB3b3Jkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5qOA5p+l5piv5ZCm5bey5a2Y5ZyoXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ1dvcmQgPSB0aGlzLmdldEFsbFdvcmRzKCkuZmluZChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHcpID0+IHcudGV4dCA9PT0gbmV3V29yZC50ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWV4aXN0aW5nV29yZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDmt7vliqDliLDmjIHkuYXpq5jkuq7or41cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wZXJzaXN0ZW50V29yZHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ubmV3V29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6ICdwZXJzaXN0ZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZnlDYWxsYmFja3MoKVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOenu+mZpOmrmOS6ruivjVxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlV29yZCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBlcnNpc3RlbnRXb3JkcyA9IHRoaXMucGVyc2lzdGVudFdvcmRzLmZpbHRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICh3KSA9PiB3LnRleHQgIT09IHRleHRcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZnlDYWxsYmFja3MoKVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWIh+aNoumrmOS6ruivjeeKtuaAgVxuICAgICAgICAgKi9cbiAgICAgICAgdG9nZ2xlV29yZCh0ZXh0OiBzdHJpbmcsIGVuYWJsZWQ/OiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd29yZCA9IHRoaXMuZ2V0QWxsV29yZHMoKS5maW5kKCh3KSA9PiB3LnRleHQgPT09IHRleHQpXG4gICAgICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmQuZW5hYmxlZCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQgIT09IHVuZGVmaW5lZCA/IGVuYWJsZWQgOiAhd29yZC5lbmFibGVkXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vdGlmeUNhbGxiYWNrcygpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOabtOaWsOmrmOS6ruivjVxuICAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlV29yZCh3b3JkOiBIaWdobGlnaHRXb3JkKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnBlcnNpc3RlbnRXb3Jkcy5maW5kSW5kZXgoXG4gICAgICAgICAgICAgICAgICAgICAgICAodykgPT4gdy50ZXh0ID09PSB3b3JkLnRleHRcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGVyc2lzdGVudFdvcmRzW2luZGV4XSA9IHdvcmRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5Q2FsbGJhY2tzKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog6I635Y+W5omA5pyJ6KaB6auY5Lqu55qE6K+NXG4gICAgICAgICAqL1xuICAgICAgICBnZXRBbGxXb3JkcygpOiBIaWdobGlnaHRXb3JkW10ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbLi4udGhpcy5wZXJzaXN0ZW50V29yZHMsIC4uLnRoaXMuc2VhcmNoV29yZHNdXG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog6I635Y+W5ZCv55So55qE6auY5Lqu6K+NXG4gICAgICAgICAqL1xuICAgICAgICBnZXRFbmFibGVkV29yZHMoKTogc3RyaW5nW10ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEFsbFdvcmRzKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKHdvcmQpID0+IHdvcmQuZW5hYmxlZClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHdvcmQpID0+IHdvcmQudGV4dClcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDojrflj5bpq5jkuq7or43nu5/orqFcbiAgICAgICAgICovXG4gICAgICAgIGdldFdvcmRTdGF0cyhcbiAgICAgICAgICAgICAgICB0ZXh0OiBzdHJpbmdcbiAgICAgICAgKTogeyBjb3VudDogbnVtYmVyOyB3b3JkOiBIaWdobGlnaHRXb3JkIH0gfCBudWxsIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3b3JkID0gdGhpcy5nZXRBbGxXb3JkcygpLmZpbmQoKHcpID0+IHcudGV4dCA9PT0gdGV4dClcbiAgICAgICAgICAgICAgICBpZiAod29yZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IDEsIC8vIOeugOWMluiuoeaVsFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JkLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOiOt+WPluaJgOaciemrmOS6ruivjee7n+iuoVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QWxsU3RhdHMoKToge1xuICAgICAgICAgICAgICAgIFt0ZXh0OiBzdHJpbmddOiB7IGNvdW50OiBudW1iZXI7IHdvcmQ6IEhpZ2hsaWdodFdvcmQgfVxuICAgICAgICB9IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGF0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgW3RleHQ6IHN0cmluZ106IHsgY291bnQ6IG51bWJlcjsgd29yZDogSGlnaGxpZ2h0V29yZCB9XG4gICAgICAgICAgICAgICAgfSA9IHt9XG5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHdvcmQgb2YgdGhpcy5nZXRBbGxXb3JkcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod29yZC5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzW3dvcmQudGV4dF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IDEsIC8vIOeugOWMluiuoeaVsFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdHNcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDms6jlhozor43mm7TmlrDlm57osINcbiAgICAgICAgICovXG4gICAgICAgIG9uV29yZHNVcGRhdGUoY2FsbGJhY2s6IFdvcmRzVXBkYXRlQ2FsbGJhY2spOiB2b2lkIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWPlua2iOazqOWGjOivjeabtOaWsOWbnuiwg1xuICAgICAgICAgKi9cbiAgICAgICAgb2ZmV29yZHNVcGRhdGUoY2FsbGJhY2s6IFdvcmRzVXBkYXRlQ2FsbGJhY2spOiB2b2lkIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzLnNwbGljZShpbmRleCwgMSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog6YCa55+l5omA5pyJ5Zue6LCDXG4gICAgICAgICAqL1xuICAgICAgICBwcml2YXRlIG5vdGlmeUNhbGxiYWNrcygpOiB2b2lkIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3b3JkcyA9IHRoaXMuZ2V0QWxsV29yZHMoKVxuICAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzLmZvckVhY2goKGNhbGxiYWNrKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh3b3JkcylcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1dvcmRzIHVwZGF0ZSBjYWxsYmFjayBlcnJvcjonLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9XG59XG5cbi8vIOWNleS+i+aooeW8j1xubGV0IGdsb2JhbFdvcmRzTWFuYWdlcjogV29yZHNNYW5hZ2VyIHwgbnVsbCA9IG51bGxcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFdvcmRzTWFuYWdlcigpOiBXb3Jkc01hbmFnZXIge1xuICAgICAgICBpZiAoIWdsb2JhbFdvcmRzTWFuYWdlcikge1xuICAgICAgICAgICAgICAgIGdsb2JhbFdvcmRzTWFuYWdlciA9IG5ldyBXb3Jkc01hbmFnZXIoKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnbG9iYWxXb3Jkc01hbmFnZXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lXb3Jkc01hbmFnZXIoKTogdm9pZCB7XG4gICAgICAgIGdsb2JhbFdvcmRzTWFuYWdlciA9IG51bGxcbn1cbiIsImltcG9ydCB7IEtleXdvcmRFeHRyYWN0b3IgfSBmcm9tICcuL2tleXdvcmRFeHRyYWN0b3InXG5pbXBvcnQgeyBIaWdobGlnaHRDb25maWcsIERFRkFVTFRfQ09ORklHIH0gZnJvbSAnLi9oaWdobGlnaHRDb25maWcnXG5pbXBvcnQgeyBnZXRLZXlXaXRoRG9tYWluIH0gZnJvbSAnLi4vLi4vdXRpbHMvc3RvcmFnZS9zdG9yYWdlJ1xuaW1wb3J0IHsgaGlnaGxpZ2h0V29yZHNJbkRvY3VtZW50LCByZW1vdmVIaWdobGlnaHRzIH0gZnJvbSAnLi9oaWdobGlnaHROb2RlJ1xuaW1wb3J0IHsgZ2V0SGlnaGxpZ2h0U3R5bGUgfSBmcm9tICcuL2hpZ2hsaWdodENvbmZpZydcbmltcG9ydCB7IG1hbmFnZU11dGF0aW9uT2JzZXJ2ZXIgfSBmcm9tICcuLi8uLi9vYnNlcnZlci9kb21NdXRhdGlvbk9ic2VydmVyJ1xuaW1wb3J0IHsgZ2V0V29yZHNNYW5hZ2VyLCBIaWdobGlnaHRXb3JkIH0gZnJvbSAnLi93b3Jkc01hbmFnZXInXG5cbi8qKlxuICog6auY5Lqu566h55CG5ZmoXG4gKiDotJ/otKPljY/osIPpq5jkuq7lip/og73nmoTlkITkuKrnu4Tku7bvvIzljIXmi6zphY3nva7nrqHnkIbjgIHlhbPplK7or43mj5Dlj5bjgIHpq5jkuq7miafooYznrYlcbiAqL1xuXG4vLyDlo7DmmI7lhajlsYBzdG9yYWdl5a+56LGhXG5kZWNsYXJlIGNvbnN0IHN0b3JhZ2U6IHtcbiAgICAgICAgZ2V0SXRlbTxUPihrZXk6IHN0cmluZyk6IFByb21pc2U8VCB8IG51bGw+XG4gICAgICAgIHNldEl0ZW08VD4oa2V5OiBzdHJpbmcsIHZhbHVlOiBUKTogUHJvbWlzZTx2b2lkPlxufVxuXG5leHBvcnQgY2xhc3MgSGlnaGxpZ2h0TWFuYWdlciB7XG4gICAgICAgIHByaXZhdGUgZXh0cmFjdG9yOiBLZXl3b3JkRXh0cmFjdG9yXG4gICAgICAgIHByaXZhdGUgY29uZmlnOiBIaWdobGlnaHRDb25maWdcbiAgICAgICAgcHJpdmF0ZSBpc0FjdGl2ZTogYm9vbGVhbiA9IGZhbHNlXG4gICAgICAgIHByaXZhdGUgc3R5bGVFbGVtZW50OiBIVE1MU3R5bGVFbGVtZW50IHwgbnVsbCA9IG51bGxcbiAgICAgICAgcHJpdmF0ZSB3b3Jkc01hbmFnZXIgPSBnZXRXb3Jkc01hbmFnZXIoKVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnID0geyAuLi5ERUZBVUxUX0NPTkZJRyB9XG4gICAgICAgICAgICAgICAgdGhpcy5leHRyYWN0b3IgPSBuZXcgS2V5d29yZEV4dHJhY3RvcigpXG4gICAgICAgICAgICAgICAgLy8g56Gu5L+d5qC35byP5Zyo5Yid5aeL5YyW5pe25bCx6KKr5rOo5YWlXG4gICAgICAgICAgICAgICAgdGhpcy5pbmplY3RTdHlsZXMoKVxuICAgICAgICAgICAgICAgIHRoaXMubG9hZENvbmZpZygpXG4gICAgICAgICAgICAgICAgLy8g5rOo5YaM6K+N5pu05paw5Zue6LCDXG4gICAgICAgICAgICAgICAgdGhpcy53b3Jkc01hbmFnZXIub25Xb3Jkc1VwZGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodEFsbCgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jIGxvYWRDb25maWcoKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgc3RvcmFnZS5nZXRJdGVtPEhpZ2hsaWdodENvbmZpZz4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEtleVdpdGhEb21haW4oJ2hpZ2hsaWdodF9jb25maWcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNhdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnID0geyAuLi5ERUZBVUxUX0NPTkZJRywgLi4uc2F2ZWQgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluamVjdFN0eWxlcygpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGxvYWQgaGlnaGxpZ2h0IGNvbmZpZzonLCBlcnJvcilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBzYXZlQ29uZmlnKCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzdG9yYWdlLnNldEl0ZW0oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEtleVdpdGhEb21haW4oJ2hpZ2hsaWdodF9jb25maWcnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maWdcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gc2F2ZSBoaWdobGlnaHQgY29uZmlnOicsIGVycm9yKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jIGF1dG9FeHRyYWN0QW5kSGlnaGxpZ2h0KCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jb25maWcuYXV0b0V4dHJhY3QpIHJldHVyblxuXG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlcyA9IHRoaXMuZXh0cmFjdG9yLmV4dHJhY3RLZXl3b3JkcygpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0V4dHJhY3RlZCBrZXl3b3JkczonLCBzb3VyY2VzKVxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgICAgICAgICAgICAgICBjb25zdCBiZXN0U291cmNlID0gc291cmNlc1swXVxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1dvcmRzID0gYmVzdFNvdXJjZS5rZXl3b3Jkcy5tYXAoKGtleXdvcmQsIGluZGV4KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDoga2V5d29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvckluZGV4OiBpbmRleCAlIDEwLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZVNlbnNpdGl2ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWdleDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6ICdwZXJzaXN0ZW50JyBhcyBjb25zdCxcbiAgICAgICAgICAgICAgICB9KSlcblxuICAgICAgICAgICAgICAgIHRoaXMud29yZHNNYW5hZ2VyLmFkZFdvcmRzKG5ld1dvcmRzKVxuICAgICAgICAgICAgICAgIHRoaXMuZXh0cmFjdG9yLnNldFdpbmRvd0tleXdvcmRzKGJlc3RTb3VyY2Uua2V5d29yZHMpXG4gICAgICAgIH1cblxuICAgICAgICBoaWdobGlnaHRBbGwoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzQWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6auY5Lqu5Yqf6IO95pyq5r+A5rS777yM6Lez6L+HaGlnaGxpZ2h0QWxsJylcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOiOt+WPluWQr+eUqOeahOmrmOS6ruivjVxuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRXb3JkcyA9IHRoaXMud29yZHNNYW5hZ2VyLmdldEVuYWJsZWRXb3JkcygpXG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwKCfpq5jkuq7nrqHnkIblmaggLSBoaWdobGlnaHRBbGwnKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDlkK/nlKjnmoTlhbPplK7or406ICR7ZW5hYmxlZFdvcmRzLmpvaW4oJywgJyl9YClcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5YWz6ZSu6K+N5pWw6YePOiAke2VuYWJsZWRXb3Jkcy5sZW5ndGh9YClcblxuICAgICAgICAgICAgICAgIC8vIOS9v+eUqGhpZ2hsaWdodE5vZGUudHPnmoTpq5jkuq7mlrnmoYhcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRXb3Jkc0luRG9jdW1lbnQoZW5hYmxlZFdvcmRzKVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+mrmOS6ruW6lOeUqOWujOaIkCcpXG4gICAgICAgICAgICAgICAgY29uc29sZS5ncm91cEVuZCgpXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE1hcCgpIC8vIOS4uuS6huS/neaMgeaOpeWPo+WFvOWuueaAp++8jOi/lOWbnuepuk1hcFxuICAgICAgICB9XG5cbiAgICAgICAgZ2V0V29yZFN0YXRzKHRleHQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndvcmRzTWFuYWdlci5nZXRXb3JkU3RhdHModGV4dCkgfHwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd29yZDogdGhpcy53b3Jkc01hbmFnZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0QWxsV29yZHMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCh3KSA9PiB3LnRleHQgPT09IHRleHQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIGdldEFsbFN0YXRzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndvcmRzTWFuYWdlci5nZXRBbGxTdGF0cygpXG4gICAgICAgIH1cblxuICAgICAgICBzdGFydCgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwKCfpq5jkuq7nrqHnkIblmaggLSBzdGFydCcpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+a/gOa0u+mrmOS6ruWKn+iDvScpXG4gICAgICAgICAgICAgICAgdGhpcy5pc0FjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodEFsbCgpXG4gICAgICAgICAgICAgICAgLy8g5byA5aeL6KeC5a+fRE9N5Y+Y5YyW77yM5Lul5L6/5Zyo5Yqo5oCB5YaF5a655Yqg6L295pe26YeN5paw5bqU55So6auY5LquXG4gICAgICAgICAgICAgICAgbWFuYWdlTXV0YXRpb25PYnNlcnZlcih0cnVlKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCflt7LlkK/liqhET03op4Llr5/lmagnKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKVxuICAgICAgICB9XG5cbiAgICAgICAgc3RvcCgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwKCfpq5jkuq7nrqHnkIblmaggLSBzdG9wJylcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5YGc55So6auY5Lqu5Yqf6IO9JylcbiAgICAgICAgICAgICAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgICAgICByZW1vdmVIaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICAvLyDlgZzmraLop4Llr59ET03lj5jljJZcbiAgICAgICAgICAgICAgICBtYW5hZ2VNdXRhdGlvbk9ic2VydmVyKGZhbHNlKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCflt7LlgZzmraJET03op4Llr5/lmagnKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKVxuICAgICAgICB9XG5cbiAgICAgICAgdXBkYXRlQ29uZmlnKG5ld0NvbmZpZzogUGFydGlhbDxIaWdobGlnaHRDb25maWc+KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcgPSB7IC4uLnRoaXMuY29uZmlnLCAuLi5uZXdDb25maWcgfVxuICAgICAgICAgICAgICAgIHRoaXMuaW5qZWN0U3R5bGVzKClcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVDb25maWcoKVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0QWxsKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBnZXRDb25maWcoKTogSGlnaGxpZ2h0Q29uZmlnIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyAuLi50aGlzLmNvbmZpZyB9XG4gICAgICAgIH1cblxuICAgICAgICBnZXRXb3JkcygpOiBIaWdobGlnaHRXb3JkW10ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndvcmRzTWFuYWdlci5nZXRBbGxXb3JkcygpXG4gICAgICAgIH1cblxuICAgICAgICBpc0VuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNBY3RpdmVcbiAgICAgICAgfVxuXG4gICAgICAgIGRlc3Ryb3koKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKClcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZVN0eWxlcygpXG4gICAgICAgICAgICAgICAgdGhpcy53b3Jkc01hbmFnZXIub2ZmV29yZHNVcGRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRBbGwoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5rOo5YWl6auY5Lqu5qC35byP5Yiw6aG16Z2iXG4gICAgICAgICAqL1xuICAgICAgICBwcml2YXRlIGluamVjdFN0eWxlcygpIHtcbiAgICAgICAgICAgICAgICAvLyDnp7vpmaTlt7LlrZjlnKjnmoTmoLflvI/lhYPntKBcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZVN0eWxlcygpXG5cbiAgICAgICAgICAgICAgICAvLyDliJvlu7rmlrDnmoTmoLflvI/lhYPntKBcbiAgICAgICAgICAgICAgICB0aGlzLnN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICAgICAgICAgICAgICB0aGlzLnN0eWxlRWxlbWVudC5pZCA9ICdicmVhZC1oaWdobGlnaHQtc3R5bGVzJ1xuICAgICAgICAgICAgICAgIHRoaXMuc3R5bGVFbGVtZW50LnRleHRDb250ZW50ID1cbiAgICAgICAgICAgICAgICAgICAgICAgIGdldEhpZ2hsaWdodFN0eWxlKHRoaXMuY29uZmlnLmNvbG9yU2NoZW1lKSArXG4gICAgICAgICAgICAgICAgICAgICAgICBgXG4gICAgICAgICAgICAuYnJlYWQtaGlnaGxpZ2h0IHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBtYXJnaW46IDAgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAwIDFweCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGZvbnQ6IGluaGVyaXQgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBjb2xvcjogYmxhY2sgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgYFxuXG4gICAgICAgICAgICAgICAgLy8g56Gu5L+d5qC35byP5q2j56Gu5rOo5YWl5Yiw5paH5qGj5LitXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5oZWFkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQodGhpcy5zdHlsZUVsZW1lbnQpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3R5bGVFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdIaWdobGlnaHRlciBzdHlsZXMgaW5qZWN0ZWQgc3VjY2Vzc2Z1bGx5JylcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0ZhaWxlZCB0byBpbmplY3QgaGlnaGxpZ2h0ZXIgc3R5bGVzOicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOenu+mZpOagt+W8j+WFg+e0oFxuICAgICAgICAgKi9cbiAgICAgICAgcHJpdmF0ZSByZW1vdmVTdHlsZXMoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0eWxlRWxlbWVudC5yZW1vdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdHlsZUVsZW1lbnQgPSBudWxsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG5cbmxldCBnbG9iYWxIaWdobGlnaHRNYW5hZ2VyOiBIaWdobGlnaHRNYW5hZ2VyIHwgbnVsbCA9IG51bGxcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhpZ2hsaWdodE1hbmFnZXIoKTogSGlnaGxpZ2h0TWFuYWdlciB7XG4gICAgICAgIGlmICghZ2xvYmFsSGlnaGxpZ2h0TWFuYWdlcikge1xuICAgICAgICAgICAgICAgIGdsb2JhbEhpZ2hsaWdodE1hbmFnZXIgPSBuZXcgSGlnaGxpZ2h0TWFuYWdlcigpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdsb2JhbEhpZ2hsaWdodE1hbmFnZXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lIaWdobGlnaHRNYW5hZ2VyKCkge1xuICAgICAgICBpZiAoZ2xvYmFsSGlnaGxpZ2h0TWFuYWdlcikge1xuICAgICAgICAgICAgICAgIGdsb2JhbEhpZ2hsaWdodE1hbmFnZXIuZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgZ2xvYmFsSGlnaGxpZ2h0TWFuYWdlciA9IG51bGxcbiAgICAgICAgfVxufVxuIiwiLyoqXG4gKiDpgJrnlKjpk77mjqXlpITnkIblt6XlhbdcbiAqXG4gKiDmj5Dkvpvpk77mjqXlpITnkIbnmoTpgJrnlKjlip/og73vvIzljIXmi6zmjpLpmaTpgInmi6nlmajjgIFET03nm5HlkKznrYlcbiAqL1xuXG4vLyDmjpLpmaTnmoTpk77mjqXpgInmi6nlmajvvIjpgb/lhY3lnKjmn5DkupvlhYPntKDkuIrlupTnlKjmoLflvI/vvIlcbmV4cG9ydCBjb25zdCBFWENMVURFRF9MSU5LX1NFTEVDVE9SUyA9IFtcbiAgICAgICAgJy5icmVhZC1leGNsdWRlJywgLy8g5omL5Yqo5o6S6Zmk55qE6ZO+5o6lXG4gICAgICAgICdbZGF0YS1icmVhZC1leGNsdWRlXScsIC8vIOaVsOaNruWxnuaAp+aOkumZpFxuICAgICAgICAnLmJyZWFkLXRyYW5zbGF0aW9uLWNvbnRhaW5lciBhJywgLy8g57+76K+R5a655Zmo5YaF55qE6ZO+5o6lXG4gICAgICAgICcuYnJlYWQtaGlnaGxpZ2h0IGEnLCAvLyDpq5jkuq7mlofmnKzlhoXnmoTpk77mjqVcbiAgICAgICAgJ25hdiBhJywgLy8g5a+86Iiq6ZO+5o6lXG4gICAgICAgICdoZWFkZXIgYScsIC8vIOWktOmDqOmTvuaOpVxuICAgICAgICAnZm9vdGVyIGEnLCAvLyDlupXpg6jpk77mjqVcbiAgICAgICAgJy5tZW51IGEnLCAvLyDoj5zljZXpk77mjqVcbiAgICAgICAgJy5uYXZiYXIgYScsIC8vIOWvvOiIquagj+mTvuaOpVxuICAgICAgICAnLnBhZ2luYXRpb24gYScsIC8vIOWIhumhtemTvuaOpVxuICAgICAgICAnLmJyZWFkY3J1bWIgYScsIC8vIOmdouWMheWxkemTvuaOpVxuXS5qb2luKCcsJylcblxuLyoqXG4gKiDmo4Dmn6Xpk77mjqXmmK/lkKblupTor6XooqvmjpLpmaRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZEV4Y2x1ZGVMaW5rKFxuICAgICAgICBsaW5rOiBIVE1MQW5jaG9yRWxlbWVudCxcbiAgICAgICAgY3VzdG9tRXhjbHVkZWRTZWxlY3RvcnM6IHN0cmluZ1tdID0gW11cbik6IGJvb2xlYW4ge1xuICAgICAgICAvLyDmo4Dmn6Xln7rnoYDmjpLpmaTpgInmi6nlmahcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBFWENMVURFRF9MSU5LX1NFTEVDVE9SUy5zcGxpdCgnLCcpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmsubWF0Y2hlcyhzZWxlY3Rvci50cmltKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOajgOafpeiHquWumuS5ieaOkumZpOmAieaLqeWZqFxuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIGN1c3RvbUV4Y2x1ZGVkU2VsZWN0b3JzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmsubWF0Y2hlcyhzZWxlY3Rvci50cmltKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIOWkhOeQhumhtemdouS4reeahOaJgOaciemTvuaOpVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc0FsbExpbmtzKFxuICAgICAgICBhcHBseVN0eWxlOiAobGluazogSFRNTEFuY2hvckVsZW1lbnQpID0+IHZvaWQsXG4gICAgICAgIHByb2Nlc3NlZExpbmtzPzogV2Vha1NldDxIVE1MQW5jaG9yRWxlbWVudD5cbik6IHZvaWQge1xuICAgICAgICBjb25zdCBsaW5rcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EnKVxuXG4gICAgICAgIGxpbmtzLmZvckVhY2goKGxpbmspID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobGluayBpbnN0YW5jZW9mIEhUTUxBbmNob3JFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmj5DkvpvkuobnvJPlrZjvvIzmo4Dmn6XmmK/lkKblt7LlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWRMaW5rcyAmJiBwcm9jZXNzZWRMaW5rcy5oYXMobGluaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVN0eWxlKGxpbmspXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmj5DkvpvkuobnvJPlrZjvvIzmoIforrDkuLrlt7LlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWRMaW5rcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRMaW5rcy5hZGQobGluaylcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0pXG59XG5cbi8qKlxuICog56e76Zmk5omA5pyJ6ZO+5o6l55qE5qC35byPXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVBbGxMaW5rU3R5bGVzKFxuICAgICAgICByZW1vdmVTdHlsZTogKGxpbms6IEhUTUxBbmNob3JFbGVtZW50KSA9PiB2b2lkXG4pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgbGlua3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhJylcbiAgICAgICAgZm9yIChjb25zdCBsaW5rIG9mIGxpbmtzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmsgaW5zdGFuY2VvZiBIVE1MQW5jaG9yRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlU3R5bGUobGluaylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuLyoqXG4gKiDlkK/nlKgv56aB55So6ZO+5o6l5qC35byP5Yqf6IO9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRMaW5rU3R5bGVFbmFibGVkKFxuICAgICAgICBlbmFibGVkOiBib29sZWFuLFxuICAgICAgICBhcHBseVN0eWxlOiAobGluazogSFRNTEFuY2hvckVsZW1lbnQpID0+IHZvaWQsXG4gICAgICAgIHJlbW92ZVN0eWxlOiAobGluazogSFRNTEFuY2hvckVsZW1lbnQpID0+IHZvaWRcbik6IHZvaWQge1xuICAgICAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAvLyDnpoHnlKjml7bnp7vpmaTmiYDmnInmoLflvI9cbiAgICAgICAgICAgICAgICByZW1vdmVBbGxMaW5rU3R5bGVzKHJlbW92ZVN0eWxlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOWQr+eUqOaXtumHjeaWsOW6lOeUqOagt+W8j1xuICAgICAgICAgICAgICAgIHByb2Nlc3NBbGxMaW5rcyhhcHBseVN0eWxlKVxuICAgICAgICB9XG59XG5cbi8qKlxuICog5Yib5bu66ZO+5o6l5qC35byP566h55CG5ZmoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMaW5rU3R5bGVNYW5hZ2VyKFxuICAgICAgICBhcHBseVN0eWxlOiAobGluazogSFRNTEFuY2hvckVsZW1lbnQpID0+IHZvaWQsXG4gICAgICAgIHJlbW92ZVN0eWxlOiAobGluazogSFRNTEFuY2hvckVsZW1lbnQpID0+IHZvaWRcbik6ICgpID0+IHZvaWQge1xuICAgICAgICBjb25zdCBwcm9jZXNzZWRMaW5rcyA9IG5ldyBXZWFrU2V0PEhUTUxBbmNob3JFbGVtZW50PigpXG4gICAgICAgIFxuICAgICAgICAvLyDliJ3lp4vlpITnkIbmiYDmnInpk77mjqVcbiAgICAgICAgcHJvY2Vzc0FsbExpbmtzKGFwcGx5U3R5bGUsIHByb2Nlc3NlZExpbmtzKVxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu6TXV0YXRpb25PYnNlcnZlcuadpeebkeWQrOaWsOa3u+WKoOeahOmTvuaOpVxuICAgICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG11dGF0aW9uLnR5cGUgPT09ICdjaGlsZExpc3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBtdXRhdGlvbi5hZGRlZE5vZGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5qOA5p+l5paw6IqC54K55Lit55qE6ZO+5o6lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsaW5rcyA9IG5vZGUucXVlcnlTZWxlY3RvckFsbCgnYScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rcy5mb3JFYWNoKGxpbmsgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGluayBpbnN0YW5jZW9mIEhUTUxBbmNob3JFbGVtZW50ICYmICFwcm9jZXNzZWRMaW5rcy5oYXMobGluaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBseVN0eWxlKGxpbmspXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkTGlua3MuYWRkKGxpbmspXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOiKgueCueacrOi6q+WwseaYr+mTvuaOpVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MQW5jaG9yRWxlbWVudCAmJiAhcHJvY2Vzc2VkTGlua3MuaGFzKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5U3R5bGUobm9kZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkTGlua3MuYWRkKG5vZGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8g5byA5aeL6KeC5a+f5paH5qGj5Y+Y5YyWXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDov5Tlm57muIXnkIblh73mlbBcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KClcbiAgICAgICAgICAgICAgICByZW1vdmVBbGxMaW5rU3R5bGVzKHJlbW92ZVN0eWxlKVxuICAgICAgICAgICAgICAgIC8vIFdlYWtTZXTmsqHmnIljbGVhcuaWueazle+8jOaIkeS7rOWPqumcgOimgeaWreW8gG9ic2VydmVyXG4gICAgICAgICAgICAgICAgLy8gcHJvY2Vzc2VkTGlua3PkvJrooqvlnoPlnL7lm57mlLZcbiAgICAgICAgfVxufVxuIiwiLyoqXG4gKiDpk77mjqXnm67moIfmoLflvI/nrqHnkIblmahcbiAqXG4gKiDmoLnmja5h5qCH562+55qEdGFyZ2V05bGe5oCn5Yy65YiG6ZO+5o6l5omT5byA5pa55byP77yM5bm25o+Q5L6b5LiN5ZCM5qC35byPXG4gKi9cblxuaW1wb3J0IHsgc2hvdWxkRXhjbHVkZUxpbmssIHNldExpbmtTdHlsZUVuYWJsZWQgfSBmcm9tICcuLi8uLi91dGlscy9kb20vbGluaydcblxuLy8g6ZO+5o6l55uu5qCH57G75Z6L5p6a5Li+XG5leHBvcnQgZW51bSBMaW5rVGFyZ2V0VHlwZSB7XG4gICAgICAgIE5FV19UQUIgPSAnbmV3LXRhYicsIC8vIOaWsOW7uuagh+etvumhtSAoX2JsYW5rKVxuICAgICAgICBTQU1FX1RBQiA9ICdzYW1lLXRhYicsIC8vIOabv+aNouW9k+WJjemhtSAoX3NlbGYsIF9wYXJlbnQsIF90b3ApXG4gICAgICAgIERFRkFVTFQgPSAnZGVmYXVsdCcsIC8vIOm7mOiupOihjOS4uiAo5pegdGFyZ2V05oiW5peg5pWIdGFyZ2V0KVxufVxuXG4vKipcbiAqIOiOt+WPlumTvuaOpeeahOebruagh+exu+Wei1xuICovXG5mdW5jdGlvbiBnZXRMaW5rVGFyZ2V0VHlwZShsaW5rOiBIVE1MQW5jaG9yRWxlbWVudCk6IExpbmtUYXJnZXRUeXBlIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gbGluay50YXJnZXQ/LnRvTG93ZXJDYXNlKClcblxuICAgICAgICBpZiAodGFyZ2V0ID09PSAnX2JsYW5rJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBMaW5rVGFyZ2V0VHlwZS5ORVdfVEFCXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0ID09PSAnX3NlbGYnIHx8IHRhcmdldCA9PT0gJ19wYXJlbnQnIHx8IHRhcmdldCA9PT0gJ190b3AnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIExpbmtUYXJnZXRUeXBlLlNBTUVfVEFCXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gTGlua1RhcmdldFR5cGUuREVGQVVMVFxufVxuXG4vKipcbiAqIOajgOafpemTvuaOpeaYr+WQpuW6lOivpeiiq+aOkumZpFxuICovXG5mdW5jdGlvbiBzaG91bGRFeGNsdWRlTGlua1RhcmdldChsaW5rOiBIVE1MQW5jaG9yRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgICAgICAvLyDmo4Dmn6Xln7rnoYDmjpLpmaTpgInmi6nlmahcbiAgICAgICAgaWYgKHNob3VsZEV4Y2x1ZGVMaW5rKGxpbmspKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOajgOafpeaYr+WQpuW3sue7j+acieagt+W8j+exuyAtIOS8mOWMlu+8muS9v+eUqOabtOW/q+eahOajgOafpeaWueW8j1xuICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSBsaW5rLmNsYXNzTGlzdFxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgY2xhc3NMaXN0LmNvbnRhaW5zKCdicmVhZC1saW5rLXRhcmdldC1uZXctdGFiJykgfHxcbiAgICAgICAgICAgICAgICBjbGFzc0xpc3QuY29udGFpbnMoJ2JyZWFkLWxpbmstdGFyZ2V0LXNhbWUtdGFiJykgfHxcbiAgICAgICAgICAgICAgICBjbGFzc0xpc3QuY29udGFpbnMoJ2JyZWFkLWxpbmstdGFyZ2V0LWRlZmF1bHQnKVxuICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICog5Li66ZO+5o6l5bqU55So55uu5qCH5qC35byPXG4gKi9cbmZ1bmN0aW9uIGFwcGx5TGlua1RhcmdldFN0eWxlKGxpbms6IEhUTUxBbmNob3JFbGVtZW50KTogdm9pZCB7XG4gICAgICAgIGlmIChzaG91bGRFeGNsdWRlTGlua1RhcmdldChsaW5rKSkge1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0VHlwZSA9IGdldExpbmtUYXJnZXRUeXBlKGxpbmspXG4gICAgICAgIGNvbnN0IGNsYXNzTGlzdCA9IGxpbmsuY2xhc3NMaXN0XG5cbiAgICAgICAgLy8g5LyY5YyW77ya5Y+q5Zyo6ZyA6KaB5pe25L+u5pS5RE9NXG4gICAgICAgIGNvbnN0IGV4cGVjdGVkQ2xhc3MgPSBgYnJlYWQtbGluay10YXJnZXQtJHt0YXJnZXRUeXBlfWBcblxuICAgICAgICAvLyDmo4Dmn6XlvZPliY3mmK/lkKblt7Lnu4/mmK/mraPnoa7nmoTmoLflvI/nsbtcbiAgICAgICAgaWYgKGNsYXNzTGlzdC5jb250YWlucyhleHBlY3RlZENsYXNzKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAvLyDlt7Lnu4/mmK/mraPnoa7nmoTmoLflvI/vvIzml6DpnIDkv67mlLlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaJuemHj+enu+mZpOaJgOacieWPr+iDveeahOebruagh+agt+W8j+exu1xuICAgICAgICBjbGFzc0xpc3QucmVtb3ZlKFxuICAgICAgICAgICAgICAgICdicmVhZC1saW5rLXRhcmdldC1uZXctdGFiJyxcbiAgICAgICAgICAgICAgICAnYnJlYWQtbGluay10YXJnZXQtc2FtZS10YWInLFxuICAgICAgICAgICAgICAgICdicmVhZC1saW5rLXRhcmdldC1kZWZhdWx0J1xuICAgICAgICApXG5cbiAgICAgICAgLy8g5re75Yqg5a+55bqU55qE5qC35byP57G7XG4gICAgICAgIGNsYXNzTGlzdC5hZGQoZXhwZWN0ZWRDbGFzcylcbn1cblxuLyoqXG4gKiDnp7vpmaTpk77mjqXnmoTnm67moIfmoLflvI9cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlua1RhcmdldFN0eWxlKGxpbms6IEhUTUxBbmNob3JFbGVtZW50KTogdm9pZCB7XG4gICAgICAgIGxpbmsuY2xhc3NMaXN0LnJlbW92ZShcbiAgICAgICAgICAgICAgICAnYnJlYWQtbGluay10YXJnZXQtbmV3LXRhYicsXG4gICAgICAgICAgICAgICAgJ2JyZWFkLWxpbmstdGFyZ2V0LXNhbWUtdGFiJyxcbiAgICAgICAgICAgICAgICAnYnJlYWQtbGluay10YXJnZXQtZGVmYXVsdCdcbiAgICAgICAgKVxufVxuXG4vKipcbiAqIOWIneWni+WMlumTvuaOpeebruagh+agt+W8j+euoeeQhuWZqFxuICog546w5Zyo5L2/55So5YWo5bGA55qEZG9tTXV0YXRpb25PYnNlcnZlcu+8jOi/lOWbnuepuua4heeQhuWHveaVsFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdExpbmtUYXJnZXRNYW5hZ2VyKCk6ICgpID0+IHZvaWQge1xuICAgICAgICAvLyDlpITnkIbnjrDmnInpk77mjqVcbiAgICAgICAgcHJvY2Vzc0FsbExpbmtzKGFwcGx5TGlua1RhcmdldFN0eWxlKVxuICAgICAgICAvLyDov5Tlm57nqbrmuIXnkIblh73mlbDvvIzlm6DkuLrmuIXnkIbnlLHlhajlsYBkb21NdXRhdGlvbk9ic2VydmVy5aSE55CGXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g5riF55CG6YC76L6R55Sx5YWo5bGAZG9tTXV0YXRpb25PYnNlcnZlcuWkhOeQhlxuICAgICAgICB9XG59XG5cbi8qKlxuICog5omL5Yqo5Li65Y2V5Liq6ZO+5o6l5bqU55So5qC35byPXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxlVG9MaW5rKGxpbms6IEhUTUxBbmNob3JFbGVtZW50KTogdm9pZCB7XG4gICAgICAgIGFwcGx5TGlua1RhcmdldFN0eWxlKGxpbmspXG59XG5cbi8qKlxuICog5omL5Yqo56e76Zmk5Y2V5Liq6ZO+5o6l55qE5qC35byPXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVTdHlsZUZyb21MaW5rKGxpbms6IEhUTUxBbmNob3JFbGVtZW50KTogdm9pZCB7XG4gICAgICAgIHJlbW92ZUxpbmtUYXJnZXRTdHlsZShsaW5rKVxufVxuXG4vKipcbiAqIOWkhOeQhumhtemdouS4reeahOaJgOaciemTvuaOpVxuICovXG5mdW5jdGlvbiBwcm9jZXNzQWxsTGlua3MoYXBwbHlTdHlsZTogKGxpbms6IEhUTUxBbmNob3JFbGVtZW50KSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGxpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnYScpXG5cbiAgICAgICAgbGlua3MuZm9yRWFjaCgobGluaykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChsaW5rIGluc3RhbmNlb2YgSFRNTEFuY2hvckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5U3R5bGUobGluaylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0pXG59XG5cbi8qKlxuICog5qOA5p+l6ZO+5o6l55uu5qCH5qC35byP5Yqf6IO95piv5ZCm5ZCv55SoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0xpbmtUYXJnZXRFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgICAgICAvLyDov5nph4zlj6/ku6Xpm4bmiJDliLDorr7nva7ns7vnu5/kuK1cbiAgICAgICAgcmV0dXJuIHRydWUgLy8g6buY6K6k5ZCv55SoXG59XG5cbi8qKlxuICog5ZCv55SoL+emgeeUqOmTvuaOpeebruagh+agt+W8j+WKn+iDvVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0TGlua1RhcmdldEVuYWJsZWQoZW5hYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBzZXRMaW5rU3R5bGVFbmFibGVkKFxuICAgICAgICAgICAgICAgIGVuYWJsZWQsXG4gICAgICAgICAgICAgICAgYXBwbHlMaW5rVGFyZ2V0U3R5bGUsXG4gICAgICAgICAgICAgICAgcmVtb3ZlTGlua1RhcmdldFN0eWxlXG4gICAgICAgIClcbn1cbiIsImltcG9ydCB7IGdldFRleHROb2RlcyB9IGZyb20gJy4uL3V0aWxzL2RvbS90ZXh0Tm9kZXMnXG5pbXBvcnQgeyBnZXRTZXR0aW5nIH0gZnJvbSAnLi4vc2V0dGluZ01hbmFnZXInXG5cbmltcG9ydCB7XG4gICAgICAgIHBhcmVudFRvVGV4dE5vZGVzTWFwLFxuICAgICAgICBiaW9uaWNUZXh0T2JzZXJ2ZXIsXG4gICAgICAgIG9ic2VydmVFbGVtZW50Tm9kZSxcbn0gZnJvbSAnLi9pbnRlcnNlY3Rpb25PYnNlcnZlci9iaW9uaWNPYnNlcnZlcidcbmltcG9ydCB7IG9ic2VydmVUcmFuc2xhdGVFbGVtZW50cyBhcyB0cmFuc2xhdGVBZGRlZEVsZW1lbnQgfSBmcm9tICcuL2ludGVyc2VjdGlvbk9ic2VydmVyL3RyYW5zbGF0ZU9ic2VydmVyJ1xuaW1wb3J0IHsgZ2V0SGlnaGxpZ2h0TWFuYWdlciB9IGZyb20gJy4uL2ZlYXR1cmUvaGlnaGxpZ2h0L2hpZ2hsaWdodE1hbmFnZXInXG5pbXBvcnQge1xuICAgICAgICBpc0xpbmtUYXJnZXRFbmFibGVkLFxuICAgICAgICBhcHBseVN0eWxlVG9MaW5rLFxufSBmcm9tICcuLi9mZWF0dXJlL2xpbmtUYXJnZXQvbGlua1RhcmdldCdcblxuLyoqXG4gKiDnrqHnkIZET03lj5jmm7Top4Llr5/lmajnmoTlkK/liqjlkozlgZzmraJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hbmFnZU11dGF0aW9uT2JzZXJ2ZXIoc2hvdWxkT2JzZXJ2ZTogYm9vbGVhbikge1xuICAgICAgICBpZiAoc2hvdWxkT2JzZXJ2ZSkge1xuICAgICAgICAgICAgICAgIGRvbU11dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUZpbHRlcjogWyd0YXJnZXQnXSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRvbU11dGF0aW9uT2JzZXJ2ZXIuZGlzY29ubmVjdCgpXG4gICAgICAgIH1cbn1cblxuLyoqXG4gKiBET03lj5jmm7Top4Llr5/lmajmoLjlv4Plm57osIPlh73mlbBcbiAqXG4gKlxuICog6L+Z5piv5pW05LiqRE9N6KeC5a+f57O757uf55qE5qC45b+D77yM6LSf6LSj5aSE55CG5omA5pyJRE9N57uT5p6E5Y+Y5YyW5LqL5Lu2XG4gKlxuICog5qC45b+D5aSE55CG5q2l6aqk77yaXG4gKiAxLiDmlLbpm4bmiYDmnInpnIDopoHlpITnkIbnmoTmlrDlop7oioLngrkgLSDov4fmu6TlkozliIbnsbvmlrDlop7nmoRET03lhYPntKBcbiAqIDIuIOWkhOeQhuenu+mZpOiKgueCue+8mua4heeQhuebuOWFs+i1hOa6kCAtIOmYsuatouWGheWtmOazhOa8j+WSjOaXoOaViOinguWvn1xuICogMy4g57uf5LiA5aSE55CG5paw5aKe6IqC54K555qE5Yqf6IO95bqU55SoIC0g5qC55o2u6K6+572u5bqU55So57+76K+R44CB5Lu/55Sf6ZiF6K+7562J5Yqf6IO9XG4gKiA0LiDlu7bov5/ph43mlrDlupTnlKjpq5jkuq7pgb/lhY3lvqrnjq/op6blj5EgLSDkvb/nlKjpmLLmipbmnLrliLbnoa7kv51ET03nqLPlrppcbiAqL1xuY29uc3QgZG9tTXV0YXRpb25PYnNlcnZlcjogTXV0YXRpb25PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKFxuICAgICAgICAobXV0YXRpb25zOiBNdXRhdGlvblJlY29yZFtdKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5ncm91cCgnRE9NIE11dGF0aW9uIE9ic2VydmVyJylcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5qOA5rWL5YiwICR7bXV0YXRpb25zLmxlbmd0aH0g5LiqRE9N5Y+Y5pu0YClcblxuICAgICAgICAgICAgICAgIC8vIOWkhOeQhuWxnuaAp+WPmOWMlu+8iOmTvuaOpeebruagh+agt+W8j++8iVxuICAgICAgICAgICAgICAgIHByb2Nlc3NBdHRyaWJ1dGVDaGFuZ2VzKG11dGF0aW9ucylcblxuICAgICAgICAgICAgICAgIC8vIOS9v+eUqFNldOmBv+WFjemHjeWkjeWkhOeQhuWQjOS4gOS4quWFg+e0oFxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0VsZW1lbnRzU2V0ID0gbmV3IFNldDxFbGVtZW50PigpXG4gICAgICAgICAgICAgICAgbGV0IHNraXBwZWRFbGVtZW50cyA9IDBcblxuICAgICAgICAgICAgICAgIC8vIOS8mOWMlu+8muaJuemHj+WkhOeQhm11dGF0aW9u6K6w5b2V77yM5YeP5bCR5b6q546v5bWM5aWXXG4gICAgICAgICAgICAgICAgbXV0YXRpb25zLmZvckVhY2goKG11dGF0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYE11dGF0aW9uOiAke211dGF0aW9uLnR5cGV9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXV0YXRpb24udGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS8mOWMlu+8muS9v+eUqOabtOmrmOaViOeahOaWsOWinuiKgueCueWkhOeQhlxuICAgICAgICAgICAgICAgICAgICAgICAgc2tpcHBlZEVsZW1lbnRzICs9IHByb2Nlc3NBZGRlZE5vZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXRhdGlvbi5hZGRlZE5vZGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdFbGVtZW50c1NldFxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlpITnkIbnp7vpmaToioLngrkgLSDmuIXnkIbotYTmupDvvIzpmLLmraLlhoXlrZjms4TmvI9cbiAgICAgICAgICAgICAgICAgICAgICAgIG11dGF0aW9uLnJlbW92ZWROb2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDnp7vpmaToioLngrk6ICR7bm9kZS5ub2RlTmFtZX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVSZW1vdmVkTm9kZShub2RlKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5LyY5YyW77ya5YeP5bCR5LiN5b+F6KaB55qE5a2Q5qCR5pu05paw5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11dGF0aW9uLnR5cGUgPT09ICdjaGlsZExpc3QnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFRvVGV4dE5vZGVzTWFwLnNpemUgPiAwXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlQWZmZWN0ZWRUZXh0Tm9kZXMobXV0YXRpb24udGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICBjb25zdCBuZXdFbGVtZW50cyA9IEFycmF5LmZyb20obmV3RWxlbWVudHNTZXQpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgICAgICAgICBg57uf6K6hOiAke25ld0VsZW1lbnRzLmxlbmd0aH0g5Liq5paw5YWD57SgLCAke3NraXBwZWRFbGVtZW50c30g5Liq6Lez6L+H5YWD57SgYFxuICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgIC8vIOWkhOeQhuaWsOWinuWFg+e0oOeahOWKn+iDveW6lOeUqCAtIOaguOW/g+S4muWKoemAu+i+kVxuICAgICAgICAgICAgICAgIGlmIChuZXdFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5byA5aeL5aSE55CG5paw5YWD57Sg5Yqf6IO9JylcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NOZXdFbGVtZW50cyhuZXdFbGVtZW50cylcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c6auY5Lqu5Yqf6IO95bey5ZCv55So77yM5bu26L+f6YeN5paw5bqU55So6auY5LquXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBoaWdobGlnaHRNYW5hZ2VyID0gZ2V0SGlnaGxpZ2h0TWFuYWdlcigpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGlnaGxpZ2h0TWFuYWdlci5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6LCD5bqm6auY5Lqu5pu05pawJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGVIaWdobGlnaHRVcGRhdGUoaGlnaGxpZ2h0TWFuYWdlcilcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwRW5kKClcbiAgICAgICAgfVxuKVxuXG4vKipcbiAqIOS8mOWMlu+8muS4k+mXqOWkhOeQhuaWsOWinuiKgueCue+8jOaPkOmrmOS7o+eggeWPr+ivu+aAp+WSjOaAp+iDvVxuICogQHJldHVybnMg6Lez6L+H55qE5YWD57Sg5pWw6YePXG4gKi9cbmZ1bmN0aW9uIHByb2Nlc3NBZGRlZE5vZGVzKFxuICAgICAgICBhZGRlZE5vZGVzOiBOb2RlTGlzdCxcbiAgICAgICAgbmV3RWxlbWVudHNTZXQ6IFNldDxFbGVtZW50PlxuKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IHNraXBwZWRDb3VudCA9IDBcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhZGRlZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGFkZGVkTm9kZXNbaV1cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBub2RlIGFzIEVsZW1lbnRcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzSW50ZXJuYWxFeHRlbnNpb25FbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGDot7Pov4flhoXpg6jlhYPntKA6ICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnRhZ05hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LiR7QXJyYXkuZnJvbShlbGVtZW50LmNsYXNzTGlzdCkuam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNraXBwZWRDb3VudCsrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDmlrDlop7lhYPntKA6ICR7ZWxlbWVudC50YWdOYW1lfWAsIGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdFbGVtZW50c1NldC5hZGQoZWxlbWVudClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNraXBwZWRDb3VudFxufVxuXG5mdW5jdGlvbiBpc0ludGVybmFsRXh0ZW5zaW9uRWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgICAgIC8vIOS9v+eUqOexu+WQjeW/q+mAn+ajgOa1i++8jOmBv+WFjeWkmuasoWNsYXNzTGlzdC5jb250YWluc+iwg+eUqFxuICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSBlbGVtZW50LmNsYXNzTGlzdFxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIGNsYXNzTGlzdD8uY29udGFpbnMoJ3RyYW5zbGF0aW9uLXJlc3VsdCcpIHx8XG4gICAgICAgICAgICAgICAgY2xhc3NMaXN0Py5jb250YWlucygnYnJlYWQtaGlnaGxpZ2h0JylcbiAgICAgICAgKVxufVxuXG4vKipcbiAqIOS8mOWMlu+8muWPquabtOaWsOWPl+W9seWTjeeahOaWh+acrOiKgueCueaYoOWwhFxuICovXG5mdW5jdGlvbiB1cGRhdGVBZmZlY3RlZFRleHROb2Rlcyh0YXJnZXQ6IE5vZGUpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRhcmdldC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gdGFyZ2V0IGFzIEVsZW1lbnRcbiAgICAgICAgICAgICAgICAvLyDlj6rmnInlvZPnm67moIflhYPntKDlnKjmmKDlsITkuK3ml7bmiY3mm7TmlrBcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50VG9UZXh0Tm9kZXNNYXAuaGFzKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVUZXh0Tm9kZXNNYXAoZWxlbWVudClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuLyoqXG4gKiDlpITnkIbmlrDlop7lhYPntKDkuK3nmoTpk77mjqXnm67moIfmoLflvI9cbiAqIFRPRE86IOenu+WKqOWIsGxpbmtUYXJnZXTmqKHlnZfkuK1cbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc0xpbmtUYXJnZXRFbGVtZW50cyhlbGVtZW50czogRWxlbWVudFtdKSB7XG4gICAgICAgIGNvbnN0IGxpbmtUYXJnZXRFbmFibGVkID0gaXNMaW5rVGFyZ2V0RW5hYmxlZCgpXG5cbiAgICAgICAgaWYgKCFsaW5rVGFyZ2V0RW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgLy8g5qOA5p+l5YWD57Sg5pys6Lqr5piv5ZCm5Li66ZO+5o6lXG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MQW5jaG9yRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTdHlsZVRvTGluayhlbGVtZW50KVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOajgOafpeWFg+e0oOWGheeahOaJgOaciemTvuaOpVxuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmtzID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhJylcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGxpbmsgb2YgbGlua3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaW5rIGluc3RhbmNlb2YgSFRNTEFuY2hvckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTdHlsZVRvTGluayhsaW5rKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxufVxuXG4vKipcbiAqIOWkhOeQhuWxnuaAp+WPmOWMlu+8iHRhcmdldOWxnuaAp++8iVxuICogVE9ETzog56e75Yqo5YiwbGlua1RhcmdldOaooeWdl+S4rVxuICovXG5mdW5jdGlvbiBwcm9jZXNzQXR0cmlidXRlQ2hhbmdlcyhtdXRhdGlvbnM6IE11dGF0aW9uUmVjb3JkW10pIHtcbiAgICAgICAgY29uc3QgbGlua1RhcmdldEVuYWJsZWQgPSBpc0xpbmtUYXJnZXRFbmFibGVkKClcblxuICAgICAgICBpZiAoIWxpbmtUYXJnZXRFbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIG11dGF0aW9uLnR5cGUgPT09ICdhdHRyaWJ1dGVzJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgbXV0YXRpb24uYXR0cmlidXRlTmFtZSA9PT0gJ3RhcmdldCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIG11dGF0aW9uLnRhcmdldCBpbnN0YW5jZW9mIEhUTUxBbmNob3JFbGVtZW50XG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVN0eWxlVG9MaW5rKG11dGF0aW9uLnRhcmdldClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cblxuLyoqXG4gKiDlpITnkIbmlrDlop7lhYPntKDnmoTlip/og73lupTnlKhcbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc05ld0VsZW1lbnRzKGVsZW1lbnRzOiBFbGVtZW50W10pIHtcbiAgICAgICAgY29uc3QgdHJhbnNsYXRlRW5hYmxlZCA9IGdldFNldHRpbmcoKS50cmFuc2xhdGVcbiAgICAgICAgY29uc3QgYmlvbmljRW5hYmxlZCA9IGdldFNldHRpbmcoKS5iaW9uaWNcblxuICAgICAgICBjb25zb2xlLmxvZyhg5Yqf6IO96K6+572uOiDnv7vor5E9JHt0cmFuc2xhdGVFbmFibGVkfSwg5Lu/55SfPSR7YmlvbmljRW5hYmxlZH1gKVxuXG4gICAgICAgIC8vIOWkhOeQhumTvuaOpeebruagh+agt+W8j1xuICAgICAgICBwcm9jZXNzTGlua1RhcmdldEVsZW1lbnRzKGVsZW1lbnRzKVxuXG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgICAgICAgICAgIGlmICh0cmFuc2xhdGVFbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5bqU55So57+76K+R5YiwOiAke2VsZW1lbnQudGFnTmFtZX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNsYXRlQWRkZWRFbGVtZW50KGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChiaW9uaWNFbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5bqU55So5Lu/55Sf5YiwOiAke2VsZW1lbnQudGFnTmFtZX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZUVsZW1lbnROb2RlKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coYOWujOaIkOWkhOeQhiAke2VsZW1lbnRzLmxlbmd0aH0g5Liq5YWD57SgYClcbn1cblxuLyoqXG4gKiDmm7TmlrDmlofmnKzoioLngrnmmKDlsIRcbiAqL1xuZnVuY3Rpb24gdXBkYXRlVGV4dE5vZGVzTWFwKGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudFRvVGV4dE5vZGVzTWFwLmhhcyhlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRleHRzID0gZ2V0VGV4dE5vZGVzKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dHNTZXQgPSBuZXcgU2V0KHRleHRzKVxuICAgICAgICAgICAgICAgIHBhcmVudFRvVGV4dE5vZGVzTWFwLnNldChlbGVtZW50LCB0ZXh0c1NldClcbiAgICAgICAgfVxufVxuXG4vKipcbiAqIOW7tui/n+mHjeaWsOW6lOeUqOmrmOS6rlxuICovXG5mdW5jdGlvbiBzY2hlZHVsZUhpZ2hsaWdodFVwZGF0ZShcbiAgICAgICAgaGlnaGxpZ2h0TWFuYWdlcjogUmV0dXJuVHlwZTx0eXBlb2YgZ2V0SGlnaGxpZ2h0TWFuYWdlcj5cbikge1xuICAgICAgICAvLyDkvb/nlKjpmLLmipbpgb/lhY3popHnuYHph43nu5jvvIzlubbmmoLml7blhbPpl63op4Llr5/lmajpgb/lhY3lvqrnjq/op6blj5FcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGRvbU11dGF0aW9uT2JzZXJ2ZXIuZGlzY29ubmVjdCgpXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0TWFuYWdlci5oaWdobGlnaHRBbGwoKVxuICAgICAgICAgICAgICAgIC8vIOmHjeaWsOW8gOWQr+inguWvn+WZqFxuICAgICAgICAgICAgICAgIGRvbU11dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0sIDMwMClcbn1cblxuLyoqXG4gKiDlpITnkIZET03oioLngrnnp7vpmaTkuovku7ZcbiAqIEBwYXJhbSBub2RlIC0g6KKr56e76Zmk55qERE9N6IqC54K5XG4gKiBAcmVtYXJrc1xuICog5aSE55CG6YC76L6R5YiG5Lik56eN5oOF5Ya177yaXG4gKiAxLiDlhYPntKDoioLngrnvvJrmuIXnkIbmlofmnKzoioLngrnmmKDlsITlkozop4Llr5/lmahcbiAqIDIuIOaWh+acrOiKgueCue+8muS7jueItuWFg+e0oOaYoOWwhOS4reWIoOmZpFxuICog5LyY5YWI57qn77ya5YWI5aSE55CG5YWD57Sg6IqC54K55YaN5aSE55CG5paH5pys6IqC54K5XG4gKi9cbmZ1bmN0aW9uIGhhbmRsZVJlbW92ZWROb2RlKG5vZGU6IE5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IG5vZGUgYXMgRWxlbWVudFxuICAgICAgICAgICAgICAgIHBhcmVudFRvVGV4dE5vZGVzTWFwLmRlbGV0ZShlbGVtZW50KVxuICAgICAgICAgICAgICAgIGJpb25pY1RleHRPYnNlcnZlci51bm9ic2VydmUoZWxlbWVudClcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRleHROb2RlID0gbm9kZSBhcyBUZXh0XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdGV4dE5vZGUucGFyZW50RWxlbWVudFxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHRzID0gcGFyZW50VG9UZXh0Tm9kZXNNYXAuZ2V0KHBhcmVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDnm7TmjqXlsJ3or5XliKDpmaTmlofmnKzoioLngrlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRzLmRlbGV0ZSh0ZXh0Tm9kZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0cy5zaXplID09PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFRvVGV4dE5vZGVzTWFwLmRlbGV0ZShwYXJlbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmlvbmljVGV4dE9ic2VydmVyLnVub2JzZXJ2ZShwYXJlbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cbiIsImltcG9ydCB7IHJlbW92ZUJpb25pY0VmZmVjdHMgfSBmcm9tICcuL2Jpb25pY05vZGUnXG5pbXBvcnQgeyBtYW5hZ2VNdXRhdGlvbk9ic2VydmVyIH0gZnJvbSAnLi4vLi4vb2JzZXJ2ZXIvZG9tTXV0YXRpb25PYnNlcnZlcidcbmltcG9ydCB7XG4gICAgICAgIHBhcmVudFRvVGV4dE5vZGVzTWFwLFxuICAgICAgICBpbml0aWFsaXplU2luZ2xlVXNlT2JzZXJ2ZXIsXG4gICAgICAgIGJpb25pY1RleHRPYnNlcnZlcixcbn0gZnJvbSAnLi4vLi4vb2JzZXJ2ZXIvaW50ZXJzZWN0aW9uT2JzZXJ2ZXIvYmlvbmljT2JzZXJ2ZXInXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSAnLi4vRmVhdHVyZSdcblxuLyoqXG4gKiDku7/nlJ/pmIXor7vlip/og71cbiAqL1xuZXhwb3J0IGNsYXNzIEJpb25pY0ZlYXR1cmUgZXh0ZW5kcyBGZWF0dXJlIHtcbiAgICAgICAgcmVhZG9ubHkgbmFtZSA9ICdiaW9uaWMnXG4gICAgICAgIHJlYWRvbmx5IGRlZmF1bHQgPSBmYWxzZVxuXG4gICAgICAgIHByaXZhdGUgaXNBY3RpdmUgPSBmYWxzZVxuXG4gICAgICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgICAgICAgICAgLy8g54m55q6K5aSE55CG77yaYmlvbmlj55qERE9N5Yqg6L296YC76L6RXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdET00g5bCx57uq5pe25omn6KGMJylcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCflu7bov5/liLDnqpflj6PliqDovb3lrozmiJAnKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkgcmV0dXJuXG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZVNpbmdsZVVzZU9ic2VydmVyKClcbiAgICAgICAgICAgICAgICBtYW5hZ2VNdXRhdGlvbk9ic2VydmVyKHRydWUpXG4gICAgICAgICAgICAgICAgdGhpcy5pc0FjdGl2ZSA9IHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jIG9mZigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNBY3RpdmUpIHJldHVyblxuICAgICAgICAgICAgICAgIG1hbmFnZU11dGF0aW9uT2JzZXJ2ZXIoZmFsc2UpXG4gICAgICAgICAgICAgICAgYmlvbmljVGV4dE9ic2VydmVyLmRpc2Nvbm5lY3QoKVxuICAgICAgICAgICAgICAgIHBhcmVudFRvVGV4dE5vZGVzTWFwLmNsZWFyKClcbiAgICAgICAgICAgICAgICByZW1vdmVCaW9uaWNFZmZlY3RzKClcbiAgICAgICAgICAgICAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2VcbiAgICAgICAgfVxufVxuIiwiLyoqXG4gKiDpq5jkuq7miafooYzlmahcbiAqIOi0n+i0o+WunumZheeahOmrmOS6ruaTjeS9nO+8jOS4jeeuoeeQhuivjeeahOeKtuaAgVxuICovXG5cbmltcG9ydCB7IGhpZ2hsaWdodFdvcmRzSW5Eb2N1bWVudCwgcmVtb3ZlSGlnaGxpZ2h0cyB9IGZyb20gJy4vaGlnaGxpZ2h0Tm9kZSdcbmltcG9ydCB7IGdldFdvcmRzTWFuYWdlciwgSGlnaGxpZ2h0V29yZCB9IGZyb20gJy4vd29yZHNNYW5hZ2VyJ1xuXG5leHBvcnQgY2xhc3MgSGlnaGxpZ2h0ZXIge1xuICAgICAgICBwcml2YXRlIGlzQWN0aXZlOiBib29sZWFuID0gZmFsc2VcblxuICAgICAgICAvKipcbiAgICAgICAgICog5ZCv5Yqo6auY5Lqu5ZmoXG4gICAgICAgICAqL1xuICAgICAgICBzdGFydCgpOiB2b2lkIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0FjdGl2ZSkgcmV0dXJuXG5cbiAgICAgICAgICAgICAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfwn5qAIOWQr+WKqOmrmOS6ruWZqCcpXG5cbiAgICAgICAgICAgICAgICAvLyDnm5HlkKzor43nrqHnkIblmajlj5jljJZcbiAgICAgICAgICAgICAgICBjb25zdCB3b3Jkc01hbmFnZXIgPSBnZXRXb3Jkc01hbmFnZXIoKVxuICAgICAgICAgICAgICAgIHdvcmRzTWFuYWdlci5vbldvcmRzVXBkYXRlKHRoaXMuaGFuZGxlV29yZHNVcGRhdGUuYmluZCh0aGlzKSlcblxuICAgICAgICAgICAgICAgIC8vIOWIneWni+mrmOS6ruS4gOasoVxuICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0Q3VycmVudFdvcmRzKClcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlgZzmraLpq5jkuq7lmahcbiAgICAgICAgICovXG4gICAgICAgIHN0b3AoKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzQWN0aXZlKSByZXR1cm5cblxuICAgICAgICAgICAgICAgIHRoaXMuaXNBY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfij7nvuI8g5YGc5q2i6auY5Lqu5ZmoJylcblxuICAgICAgICAgICAgICAgIC8vIOWPlua2iOebkeWQrFxuICAgICAgICAgICAgICAgIGNvbnN0IHdvcmRzTWFuYWdlciA9IGdldFdvcmRzTWFuYWdlcigpXG4gICAgICAgICAgICAgICAgd29yZHNNYW5hZ2VyLm9mZldvcmRzVXBkYXRlKHRoaXMuaGFuZGxlV29yZHNVcGRhdGUuYmluZCh0aGlzKSlcblxuICAgICAgICAgICAgICAgIC8vIOenu+mZpOaJgOaciemrmOS6rlxuICAgICAgICAgICAgICAgIHJlbW92ZUhpZ2hsaWdodHMoKVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWkhOeQhuivjeabtOaWsFxuICAgICAgICAgKi9cbiAgICAgICAgcHJpdmF0ZSBoYW5kbGVXb3Jkc1VwZGF0ZSh3b3JkczogSGlnaGxpZ2h0V29yZFtdKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzQWN0aXZlKSByZXR1cm5cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfwn5SEIOajgOa1i+WIsOivjeabtOaWsO+8jOmHjeaWsOW6lOeUqOmrmOS6ricpXG4gICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRXb3Jkcyh3b3JkcylcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDpq5jkuq7mjIflrpror41cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgaGlnaGxpZ2h0V29yZHMod29yZHM6IEhpZ2hsaWdodFdvcmRbXSk6IHZvaWQge1xuICAgICAgICAgICAgICAgIGlmICh3b3Jkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYPCfjqgg5byA5aeL6auY5LquICR7d29yZHMubGVuZ3RofSDkuKror41gKVxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodFdvcmRzSW5Eb2N1bWVudCh3b3JkcylcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDpq5jkuq7lvZPliY3or41cbiAgICAgICAgICovXG4gICAgICAgIHByaXZhdGUgaGlnaGxpZ2h0Q3VycmVudFdvcmRzKCk6IHZvaWQge1xuICAgICAgICAgICAgICAgIGNvbnN0IHdvcmRzTWFuYWdlciA9IGdldFdvcmRzTWFuYWdlcigpXG4gICAgICAgICAgICAgICAgY29uc3Qgd29yZHMgPSB3b3Jkc01hbmFnZXIuZ2V0QWxsV29yZHMoKVxuICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0V29yZHMod29yZHMpXG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5qOA5p+l5piv5ZCm5r+A5rS7XG4gICAgICAgICAqL1xuICAgICAgICBpc0VuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNBY3RpdmVcbiAgICAgICAgfVxufVxuXG4vLyDljZXkvovmqKHlvI9cbmxldCBnbG9iYWxIaWdobGlnaHRlcjogSGlnaGxpZ2h0ZXIgfCBudWxsID0gbnVsbFxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0ZXIoKTogSGlnaGxpZ2h0ZXIge1xuICAgICAgICBpZiAoIWdsb2JhbEhpZ2hsaWdodGVyKSB7XG4gICAgICAgICAgICAgICAgZ2xvYmFsSGlnaGxpZ2h0ZXIgPSBuZXcgSGlnaGxpZ2h0ZXIoKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnbG9iYWxIaWdobGlnaHRlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveUhpZ2hsaWdodGVyKCk6IHZvaWQge1xuICAgICAgICBpZiAoZ2xvYmFsSGlnaGxpZ2h0ZXIpIHtcbiAgICAgICAgICAgICAgICBnbG9iYWxIaWdobGlnaHRlci5zdG9wKClcbiAgICAgICAgICAgICAgICBnbG9iYWxIaWdobGlnaHRlciA9IG51bGxcbiAgICAgICAgfVxufVxuIiwiLyoqXG4gKiDmkJzntKLlhbPplK7or43oh6rliqjmm7TmlrDmqKHlnZdcbiAqIOWHveaVsOW8j+WunueOsO+8jOebkeWQrFVSTOWPmOWMluW5tuiHquWKqOabtOaWsOaQnOe0ouWFs+mUruivjemrmOS6rlxuICovXG5cbmltcG9ydCB7IEtleXdvcmRFeHRyYWN0b3IgfSBmcm9tICcuL2tleXdvcmRFeHRyYWN0b3InXG5pbXBvcnQgeyBnZXRXb3Jkc01hbmFnZXIgfSBmcm9tICcuL3dvcmRzTWFuYWdlcidcblxuLy8g54q25oCB5Y+Y6YePXG5sZXQgaXNBY3RpdmUgPSBmYWxzZVxubGV0IGxhc3RVcmwgPSAnJ1xubGV0IHVybE9ic2VydmVyOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCA9IG51bGxcblxuLyoqXG4gKiDlkK/liqjmkJzntKLlhbPplK7or43oh6rliqjmm7TmlrBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0U2VhcmNoS2V5d29yZEF1dG9VcGRhdGUoKTogdm9pZCB7XG4gICAgICAgIGlmIChpc0FjdGl2ZSkgcmV0dXJuXG5cbiAgICAgICAgaXNBY3RpdmUgPSB0cnVlXG4gICAgICAgIGxhc3RVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZlxuXG4gICAgICAgIGNvbnNvbGUubG9nKCflkK/liqjmkJzntKLlhbPplK7or43oh6rliqjmm7TmlrAnKVxuXG4gICAgICAgIHNldHVwVXJsQ2hhbmdlTGlzdGVuZXJzKClcbiAgICAgICAgdXBkYXRlU2VhcmNoS2V5d29yZHMoKVxufVxuXG4vKipcbiAqIOWBnOatouaQnOe0ouWFs+mUruivjeiHquWKqOabtOaWsFxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcFNlYXJjaEtleXdvcmRBdXRvVXBkYXRlKCk6IHZvaWQge1xuICAgICAgICBpZiAoIWlzQWN0aXZlKSByZXR1cm5cblxuICAgICAgICBpc0FjdGl2ZSA9IGZhbHNlXG4gICAgICAgIGNsZWFudXBVcmxDaGFuZ2VMaXN0ZW5lcnMoKVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCfij7nvuI8g5YGc5q2i5pCc57Si5YWz6ZSu6K+N6Ieq5Yqo5pu05pawJylcbn1cblxuLyoqXG4gKiDorr7nva5VUkzlj5jljJbnm5HlkKzlmahcbiAqL1xuZnVuY3Rpb24gc2V0dXBVcmxDaGFuZ2VMaXN0ZW5lcnMoKTogdm9pZCB7XG4gICAgICAgIC8vIOebkeWQrFVSTOWPmOWMllxuICAgICAgICB1cmxPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhyZWYgIT09IGxhc3RVcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfwn5SEIOajgOa1i+WIsFVSTOWPmOWMlu+8jOajgOafpeaYr+WQpumcgOimgeabtOaWsOaQnOe0ouWFs+mUruivjemrmOS6ridcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVNlYXJjaEtleXdvcmRzKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8g55uR5ZCscG9wc3RhdGXkuovku7bvvIjmtY/op4jlmajliY3ov5sv5ZCO6YCA77yJXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIGhhbmRsZVBvcFN0YXRlKVxuXG4gICAgICAgIC8vIOebkeWQrGhhc2hjaGFuZ2Xkuovku7bvvIhVUkwgaGFzaOWPmOWMlu+8iVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIGhhbmRsZUhhc2hDaGFuZ2UpXG5cbiAgICAgICAgLy8g5byA5aeL6KeC5a+fRE9N5Y+Y5YyWXG4gICAgICAgIHVybE9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQsIHsgc3VidHJlZTogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlIH0pXG59XG5cbi8qKlxuICog5riF55CGVVJM5Y+Y5YyW55uR5ZCs5ZmoXG4gKi9cbmZ1bmN0aW9uIGNsZWFudXBVcmxDaGFuZ2VMaXN0ZW5lcnMoKTogdm9pZCB7XG4gICAgICAgIGlmICh1cmxPYnNlcnZlcikge1xuICAgICAgICAgICAgICAgIHVybE9ic2VydmVyLmRpc2Nvbm5lY3QoKVxuICAgICAgICAgICAgICAgIHVybE9ic2VydmVyID0gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgaGFuZGxlUG9wU3RhdGUpXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgaGFuZGxlSGFzaENoYW5nZSlcbn1cblxuLyoqXG4gKiDlpITnkIZwb3BzdGF0ZeS6i+S7tlxuICovXG5mdW5jdGlvbiBoYW5kbGVQb3BTdGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2coJ/CflIQg5qOA5rWL5YiwcG9wc3RhdGXkuovku7bvvIzmo4Dmn6XmmK/lkKbpnIDopoHmm7TmlrDmkJzntKLlhbPplK7or43pq5jkuq4nKVxuICAgICAgICB1cGRhdGVTZWFyY2hLZXl3b3JkcygpXG59XG5cbi8qKlxuICog5aSE55CGaGFzaGNoYW5nZeS6i+S7tlxuICovXG5mdW5jdGlvbiBoYW5kbGVIYXNoQ2hhbmdlKCk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZygn8J+UhCDmo4DmtYvliLBoYXNoY2hhbmdl5LqL5Lu277yM5qOA5p+l5piv5ZCm6ZyA6KaB5pu05paw5pCc57Si5YWz6ZSu6K+N6auY5LquJylcbiAgICAgICAgdXBkYXRlU2VhcmNoS2V5d29yZHMoKVxufVxuXG4vKipcbiAqIOabtOaWsOaQnOe0ouWFs+mUruivjemrmOS6rlxuICovXG5mdW5jdGlvbiB1cGRhdGVTZWFyY2hLZXl3b3JkcygpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZXh0cmFjdG9yID0gbmV3IEtleXdvcmRFeHRyYWN0b3IoKVxuXG4gICAgICAgIC8vIOajgOafpeW9k+WJjemhtemdouaYr+WQpuaYr+aQnOe0ouW8leaTjumhtemdolxuICAgICAgICBjb25zdCBzb3VyY2VzID0gZXh0cmFjdG9yLmV4dHJhY3RLZXl3b3JkcygpXG4gICAgICAgIGNvbnN0IHNlYXJjaEVuZ2luZVNvdXJjZSA9IHNvdXJjZXMuZmluZChcbiAgICAgICAgICAgICAgICAoc291cmNlKSA9PiBzb3VyY2UudHlwZSA9PT0gJ3NlYXJjaF9lbmdpbmUnXG4gICAgICAgIClcblxuICAgICAgICBpZiAoc2VhcmNoRW5naW5lU291cmNlICYmIHNlYXJjaEVuZ2luZVNvdXJjZS5rZXl3b3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgICAgICAgICAn8J+UjSDmo4DmtYvliLDmkJzntKLlvJXmk47pobXpnaLvvIzoh6rliqjmm7TmlrDmkJzntKLlhbPplK7or406JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaEVuZ2luZVNvdXJjZS5rZXl3b3Jkc1xuICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgIC8vIOabtOaWsOWIsHdvcmRzTWFuYWdlclxuICAgICAgICAgICAgICAgIGNvbnN0IHdvcmRzTWFuYWdlciA9IGdldFdvcmRzTWFuYWdlcigpXG4gICAgICAgICAgICAgICAgd29yZHNNYW5hZ2VyLnVwZGF0ZVNlYXJjaFdvcmRzKHNlYXJjaEVuZ2luZVNvdXJjZS5rZXl3b3JkcylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmsqHmnInmkJzntKLlhbPplK7or43vvIzmuIXnqbrmkJzntKLor41cbiAgICAgICAgICAgICAgICBjb25zdCB3b3Jkc01hbmFnZXIgPSBnZXRXb3Jkc01hbmFnZXIoKVxuICAgICAgICAgICAgICAgIHdvcmRzTWFuYWdlci51cGRhdGVTZWFyY2hXb3JkcyhbXSlcbiAgICAgICAgfVxufVxuXG4vKipcbiAqIOajgOafpeaYr+WQpuato+WcqOi/kOihjFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTZWFyY2hLZXl3b3JkQXV0b1VwZGF0ZUFjdGl2ZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGlzQWN0aXZlXG59XG4iLCIvKipcbiAqIOmrmOS6ruWKn+iDveWIneWni+WMluaooeWdl1xuICog6LSf6LSj6auY5Lqu5Yqf6IO955qE5Yid5aeL5YyW5ZKM5raI5oGv5aSE55CGXG4gKi9cblxuaW1wb3J0IHsgZ2V0V29yZHNNYW5hZ2VyIH0gZnJvbSAnLi93b3Jkc01hbmFnZXInXG5pbXBvcnQgeyBnZXRIaWdobGlnaHRlciB9IGZyb20gJy4vaGlnaGxpZ2h0ZXInXG5pbXBvcnQgeyBzdGFydFNlYXJjaEtleXdvcmRBdXRvVXBkYXRlIH0gZnJvbSAnLi9zZWFyY2hLZXl3b3JkQXV0b1VwZGF0ZSdcblxuLyoqXG4gKiDliJ3lp4vljJbpq5jkuq7ns7vnu59cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVIaWdobGlnaHRTeXN0ZW0oKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfwn5qAIOWIneWni+WMlumrmOS6ruezu+e7nycpXG5cbiAgICAgICAgLy8g5ZCv5Yqo6auY5Lqu5ZmoXG4gICAgICAgIGNvbnN0IGhpZ2hsaWdodGVyID0gZ2V0SGlnaGxpZ2h0ZXIoKVxuICAgICAgICBoaWdobGlnaHRlci5zdGFydCgpXG5cbiAgICAgICAgLy8g5ZCv5Yqo5pCc57Si5YWz6ZSu6K+N6Ieq5Yqo5pu05pawXG4gICAgICAgIHN0YXJ0U2VhcmNoS2V5d29yZEF1dG9VcGRhdGUoKVxuXG4gICAgICAgIC8vIOmhtemdouWKoOi9veaXtuW6lOeUqOaMgeS5hemrmOS6rlxuICAgICAgICBhcHBseVBlcnNpc3RlbnRIaWdobGlnaHRPbkxvYWQoKVxuXG4gICAgICAgIC8vIOiuvue9rua2iOaBr+ebkeWQrFxuICAgICAgICBzZXR1cE1lc3NhZ2VMaXN0ZW5lcnMoKVxuXG4gICAgICAgIC8vIOiuvue9rnN0b3JhZ2Xlj5jljJbnm5HlkKxcbiAgICAgICAgc2V0dXBTdG9yYWdlTGlzdGVuZXJzKClcbn1cblxuLyoqXG4gKiDorr7nva7mtojmga/nm5HlkKxcbiAqL1xuZnVuY3Rpb24gc2V0dXBNZXNzYWdlTGlzdGVuZXJzKCk6IHZvaWQge1xuICAgICAgICAvLyDnm5HlkKzmnaXoh6pwb3B1cOeahOa2iOaBr1xuICAgICAgICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBfLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwKCfwn5OoIOmrmOS6ruezu+e7n+aUtuWIsOa2iOaBrycpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+a2iOaBr+WGheWuuTonLCBtZXNzYWdlKVxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChtZXNzYWdlLmFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnaGlnaGxpZ2h0V29yZHMnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn8J+OqCDlvIDlp4vpq5jkuq7lhbPplK7or406JywgbWVzc2FnZS53b3JkcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlSGlnaGxpZ2h0V29yZHMobWVzc2FnZS53b3JkcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmRzOiBtZXNzYWdlLndvcmRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdyZW1vdmVIaWdobGlnaHQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn8J+Xke+4jyDnp7vpmaTmiYDmnInpq5jkuq4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVSZW1vdmVIaWdobGlnaHQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfinZMg5pyq55+l5raI5oGv57G75Z6LOicsIG1lc3NhZ2UuYWN0aW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAnVW5rbm93biBhY3Rpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlIC8vIOS/neaMgea2iOaBr+mAmumBk+W8gOaUvuS7peaUr+aMgeW8guatpeWTjeW6lFxuICAgICAgICB9KVxufVxuXG4vKipcbiAqIOiuvue9rnN0b3JhZ2Xlj5jljJbnm5HlkKxcbiAqL1xuZnVuY3Rpb24gc2V0dXBTdG9yYWdlTGlzdGVuZXJzKCk6IHZvaWQge1xuICAgICAgICAvLyDnm5HlkKxzdG9yYWdl5Y+Y5YyW77yM5b2T5oyB5LmF6auY5Lqu5YWz6ZSu6K+N5pS55Y+Y5pe26Ieq5Yqo5pu05pawXG4gICAgICAgIGJyb3dzZXIuc3RvcmFnZS5vbkNoYW5nZWQuYWRkTGlzdGVuZXIoKGNoYW5nZXMsIGFyZWEpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYXJlYSA9PT0gJ2xvY2FsJyAmJiBjaGFuZ2VzLnBlcnNpc3RlbnRfaGlnaGxpZ2h0X2tleXdvcmRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn8J+UhCDmo4DmtYvliLDmjIHkuYXpq5jkuq7lhbPplK7or43lj5jljJbvvIzmm7TmlrDpq5jkuq7or40nKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3S2V5d29yZHMgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnBlcnNpc3RlbnRfaGlnaGxpZ2h0X2tleXdvcmRzLm5ld1ZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVQZXJzaXN0ZW50S2V5d29yZHNDaGFuZ2UobmV3S2V5d29yZHMpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9KVxufVxuXG4vKipcbiAqIOWkhOeQhumrmOS6ruivjea2iOaBr1xuICovXG5mdW5jdGlvbiBoYW5kbGVIaWdobGlnaHRXb3Jkcyh3b3Jkczogc3RyaW5nW10pOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgd29yZHNNYW5hZ2VyID0gZ2V0V29yZHNNYW5hZ2VyKClcbiAgICAgICAgd29yZHNNYW5hZ2VyLnVwZGF0ZVBlcnNpc3RlbnRXb3Jkcyh3b3Jkcylcbn1cblxuLyoqXG4gKiDlpITnkIbnp7vpmaTpq5jkuq7mtojmga9cbiAqL1xuZnVuY3Rpb24gaGFuZGxlUmVtb3ZlSGlnaGxpZ2h0KCk6IHZvaWQge1xuICAgICAgICBjb25zdCB3b3Jkc01hbmFnZXIgPSBnZXRXb3Jkc01hbmFnZXIoKVxuICAgICAgICB3b3Jkc01hbmFnZXIudXBkYXRlUGVyc2lzdGVudFdvcmRzKFtdKVxufVxuXG4vKipcbiAqIOWkhOeQhuaMgeS5hemrmOS6ruWFs+mUruivjeWPmOWMllxuICovXG5mdW5jdGlvbiBoYW5kbGVQZXJzaXN0ZW50S2V5d29yZHNDaGFuZ2UobmV3S2V5d29yZHM6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgICAgICBjb25zdCB3b3Jkc01hbmFnZXIgPSBnZXRXb3Jkc01hbmFnZXIoKVxuXG4gICAgICAgIGlmIChuZXdLZXl3b3JkcyAmJiBuZXdLZXl3b3Jkcy50cmltKCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXl3b3JkcyA9IG5ld0tleXdvcmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh3b3JkOiBzdHJpbmcpID0+IHdvcmQudHJpbSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigod29yZDogc3RyaW5nKSA9PiB3b3JkLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgd29yZHNNYW5hZ2VyLnVwZGF0ZVBlcnNpc3RlbnRXb3JkcyhrZXl3b3JkcylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3b3Jkc01hbmFnZXIudXBkYXRlUGVyc2lzdGVudFdvcmRzKFtdKVxuICAgICAgICB9XG59XG5cbi8qKlxuICog6aG16Z2i5Yqg6L295pe25bqU55So5oyB5LmF6auY5LquXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGFwcGx5UGVyc2lzdGVudEhpZ2hsaWdodE9uTG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJzaXN0ZW50S2V5d29yZHMgPSBhd2FpdCBzdG9yYWdlLmdldEl0ZW08c3RyaW5nPihcbiAgICAgICAgICAgICAgICAgICAgICAgICdsb2NhbDpwZXJzaXN0ZW50X2hpZ2hsaWdodF9rZXl3b3JkcydcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgaWYgKHBlcnNpc3RlbnRLZXl3b3JkcyAmJiBwZXJzaXN0ZW50S2V5d29yZHMudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6aG16Z2i5Yqg6L295pe26Ieq5Yqo5bqU55So5oyB5LmF6auY5LquJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXdvcmRzID0gcGVyc2lzdGVudEtleXdvcmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgod29yZCkgPT4gd29yZC50cmltKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKHdvcmQpID0+IHdvcmQubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdvcmRzTWFuYWdlciA9IGdldFdvcmRzTWFuYWdlcigpXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3Jkc01hbmFnZXIudXBkYXRlUGVyc2lzdGVudFdvcmRzKGtleXdvcmRzKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ+mhtemdouWKoOi9veaXtuW6lOeUqOaMgeS5hemrmOS6ruWksei0pTonLCBlcnJvcilcbiAgICAgICAgfVxufVxuIiwiaW1wb3J0IHsgZ2V0SGlnaGxpZ2h0TWFuYWdlciB9IGZyb20gJy4vaGlnaGxpZ2h0TWFuYWdlcidcbmltcG9ydCB7IGluaXRpYWxpemVIaWdobGlnaHRTeXN0ZW0gfSBmcm9tICcuL2hpZ2hsaWdodEluaXQnXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSAnLi4vRmVhdHVyZSdcbmltcG9ydCB7IGlzU2VhcmNoRW5naW5lUGFnZSB9IGZyb20gJy4uLy4uL3V0aWxzL3BhZ2UvaW5mbydcblxuLyoqXG4gKiDpq5jkuq7lip/og71cbiAqL1xuZXhwb3J0IGNsYXNzIEhpZ2hsaWdodEZlYXR1cmUgZXh0ZW5kcyBGZWF0dXJlIHtcbiAgICAgICAgcmVhZG9ubHkgbmFtZSA9ICdoaWdobGlnaHQnXG4gICAgICAgIGdldCBkZWZhdWx0KCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBpc1NlYXJjaEVuZ2luZVBhZ2UoKVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBtYW5hZ2VyID0gZ2V0SGlnaGxpZ2h0TWFuYWdlcigpXG5cbiAgICAgICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgICAgICAgICAvLyDliJ3lp4vljJbpq5jkuq7ns7vnu59cbiAgICAgICAgICAgICAgICBpbml0aWFsaXplSGlnaGxpZ2h0U3lzdGVtKClcbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jIG9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1hbmFnZXIuaXNFbmFibGVkKCkpIHJldHVyblxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubWFuYWdlci5hdXRvRXh0cmFjdEFuZEhpZ2hsaWdodCgpXG5cbiAgICAgICAgICAgICAgICB0aGlzLm1hbmFnZXIuc3RhcnQoKVxuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMgb2ZmKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tYW5hZ2VyLmlzRW5hYmxlZCgpKSByZXR1cm5cbiAgICAgICAgICAgICAgICB0aGlzLm1hbmFnZXIuc3RvcCgpXG4gICAgICAgIH1cbn1cbiIsImltcG9ydCB7IGluaXRTdHJpcGUgfSBmcm9tICcuL3N0cmlwZSdcbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tICcuLi9GZWF0dXJlJ1xuXG4vKipcbiAqIOadoee6ueiDjOaZr+WKn+iDvVxuICovXG5leHBvcnQgY2xhc3MgU3RyaXBlRmVhdHVyZSBleHRlbmRzIEZlYXR1cmUge1xuICAgICAgICByZWFkb25seSBuYW1lID0gJ3N0cmlwZSdcbiAgICAgICAgcmVhZG9ubHkgZGVmYXVsdCA9IGZhbHNlXG5cbiAgICAgICAgYXN5bmMgb24oKSB7XG4gICAgICAgICAgICAgICAgaW5pdFN0cmlwZSgpXG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBvZmYoKSB7XG4gICAgICAgICAgICAgICAgLy8gc3RyaXBl5peg5piO56Gu5YWz6Zet5Ye95pWw77yM55WZ56m6XG4gICAgICAgIH1cbn1cbiIsImltcG9ydCB7IGluaXRMaW5rVGFyZ2V0TWFuYWdlciwgc2V0TGlua1RhcmdldEVuYWJsZWQgfSBmcm9tICcuL2xpbmtUYXJnZXQnXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSAnLi4vRmVhdHVyZSdcblxuLyoqXG4gKiDpk77mjqXnm67moIfmoLflvI/lip/og71cbiAqL1xuZXhwb3J0IGNsYXNzIExpbmtUYXJnZXRGZWF0dXJlIGV4dGVuZHMgRmVhdHVyZSB7XG4gICAgICAgIHJlYWRvbmx5IG5hbWUgPSAnbGlua1RhcmdldCdcbiAgICAgICAgcmVhZG9ubHkgZGVmYXVsdCA9IHRydWVcblxuICAgICAgICBwcml2YXRlIGNsZWFudXBGdW5jdGlvbjogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGxcblxuICAgICAgICBhc3luYyBpbml0KCkge1xuICAgICAgICAgICAgICAgIC8vIOajgOafpeWKn+iDveaYr+WQpuWQr+eUqFxuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWQgPSBhd2FpdCB0aGlzLmlzTGlua1RhcmdldEZlYXR1cmVFbmFibGVkKClcbiAgICAgICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhbnVwRnVuY3Rpb24gPSBpbml0TGlua1RhcmdldE1hbmFnZXIoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jIG9uKCkge1xuICAgICAgICAgICAgICAgIC8vIOS/neWtmOiuvue9rlxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0TGlua1RhcmdldEZlYXR1cmVFbmFibGVkKHRydWUpXG4gICAgICAgICAgICAgICAgLy8g5ZCv55So5Yqf6IO9XG4gICAgICAgICAgICAgICAgc2V0TGlua1RhcmdldEVuYWJsZWQodHJ1ZSlcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzov5jmsqHmnInliJ3lp4vljJbvvIzliJnliJ3lp4vljJZcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY2xlYW51cEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFudXBGdW5jdGlvbiA9IGluaXRMaW5rVGFyZ2V0TWFuYWdlcigpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMgb2ZmKCkge1xuICAgICAgICAgICAgICAgIC8vIOS/neWtmOiuvue9rlxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0TGlua1RhcmdldEZlYXR1cmVFbmFibGVkKGZhbHNlKVxuICAgICAgICAgICAgICAgIC8vIOemgeeUqOWKn+iDvVxuICAgICAgICAgICAgICAgIHNldExpbmtUYXJnZXRFbmFibGVkKGZhbHNlKVxuICAgICAgICAgICAgICAgIC8vIOaJp+ihjOa4heeQhlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNsZWFudXBGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhbnVwRnVuY3Rpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhbnVwRnVuY3Rpb24gPSBudWxsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Lul5LiL5piv5LuOIGxpbmtUYXJnZXRNYW5hZ2VyLnRzIOi/geenu+eahOWHveaVsFxuICAgICAgICBwcml2YXRlIGFzeW5jIGlzTGlua1RhcmdldEZlYXR1cmVFbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbmFibGVkID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc3RvcmFnZS5nZXRJdGVtPGJvb2xlYW4+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsb2NhbDpsaW5rVGFyZ2V0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5hYmxlZCAhPT0gbnVsbCA/IGVuYWJsZWQgOiBmYWxzZSAvLyDpu5jorqTnpoHnlKhcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRmFpbGVkIHRvIHJlYWQgbGluayB0YXJnZXQgc2V0dGluZzonLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBhc3luYyBzZXRMaW5rVGFyZ2V0RmVhdHVyZUVuYWJsZWQoXG4gICAgICAgICAgICAgICAgZW5hYmxlZDogYm9vbGVhblxuICAgICAgICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc3RvcmFnZS5zZXRJdGVtKCdsb2NhbDpsaW5rVGFyZ2V0JywgZW5hYmxlZClcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0ZhaWxlZCB0byBzYXZlIGxpbmsgdGFyZ2V0IHNldHRpbmc6JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBnZXRMaW5rVGFyZ2V0U3RhdHVzKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmlzTGlua1RhcmdldEZlYXR1cmVFbmFibGVkKClcbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jIHRvZ2dsZUxpbmtUYXJnZXQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFN0YXR1cyA9IGF3YWl0IHRoaXMuZ2V0TGlua1RhcmdldFN0YXR1cygpXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3U3RhdHVzID0gIWN1cnJlbnRTdGF0dXNcbiAgICAgICAgICAgICAgICBpZiAobmV3U3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLm9uKClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5vZmYoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3U3RhdHVzXG4gICAgICAgIH1cblxuICAgICAgICBjbGVhbnVwKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNsZWFudXBGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhbnVwRnVuY3Rpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhbnVwRnVuY3Rpb24gPSBudWxsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG59XG4iLCJpbXBvcnQgeyBnZXRLZXlXaXRoRG9tYWluIH0gZnJvbSAnLi91dGlscy9zdG9yYWdlL3N0b3JhZ2UnXG5pbXBvcnQgeyBJRmVhdHVyZSB9IGZyb20gJy4vZmVhdHVyZS9GZWF0dXJlJ1xuaW1wb3J0IHsgQmlvbmljRmVhdHVyZSB9IGZyb20gJy4vZmVhdHVyZS9iaW9uaWMvQmlvbmljRmVhdHVyZSdcbmltcG9ydCB7IEhpZ2hsaWdodEZlYXR1cmUgfSBmcm9tICcuL2ZlYXR1cmUvaGlnaGxpZ2h0L0hpZ2hsaWdodEZlYXR1cmUnXG5pbXBvcnQgeyBUcmFuc2xhdGVGZWF0dXJlIH0gZnJvbSAnLi9mZWF0dXJlL3RyYW5zbGF0ZS9UcmFuc2xhdGVGZWF0dXJlJ1xuaW1wb3J0IHsgU3RyaXBlRmVhdHVyZSB9IGZyb20gJy4vZmVhdHVyZS9zdHJpcGUvU3RyaXBlRmVhdHVyZSdcbmltcG9ydCB7IExpbmtUYXJnZXRGZWF0dXJlIH0gZnJvbSAnLi9mZWF0dXJlL2xpbmtUYXJnZXQvTGlua1RhcmdldEZlYXR1cmUnXG5cbi8vIOiuvue9rueKtuaAgeexu+Wei+WumuS5iVxuaW50ZXJmYWNlIFNldHRpbmdTdGF0ZSB7XG4gICAgICAgIHZhbHVlOiBib29sZWFuXG4gICAgICAgIGlzRGVmYXVsdDogYm9vbGVhblxufVxuXG5jb25zdCBzZXR0aW5nOiB7IFtrZXk6IHN0cmluZ106IFNldHRpbmdTdGF0ZSB9ID0ge1xuICAgICAgICBoaWdobGlnaHQ6IHsgdmFsdWU6IGZhbHNlLCBpc0RlZmF1bHQ6IHRydWUgfSxcbiAgICAgICAgc3RyaXBlOiB7IHZhbHVlOiBmYWxzZSwgaXNEZWZhdWx0OiB0cnVlIH0sXG4gICAgICAgIHRyYW5zbGF0ZTogeyB2YWx1ZTogZmFsc2UsIGlzRGVmYXVsdDogdHJ1ZSB9LFxuICAgICAgICBiaW9uaWM6IHsgdmFsdWU6IGZhbHNlLCBpc0RlZmF1bHQ6IHRydWUgfSxcbiAgICAgICAgbGlua1RhcmdldDogeyB2YWx1ZTogZmFsc2UsIGlzRGVmYXVsdDogdHJ1ZSB9LFxufVxuXG4vLyDlr7zlh7rlj6ror7vnmoQgc2V0dGluZyDlia/mnKxcbmV4cG9ydCBmdW5jdGlvbiBnZXRTZXR0aW5nKCk6IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9IHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfSA9IHt9XG4gICAgICAgIE9iamVjdC5rZXlzKHNldHRpbmcpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gc2V0dGluZ1trZXldLnZhbHVlXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiByZXN1bHRcbn1cblxuLy8g5a+85Ye66K6+572u54q25oCB77yI5YyF5ZCr6buY6K6k5YC85L+h5oGv77yJXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2V0dGluZ1N0YXRlKCk6IHsgW2tleTogc3RyaW5nXTogU2V0dGluZ1N0YXRlIH0ge1xuICAgICAgICByZXR1cm4geyAuLi5zZXR0aW5nIH1cbn1cblxuLy8g5Yib5bu65Yqf6IO95a6e5L6LXG5jb25zdCBmZWF0dXJlSW5zdGFuY2VzOiB7IFtrZXk6IHN0cmluZ106IElGZWF0dXJlIH0gPSB7XG4gICAgICAgIGJpb25pYzogbmV3IEJpb25pY0ZlYXR1cmUoKSxcbiAgICAgICAgaGlnaGxpZ2h0OiBuZXcgSGlnaGxpZ2h0RmVhdHVyZSgpLFxuICAgICAgICB0cmFuc2xhdGU6IG5ldyBUcmFuc2xhdGVGZWF0dXJlKCksXG4gICAgICAgIHN0cmlwZTogbmV3IFN0cmlwZUZlYXR1cmUoKSxcbiAgICAgICAgbGlua1RhcmdldDogbmV3IExpbmtUYXJnZXRGZWF0dXJlKCksXG59XG5cbi8vIOmAmueUqOWIneWni+WMluWHveaVsFxuYXN5bmMgZnVuY3Rpb24gaW5pdEZlYXR1cmUoa2V5OiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgZmVhdHVyZSA9IGZlYXR1cmVJbnN0YW5jZXNba2V5XVxuICAgICAgICBpZiAoIWZlYXR1cmUpIHJldHVyblxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZG9tYWluS2V5ID0gZ2V0S2V5V2l0aERvbWFpbihrZXkpIC8vIOeUn+aIkOWfn+WQjemUrlxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgc3RvcmFnZS5nZXRJdGVtPGJvb2xlYW4+KGRvbWFpbktleSlcbiAgICAgICAgICAgICAgICBhd2FpdCBzd2l0Y2hGZWF0dXJlKFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgIT09IG51bGwgPyB2YWx1ZSA6IGZlYXR1cmUuZGVmYXVsdFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihg5Yid5aeL5YyWJHtrZXl95aSx6LSlYCwgZXJyKVxuICAgICAgICB9XG59XG5cbi8qKlxuICog5YiH5o2i5oyH5a6a5Yqf6IO96ZSu55qE54m55oCn54q25oCB44CCXG4gKiBAcGFyYW0ga2V5IC0g5Yqf6IO96ZSu5qCH6K+G56ymXG4gKiBAcGFyYW0gbmV3VmFsdWUgLSDmlrDnmoTluIPlsJTlgLzmiJZudWxs77yM6Iul5Li6bnVsbOWImeS9v+eUqOm7mOiupOWAvFxuICogQHBhcmFtIGlzRGVmYXVsdCAtIOaYr+WQpuS4uum7mOiupOWAvFxuICogQHJldHVybnMgdm9pZFxuICovXG5hc3luYyBmdW5jdGlvbiBzd2l0Y2hGZWF0dXJlKFxuICAgICAgICBrZXk6IHN0cmluZyxcbiAgICAgICAgbmV3VmFsdWU6IGJvb2xlYW4gfCBudWxsLFxuICAgICAgICBpc0RlZmF1bHQ6IGJvb2xlYW4gPSBmYWxzZVxuKSB7XG4gICAgICAgIGNvbnN0IGZlYXR1cmUgPSBmZWF0dXJlSW5zdGFuY2VzW2tleV1cbiAgICAgICAgaWYgKCFmZWF0dXJlKSByZXR1cm5cblxuICAgICAgICAvLyDlpITnkIbpu5jorqTlgLzpgLvovpFcbiAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbmV3VmFsdWUgPSBmZWF0dXJlLmRlZmF1bHRcbiAgICAgICAgICAgICAgICBpc0RlZmF1bHQgPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmiafooYznibnmgKflvIDlhbPlm57osINcbiAgICAgICAgaWYgKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmVhdHVyZS5vbigpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmVhdHVyZS5vZmYoKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pu05paw6K6+572u54q25oCBXG4gICAgICAgIHNldHRpbmdba2V5XSA9IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmV3VmFsdWUsXG4gICAgICAgICAgICAgICAgaXNEZWZhdWx0OiBpc0RlZmF1bHQsXG4gICAgICAgIH1cbn1cblxuLyoqXG4gKiDliJ3lp4vljJborr7nva7nrqHnkIblmajvvIzotJ/otKPlkIzmraXphY3nva7lubbnm5HlkKzlip/og73lvIDlhbPlj5jljJZcbiAqIEByZW1hcmtzXG4gKiDor6Xlh73mlbDkvJrmiafooYzku6XkuIvmk43kvZzvvJpcbiAqIDEuIOWQjOatpeWFqOWxgOiuvue9rlxuICogMi4g5Yid5aeL5YyW5omA5pyJ5Yqf6IO95qih5Z2XXG4gKiAzLiDlu7rnq4vlip/og73phY3nva7pobnnmoTlrp7ml7bnm5HlkKzmnLrliLZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRTZXR0aW5nTWFuYWdlcigpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWQjOatpeWFqOWxgOiuvue9ruWIsOacrOWcsOWtmOWCqFxuICAgICAgICAgKi9cbiAgICAgICAgc3luY1NldHRpbmdzKClcblxuICAgICAgICAvKipcbiAgICAgICAgICog5bm26KGM5Yid5aeL5YyW5omA5pyJ5Yqf6IO95qih5Z2XXG4gICAgICAgICAqIOS9v+eUqCBQcm9taXNlLmFsbCDmj5Dpq5jliJ3lp4vljJbmlYjnjodcbiAgICAgICAgICovXG4gICAgICAgIE9iamVjdC5rZXlzKGZlYXR1cmVJbnN0YW5jZXMpLm1hcCgoa2V5KSA9PlxuICAgICAgICAgICAgICAgIGluaXRGZWF0dXJlKGtleSkuY2F0Y2goKGVycikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOWIneWni+WMliR7a2V5feWksei0pWAsIGVycilcbiAgICAgICAgICAgICAgICApXG4gICAgICAgIClcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Li65q+P5Liq5Yqf6IO96aG55bu656uL5a2Y5YKo5Y+Y5pu055uR5ZCs5ZmoXG4gICAgICAgICAqIEBwYXJhbSBrZXkgLSDlip/og73phY3nva7pobnllK/kuIDmoIfor4ZcbiAgICAgICAgICogQHJldHVybnMgdm9pZFxuICAgICAgICAgKiBAaW50ZXJuYWxcbiAgICAgICAgICog5L2/55So5bim5Z+f5ZCN5YmN57yA55qE5a2Y5YKo6ZSu6L+b6KGM55uR5ZCs77yM5Y+Y5YyW5pe26LCD55Soc3dpdGNoRmVhdHVyZeWkhOeQhlxuICAgICAgICAgKi9cbiAgICAgICAgT2JqZWN0LmtleXMoZmVhdHVyZUluc3RhbmNlcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgc3RvcmFnZS53YXRjaDxib29sZWFuPihcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldEtleVdpdGhEb21haW4oa2V5KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jIChuZXdWYWx1ZTogYm9vbGVhbiB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzd2l0Y2hGZWF0dXJlKGtleSwgbmV3VmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOabtOaWsCR7a2V5feWksei0pWAsIGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgfSlcblxuICAgICAgICBpbml0U2hvcnRjdXRzKClcbn1cblxuZnVuY3Rpb24gaW5pdFNob3J0Y3V0cygpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5jdHJsS2V5ICYmIGV2ZW50LmtleSA9PT0gJ3EnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2hGZWF0dXJlKCd0cmFuc2xhdGUnLCAhZ2V0U2V0dGluZygpWyd0cmFuc2xhdGUnXSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0pXG59XG5cbi8qKlxuICog5LuO5a2Y5YKo5Lit5ZCM5q2l5Yqf6IO96YWN572u6K6+572u5Yiw5YWo5bGAc2V0dGluZ+WvueixoVxuICog5LyY5YWI6K+75Y+W5Z+f5ZCN5LiT5bGe6YWN572u77yM6ZmN57qn5L2/55So5YWo5bGA6YWN572u77yM5pyA57uI5Zue6YCA5Yiw6buY6K6k5YC8XG4gKlxuICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IOaXoOi/lOWbnuWAvO+8jOS9huS8muS/ruaUueWFqOWxgHNldHRpbmflr7nosaFcbiAqL1xuYXN5bmMgZnVuY3Rpb24gc3luY1NldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoZmVhdHVyZUluc3RhbmNlcylcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZlYXR1cmUgPSBmZWF0dXJlSW5zdGFuY2VzW2tleV1cbiAgICAgICAgICAgICAgICBjb25zdCBkb21haW5LZXkgPSBnZXRLZXlXaXRoRG9tYWluKGtleSlcblxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IGF3YWl0IHN0b3JhZ2UuZ2V0SXRlbTxib29sZWFuPihkb21haW5LZXkpXG4gICAgICAgICAgICAgICAgbGV0IGlzRGVmYXVsdCA9IGZhbHNlXG5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYXdhaXQgc3RvcmFnZS5nZXRJdGVtPGJvb2xlYW4+KGBsb2NhbDoke2tleX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZmVhdHVyZS5kZWZhdWx0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzRGVmYXVsdCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzZXR0aW5nW2tleV0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0RlZmF1bHQ6IGlzRGVmYXVsdCxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbn1cbiIsImltcG9ydCB7IGluaXRTdHJpcGUgfSBmcm9tICcuL2ZlYXR1cmUvc3RyaXBlL3N0cmlwZSdcbmltcG9ydCB7IGluaXRTZXR0aW5nTWFuYWdlciB9IGZyb20gJy4vc2V0dGluZ01hbmFnZXInXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbml0RnVuY3Rpb25zKCkge1xuICAgICAgICBjb25zdCBzdHJpcGVFbmFibGVkID0gYXdhaXQgc3RvcmFnZS5nZXRJdGVtKCdsb2NhbDpzdHJpcGUnKVxuICAgICAgICBpZiAoc3RyaXBlRW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIGluaXRTdHJpcGUoKVxuICAgICAgICB9XG4gICAgICAgIGluaXRTZXR0aW5nTWFuYWdlcigpXG59XG4iLCIvLyBpbXBvcnQgYW5jaG9yTGF5IGZyb20gJy4vYW5jaG9yTGF5b3V0LnZ1ZSdcbmltcG9ydCAnLi9hbmNob3IuY3NzJ1xuLy8gaW1wb3J0IHsgZ2V0QW5jaG9yc0luZm8gfSBmcm9tICcuL2FuY2hvcidcbmltcG9ydCB7IG1hbmFnZU11dGF0aW9uT2JzZXJ2ZXIgfSBmcm9tICcuLi8uLi9vYnNlcnZlci9kb21NdXRhdGlvbk9ic2VydmVyJ1xuZXhwb3J0IGZ1bmN0aW9uIHBpbigpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBpbml0QW5jaG9yQXBwKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOWmguaenOW3sue7j+WKoOi9veWujOaIkO+8jOebtOaOpeaJp+ihjFxuICAgICAgICAgICAgICAgIGluaXRBbmNob3JBcHAoKVxuICAgICAgICB9XG59XG5cbmZ1bmN0aW9uIGluaXRBbmNob3JBcHAoKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKVxuICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCgnYW5jaG9yLWNvbnRhaW5lcicsICduby10cmFuc2xhdGUnKVxuICAgICAgICAgICAgICAgIG1hbmFnZU11dGF0aW9uT2JzZXJ2ZXIoZmFsc2UpXG4gICAgICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGNvbnRhaW5lcilcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGVBcHAoYW5jaG9yTGF5LCB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB0ZXh0VG9BbmNob3I6IGdldEFuY2hvcnNJbmZvKCksXG4gICAgICAgICAgICAgICAgLy8gfSkubW91bnQoY29udGFpbmVyKVxuICAgICAgICAgICAgICAgIG1hbmFnZU11dGF0aW9uT2JzZXJ2ZXIodHJ1ZSlcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5oyC6L295a6M5oiQJylcbiAgICAgICAgfVxufVxuIiwiaW1wb3J0ICcuL3N0eWxlLmNzcydcclxuaW1wb3J0IHsgaW5pdEZ1bmN0aW9ucyB9IGZyb20gJy4vaW5pdEZ1bmN0aW9ucydcclxuaW1wb3J0IHsgcGluIH0gZnJvbSAnLi9mZWF0dXJlL2FuY2hvci9waW4nXHJcblxyXG4vLyDnp7vpmaR3eHTnmoRkZWZpbmVDb250ZW50U2NyaXB077yM5pS55Li655u05o6l5omn6KGMXHJcbmNvbnNvbGUubG9nKCctJy5yZXBlYXQoMjApKVxyXG5jb25zb2xlLmxvZygnY29udGVudCBzY3JpcHQgbG9hZGVkJylcclxuXHJcbi8vIOWIneWni+WMluWHveaVsFxyXG5pbml0RnVuY3Rpb25zKClcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBwaW4oKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGluaXRpYWxpemUgY29udGVudCBzY3JpcHQ6JywgZXJyb3IpXHJcbiAgICAgICAgfSlcclxuIl0sIm5hbWVzIjpbIkVYQ0xVREVfVEFHUyIsInRyYW5zbGF0ZU1TIiwidHJhbnNsYXRlRyIsInByb2Nlc3NBbGxMaW5rcyIsInRyYW5zbGF0ZUFkZGVkRWxlbWVudCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFJRztBQUVIOzs7QUFHRztBQUNILE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ3RCLE9BQU87SUFDUCxVQUFVO0lBQ1YsUUFBUTtJQUNSLFFBQVE7SUFDUixRQUFRO0lBQ1IsT0FBTztJQUNQLFVBQVU7SUFDVixVQUFVO0lBQ1YsS0FBSztJQUNMLEtBQUs7SUFDTCxPQUFPO0lBQ1AsT0FBTztJQUNQLFFBQVE7SUFDUixNQUFNO0lBQ04sUUFBUTtJQUNSLEdBQUc7QUFDVixDQUFBLENBQUM7QUFZRjs7Ozs7Ozs7Ozs7O0FBWUc7QUFDRyxTQUFVLFlBQVksQ0FDcEIsSUFBQSxHQUFhLFFBQVEsQ0FBQyxJQUFJLEVBQzFCLE9BQUEsR0FBK0IsRUFBRSxFQUFBO0lBRWpDLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDOztJQUczQyxNQUFNLFNBQVMsR0FBVyxFQUFFO0FBQzVCLElBQUEsT0FBTyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUU7QUFDbEIsUUFBQSxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsV0FBbUI7QUFDdkMsUUFBQSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztJQUM1QjtBQUVBLElBQUEsT0FBTyxTQUFTO0FBQ3hCO0FBRUE7Ozs7OztBQU1HO0FBQ0csU0FBVSxhQUFhLENBQ3JCLElBQUEsR0FBYSxRQUFRLENBQUMsSUFBSSxFQUMxQixPQUFBLEdBQStCLEVBQUUsRUFBQTs7SUFHakMsTUFBTSxFQUFFLGFBQWEsR0FBRyxJQUFJLEVBQUUsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLEdBQUcsT0FBTztBQUU5RCxJQUFBLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBVSxLQUFJO0FBQzFCLFFBQUEsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWE7QUFFakMsUUFBQSxJ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QVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7QUFDaEIsS0FBQTtBQUNELElBQUE7UUFDUSxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO0FBQ2hCLEtBQUE7Q0FDUjtBQUVEOzs7QUFHRztBQUNJLE1BQU0sYUFBYSxHQUFHO0FBQ3JCLElBQUE7UUFDUSxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO0FBQ2hCLEtBQUE7QUFDRCxJQUFBO1FBQ1EsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztBQUNoQixLQUFBO0FBQ0QsSUFBQTtRQUNRLFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7QUFDaEIsS0FBQTtBQUNELElBQUE7UUFDUSxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO0FBQ2hCLEtBQUE7QUFDRCxJQUFBO1FBQ1EsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztBQUNoQixLQUFBO0FBQ0QsSUFBQTtRQUNRLFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FBQ1QsU0FBUztRQUNULFNBQVM7UUFDVCxTQUFTO1FB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
