/**
 * 链接目标样式管理器
 *
 * 根据a标签的target属性区分链接打开方式，并提供不同样式
 */

import {
        shouldExcludeLink,
        createLinkStyleManager,
        setLinkStyleEnabled,
} from '../../utils/dom/link'

// 链接目标类型枚举
export enum LinkTargetType {
        NEW_TAB = 'new-tab', // 新建标签页 (_blank)
        SAME_TAB = 'same-tab', // 替换当前页 (_self, _parent, _top)
        DEFAULT = 'default', // 默认行为 (无target或无效target)
}

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
function shouldExcludeLinkTarget(link: HTMLAnchorElement): boolean {
        // 检查基础排除选择器
        if (shouldExcludeLink(link)) {
                return true
        }

        // 检查是否已经有样式类 - 优化：使用更快的检查方式
        const classList = link.classList
        if (
                classList.contains('bread-link-target-new-tab') ||
                classList.contains('bread-link-target-same-tab') ||
                classList.contains('bread-link-target-default')
        ) {
                return true
        }

        return false
}

/**
 * 为链接应用目标样式
 */
function applyLinkTargetStyle(link: HTMLAnchorElement): void {
        if (shouldExcludeLinkTarget(link)) {
                return
        }

        const targetType = getLinkTargetType(link)
        const classList = link.classList

        // 优化：只在需要时修改DOM
        const expectedClass = `bread-link-target-${targetType}`

        // 检查当前是否已经是正确的样式类
        if (classList.contains(expectedClass)) {
                return // 已经是正确的样式，无需修改
        }

        // 批量移除所有可能的目标样式类
        classList.remove(
                'bread-link-target-new-tab',
                'bread-link-target-same-tab',
                'bread-link-target-default'
        )

        // 添加对应的样式类
        classList.add(expectedClass)
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
 * 初始化链接目标样式管理器
 */
export function initLinkTargetManager(): () => void {
        return createLinkStyleManager(
                applyLinkTargetStyle,
                removeLinkTargetStyle
        )
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
        setLinkStyleEnabled(
                enabled,
                applyLinkTargetStyle,
                removeLinkTargetStyle
        )
}
