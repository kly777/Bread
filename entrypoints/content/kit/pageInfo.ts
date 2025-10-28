import { searchEngines } from './searchEngines'

let lang: string | null = null
export function pageLang(): string {
        if (lang !== null) {
                return lang
        }
        lang = document.documentElement.lang || 'en'
        console.log('lang:', lang)
        return lang
}

/**
 * 判断当前页面是否是搜索引擎页面
 * @returns 如果是搜索引擎页面返回true，否则返回false
 */
export function isSearchEnginePage(): boolean {
        const host = window.location.host
        
        for (const engine of searchEngines) {
                if (engine.urlPattern && host.includes(engine.urlPattern)) {
                        return true
                }
        }
        
        return false
}