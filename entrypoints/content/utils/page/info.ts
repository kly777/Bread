/**
 * 页面信息工具函数
 *
 * 提供获取页面语言、搜索引擎识别等功能
 */

import { searchEngines } from './search'

let lang: string | null = null

/**
 * 获取页面语言
 *
 * 从 document.documentElement.lang 获取页面语言，如果没有设置则返回 'en'
 * 使用缓存机制避免重复计算
 *
 * @returns 页面语言代码
 */
export function pageLang(): string {
        if (lang !== null) {
                return lang
        }
        lang = document.documentElement.lang || 'en'
        return lang
}

/**
 * 判断当前页面是否是搜索引擎页面
 *
 * 通过检查当前页面的主机名是否匹配已知的搜索引擎模式
 *
 * @returns 如果是搜索引擎页面返回 true，否则返回 false
 */
export function isSearchEnginePage(): boolean {
        const host = window.location.host
        console.log('[highlight]:Is %s a search engine page?', host)

        for (const engine of searchEngines) {
                if (engine.urlPattern && host.includes(engine.urlPattern)) {
                        return true
                }
        }

        return false
}

/**
 * 获取当前页面的搜索引擎配置
 *
 * @returns 匹配的搜索引擎配置，如果没有匹配则返回 null
 */
export function getCurrentSearchEngine(): (typeof searchEngines)[0] | null {
        const host = window.location.host

        for (const engine of searchEngines) {
                if (engine.urlPattern && host.includes(engine.urlPattern)) {
                        return engine
                }
        }

        return null
}

/**
 * 获取页面标题
 *
 * @returns 页面标题
 */
export function getPageTitle(): string {
        return document.title
}

/**
 * 获取页面URL
 *
 * @returns 页面URL
 */
export function getPageUrl(): string {
        return window.location.href
}
