/**
 * 搜索引擎配置接口
 * 定义搜索引擎的名称、关键词参数和URL模式
 */
export interface SearchEngineConfig {
    name: string // 搜索引擎名称
    keywordParam: string // URL中表示关键词的参数名
    urlPattern: string // 用于匹配搜索引擎的URL模式
}

/**
 * 支持的搜索引擎配置列表
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