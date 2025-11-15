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
 * 移除所有链接的样式
 */
export function removeAllLinkStyles(
        removeStyle: (link: HTMLAnchorElement) => void
): void {
        const links = document.querySelectorAll('a')
        for (const link of links) {
                if (link instanceof HTMLAnchorElement) {
                        removeStyle(link)
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
                removeAllLinkStyles(removeStyle)
        } else {
                // 启用时重新应用样式
                processAllLinks(applyStyle)
        }
}
