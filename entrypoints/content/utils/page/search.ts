/**
 * 搜索引擎配置工具函数
 *
 * 提供搜索引擎识别和配置管理功能
 */

/**
 * 搜索引擎配置接口
 * 定义搜索引擎的名称、关键词参数和URL模式
 */
export interface SearchEngineConfig {
        /** 搜索引擎名称 */
        name: string
        /** URL中表示关键词的参数名 */
        keywordParam: string
        /** 用于匹配搜索引擎的URL模式 */
        urlPattern: string
}

/**
 * 支持的搜索引擎配置列表
 * 包含主流搜索引擎的配置信息
 */
export const searchEngines: SearchEngineConfig[] = [
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
]

/**
 * 根据URL获取搜索引擎配置
 *
 * @param url - 要检查的URL
 * @returns 匹配的搜索引擎配置，如果没有匹配则返回 null
 */
export function getSearchEngineByUrl(url: string): SearchEngineConfig | null {
        const host = new URL(url).host

        for (const engine of searchEngines) {
                if (engine.urlPattern && host.includes(engine.urlPattern)) {
                        return engine
                }
        }

        return null
}

/**
 * 从URL中提取搜索关键词
 *
 * @param url - 包含搜索关键词的URL
 * @returns 提取的搜索关键词，如果没有找到则返回 null
 */
export function extractSearchKeywords(url: string): string | null {
        const engine = getSearchEngineByUrl(url)
        if (!engine) return null

        const urlObj = new URL(url)
        const keyword = urlObj.searchParams.get(engine.keywordParam)
        return keyword || null
}

/**
 * 获取所有支持的搜索引擎名称
 *
 * @returns 搜索引擎名称数组
 */
export function getSupportedSearchEngineNames(): string[] {
        return searchEngines.map((engine) => engine.name)
}
