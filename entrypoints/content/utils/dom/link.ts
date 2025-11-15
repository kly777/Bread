/**
 * 通用链接处理工具
 *
 * 提供链接处理的通用功能，包括排除选择器、DOM监听等
 */

// 排除的链接选择器（避免在某些元素上应用样式）
export const EXCLUDED_LINK_SELECTORS = [
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
].join(',')

/**
 * 检查链接是否应该被排除
 */
export function shouldExcludeLink(
        link: HTMLAnchorElement,
        customExcludedSelectors: string[] = []
): boolean {
        // 检查基础排除选择器
        for (const selector of EXCLUDED_LINK_SELECTORS.split(',')) {
                if (link.matches(selector.trim())) {
                        return true
                }
        }

        // 检查自定义排除选择器
        for (const selector of customExcludedSelectors) {
                if (link.matches(selector.trim())) {
                        return true
                }
        }

        return false
}

/**
 * 处理页面中的所有链接
 */
export function processAllLinks(
        applyStyle: (link: HTMLAnchorElement) => void,
        processedLinks?: WeakSet<HTMLAnchorElement>
): void {
        const links = document.querySelectorAll('a')

        links.forEach((link) => {
                if (link instanceof HTMLAnchorElement) {
                        // 如果提供了缓存，检查是否已处理
                        if (processedLinks && processedLinks.has(link)) {
                                return
                        }
                        applyStyle(link)
                        // 如果提供了缓存，标记为已处理
                        if (processedLinks) {
                                processedLinks.add(link)
                        }
                }
        })
}

/**
 * 处理新增节点中的链接
 */
function processAddedNode(
        node: Node,
        processedLinks: WeakSet<HTMLAnchorElement>,
        linksToProcess: Set<HTMLAnchorElement>
): void {
        if (!(node instanceof HTMLElement)) {
                return
        }

        // 检查新增节点中的链接
        const links = node.querySelectorAll('a')
        for (const link of links) {
                if (
                        link instanceof HTMLAnchorElement &&
                        !processedLinks.has(link)
                ) {
                        linksToProcess.add(link)
                }
        }

        // 如果新增节点本身是链接
        if (
                node instanceof HTMLAnchorElement &&
                !processedLinks.has(node)
        ) {
                linksToProcess.add(node)
        }
}

/**
 * 处理属性变化的链接
 */
function processAttributeChange(
        mutation: MutationRecord,
        processedLinks: WeakSet<HTMLAnchorElement>,
        linksToProcess: Set<HTMLAnchorElement>
): void {
        if (
                mutation.target instanceof HTMLAnchorElement &&
                mutation.attributeName === 'target'
        ) {
                const link = mutation.target
                // 移除缓存，强制重新应用样式
                processedLinks.delete(link)
                linksToProcess.add(link)
        }
}

/**
 * 处理DOM变化
 */
function processMutations(
        mutations: MutationRecord[],
        processedLinks: WeakSet<HTMLAnchorElement>,
        applyStyle: (link: HTMLAnchorElement) => void
): void {
        const linksToProcess = new Set<HTMLAnchorElement>()

        for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                        // 处理新增节点
                        for (const node of mutation.addedNodes) {
                                processAddedNode(node, processedLinks, linksToProcess)
                        }
                } else if (mutation.type === 'attributes') {
                        // 处理属性变化
                        processAttributeChange(mutation, processedLinks, linksToProcess)
                }
        }

        // 批量处理链接
        for (const link of linksToProcess) {
                applyStyle(link)
                processedLinks.add(link)
        }
}

/**
 * 创建链接样式管理器
 */
export function createLinkStyleManager(
        applyStyle: (link: HTMLAnchorElement) => void,
        removeStyle: (link: HTMLAnchorElement) => void
): () => void {
        // 缓存已处理的链接，避免重复处理
        const processedLinks = new WeakSet<HTMLAnchorElement>()

        // 处理现有链接
        processAllLinks(applyStyle, processedLinks)

        // 防抖定时器
        let debounceTimer: ReturnType<typeof setTimeout> | null = null

        // 监听DOM变化，处理新增的链接和属性变化
        const observer = new MutationObserver((mutations) => {
                // 使用防抖机制，避免频繁处理
                if (debounceTimer) {
                        clearTimeout(debounceTimer)
                }

                debounceTimer = setTimeout(() => {
                        processMutations(mutations, processedLinks, applyStyle)
                }, 16) // 约1帧时间
        })

        // 优化观察器配置，减少不必要的触发
        observer.observe(document.body, {
                childList: true,
                subtree: true,
                // 限制属性变化观察，只关注可能影响链接目标类型的属性
                attributes: true,
                attributeFilter: ['target'],
        })

        // 返回清理函数
        return () => {
                observer.disconnect()

                // 移除所有样式
                const links = document.querySelectorAll('a')
                for (const link of links) {
                        if (link instanceof HTMLAnchorElement) {
                                removeStyle(link)
                                processedLinks.delete(link)
                        }
                }
        }
}

/**
 * 启用/禁用链接样式功能
 */
export function setLinkStyleEnabled(
        enabled: boolean,
        applyStyle: (link: HTMLAnchorElement) => void,
        removeStyle: (link: HTMLAnchorElement) => void
): void {
        if (!enabled) {
                // 禁用时移除所有样式
                const links = document.querySelectorAll('a')
                links.forEach((link) => {
                        if (link instanceof HTMLAnchorElement) {
                                removeStyle(link)
                        }
                })
        } else {
                // 启用时重新应用样式
                processAllLinks(applyStyle)
        }
}
