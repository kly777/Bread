/**
 * 链接目标样式管理器
 *
 * 根据a标签的target属性区分链接打开方式，并提供不同样式
 */

// 链接目标类型枚举
export enum LinkTargetType {
        NEW_TAB = 'new-tab', // 新建标签页 (_blank)
        SAME_TAB = 'same-tab', // 替换当前页 (_self, _parent, _top)
        DEFAULT = 'default', // 默认行为 (无target或无效target)
}

// 排除的链接选择器（避免在某些元素上应用样式）
const EXCLUDED_SELECTORS = [
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
 * 获取链接的目标类型
 */
function getLinkTargetType(link: HTMLAnchorElement): LinkTargetType {
        const target = link.target?.toLowerCase()

        if (target === '_blank') {
                return LinkTargetType.NEW_TAB
        }

        if (target === '_self' || target === '_parent' || target === '_top') {
                return LinkTargetType.SAME_TAB
        }

        return LinkTargetType.DEFAULT
}

/**
 * 检查链接是否应该被排除
 */
function shouldExcludeLink(link: HTMLAnchorElement): boolean {
        // 检查排除选择器
        for (const selector of EXCLUDED_SELECTORS.split(',')) {
                if (link.matches(selector.trim())) {
                        return true
                }
        }

        // 检查是否已经有样式类
        if (
                link.classList.contains('bread-link-target-new-tab') ||
                link.classList.contains('bread-link-target-same-tab') ||
                link.classList.contains('bread-link-target-default')
        ) {
                return true
        }

        return false
}

/**
 * 为链接应用目标样式
 */
function applyLinkTargetStyle(link: HTMLAnchorElement): void {
        if (shouldExcludeLink(link)) {
                return
        }

        const targetType = getLinkTargetType(link)

        // 移除可能存在的旧样式类
        link.classList.remove(
                'bread-link-target-new-tab',
                'bread-link-target-same-tab',
                'bread-link-target-default'
        )

        // 添加对应的样式类
        switch (targetType) {
                case LinkTargetType.NEW_TAB:
                        link.classList.add('bread-link-target-new-tab')
                        break
                case LinkTargetType.SAME_TAB:
                        link.classList.add('bread-link-target-same-tab')
                        break
                case LinkTargetType.DEFAULT:
                        link.classList.add('bread-link-target-default')
                        break
        }
}

/**
 * 移除链接的目标样式
 */
function removeLinkTargetStyle(link: HTMLAnchorElement): void {
        link.classList.remove(
                'bread-link-target-new-tab',
                'bread-link-target-same-tab',
                'bread-link-target-default'
        )
}

/**
 * 处理页面中的所有链接
 */
function processAllLinks(): void {
        const links = document.querySelectorAll('a')

        links.forEach((link) => {
                if (link instanceof HTMLAnchorElement) {
                        applyLinkTargetStyle(link)
                }
        })
}

/**
 * 初始化链接目标样式管理器
 */
export function initLinkTargetManager(): () => void {
        // 处理现有链接
        processAllLinks()

        // 监听DOM变化，处理新增的链接
        const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                        if (mutation.type === 'childList') {
                                mutation.addedNodes.forEach((node) => {
                                        if (node instanceof HTMLElement) {
                                                // 检查新增节点中的链接
                                                const links =
                                                        node.querySelectorAll(
                                                                'a'
                                                        )
                                                links.forEach((link) => {
                                                        if (
                                                                link instanceof
                                                                HTMLAnchorElement
                                                        ) {
                                                                applyLinkTargetStyle(
                                                                        link
                                                                )
                                                        }
                                                })

                                                // 如果新增节点本身是链接
                                                if (
                                                        node instanceof
                                                        HTMLAnchorElement
                                                ) {
                                                        applyLinkTargetStyle(
                                                                node
                                                        )
                                                }
                                        }
                                })
                        }
                }
        })

        observer.observe(document.body, {
                childList: true,
                subtree: true,
        })

        // 返回清理函数
        return () => {
                observer.disconnect()

                // 移除所有样式
                const links = document.querySelectorAll('a')
                links.forEach((link) => {
                        if (link instanceof HTMLAnchorElement) {
                                removeLinkTargetStyle(link)
                        }
                })
        }
}

/**
 * 手动为单个链接应用样式
 */
export function applyStyleToLink(link: HTMLAnchorElement): void {
        applyLinkTargetStyle(link)
}

/**
 * 手动移除单个链接的样式
 */
export function removeStyleFromLink(link: HTMLAnchorElement): void {
        removeLinkTargetStyle(link)
}

/**
 * 检查链接目标样式功能是否启用
 */
export function isLinkTargetEnabled(): boolean {
        // 这里可以集成到设置系统中
        return true // 默认启用
}

/**
 * 启用/禁用链接目标样式功能
 */
export function setLinkTargetEnabled(enabled: boolean): void {
        if (!enabled) {
                // 禁用时移除所有样式
                const links = document.querySelectorAll('a')
                links.forEach((link) => {
                        if (link instanceof HTMLAnchorElement) {
                                removeLinkTargetStyle(link)
                        }
                })
        } else {
                // 启用时重新应用样式
                processAllLinks()
        }
}
