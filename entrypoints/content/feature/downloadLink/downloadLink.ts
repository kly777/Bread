/**
 * 下载链接标记管理器
 *
 * 根据a标签的download属性标记下载链接，并提供视觉样式
 */

// 下载链接类型枚举
export enum DownloadLinkType {
        DOWNLOAD = 'download', // 有download属性的链接
        DEFAULT = 'default', // 普通链接
}

import {
        shouldExcludeLink,
        createLinkStyleManager,
        setLinkStyleEnabled,
} from '../../utils/dom/link'

/**
 * 获取链接的下载类型
 */
function getDownloadLinkType(link: HTMLAnchorElement): DownloadLinkType {
        const hasDownload = link.hasAttribute('download')

        if (hasDownload) {
                return DownloadLinkType.DOWNLOAD
        }

        return DownloadLinkType.DEFAULT
}

/**
 * 检查链接是否应该被排除
 */
function shouldExcludeDownloadLink(link: HTMLAnchorElement): boolean {
        // 检查基础排除选择器
        if (shouldExcludeLink(link)) {
                return true
        }

        // 检查是否已经有样式类
        if (
                link.classList.contains('bread-download-link-download') ||
                link.classList.contains('bread-download-link-default')
        ) {
                return true
        }

        return false
}

/**
 * 为链接应用下载标记样式
 */
function applyDownloadLinkStyle(link: HTMLAnchorElement): void {
        if (shouldExcludeDownloadLink(link)) {
                return
        }

        const downloadType = getDownloadLinkType(link)

        // 移除可能存在的旧样式类
        link.classList.remove(
                'bread-download-link-download',
                'bread-download-link-default'
        )

        // 添加对应的样式类
        switch (downloadType) {
                case DownloadLinkType.DOWNLOAD:
                        link.classList.add('bread-download-link-download')
                        break
                case DownloadLinkType.DEFAULT:
                        link.classList.add('bread-download-link-default')
                        break
        }
}

/**
 * 移除链接的下载标记样式
 */
function removeDownloadLinkStyle(link: HTMLAnchorElement): void {
        link.classList.remove(
                'bread-download-link-download',
                'bread-download-link-default'
        )
}

/**
 * 初始化下载链接标记管理器
 */
export function initDownloadLinkManager(): () => void {
        return createLinkStyleManager(
                applyDownloadLinkStyle,
                removeDownloadLinkStyle
        )
}

/**
 * 手动为单个链接应用样式
 */
export function applyStyleToLink(link: HTMLAnchorElement): void {
        applyDownloadLinkStyle(link)
}

/**
 * 手动移除单个链接的样式
 */
export function removeStyleFromLink(link: HTMLAnchorElement): void {
        removeDownloadLinkStyle(link)
}

/**
 * 检查下载链接标记功能是否启用
 */
export function isDownloadLinkEnabled(): boolean {
        // 这里可以集成到设置系统中
        return true // 默认启用
}

/**
 * 启用/禁用下载链接标记功能
 */
export function setDownloadLinkEnabled(enabled: boolean): void {
        setLinkStyleEnabled(
                enabled,
                applyDownloadLinkStyle,
                removeDownloadLinkStyle
        )
}
