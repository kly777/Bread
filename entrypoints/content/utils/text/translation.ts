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
export function shouldSkipTranslation(text: string): boolean {
        if (!text || text.length < 2) return true

        // 检查是否为纯数字或符号
        if (/^[\d\s\-\+\.\,]+$/.test(text)) return true

        // 检查是否为 URL 或文件路径
        if (/^(https?:\/\/|ftp:\/\/|file:\/\/|www\.|\/[\w\/])/i.test(text))
                return true

        // 检查是否为邮箱地址
        if (/^[\w\.\-]+@[\w\.\-]+\.\w+$/.test(text)) return true

        return false
}

/**
 * 判断元素是否应该跳过翻译
 *
 * @param element - 要检查的元素
 * @returns 如果应该跳过翻译返回 true，否则返回 false
 */
export function shouldSkipElementTranslation(element: HTMLElement): boolean {
        // 提前检查设置，避免不必要的处理
        const tagName = element.tagName.toLowerCase()

        // 排除特定标签
        const excludedTags = new Set([
                'script',
                'style',
                'noscript',
                'template',
                'code',
                'pre',
                'kbd',
                'samp',
                'var',
        ])

        if (excludedTags.has(tagName)) return true

        // 检查元素是否隐藏
        const style = window.getComputedStyle(element)
        if (style.display === 'none' || style.visibility === 'hidden') {
                return true
        }

        // 检查是否为输入元素
        if (
                element instanceof HTMLInputElement ||
                element instanceof HTMLTextAreaElement
        ) {
                return true
        }

        return false
}

/**
 * 预处理排除元素
 *
 * @param root - 根元素，默认为 document.body
 */
export function preprocessExcludedElements(
        root: Element = document.body
): void {
        const EXCLUDE_TAGS = new Set([
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
        ])

        const allElements = root.querySelectorAll('*')

        allElements.forEach((el) => {
                const tagName = el.tagName.toUpperCase()
                if (EXCLUDE_TAGS.has(tagName)) {
                        // 这里可以添加排除元素的处理逻辑
                }
        })
}

/**
 * 清除排除缓存
 */
export function clearExclusionCache(): void {
        // WeakSet 会自动垃圾回收，我们只需要创建一个新的
        // 这里可以添加缓存清理逻辑
}

/**
 * 提取文本片段进行翻译
 *
 * @param element - 要提取文本的元素
 * @returns 文本片段数组
 */
export function extractTextFragments(element: HTMLElement): string[] {
        const fragments: string[] = []
        const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                        acceptNode: (node) => {
                                const text = node.textContent?.trim()
                                if (!text || shouldSkipTranslation(text)) {
                                        return NodeFilter.FILTER_REJECT
                                }
                                return NodeFilter.FILTER_ACCEPT
                        },
                }
        )

        let node: Node | null
        while ((node = walker.nextNode())) {
                const text = node.textContent?.trim()
                if (text) {
                        fragments.push(text)
                }
        }

        return fragments
}

/**
 * 批量翻译文本
 *
 * @param texts - 要翻译的文本数组
 * @param translator - 翻译器函数
 * @returns 翻译结果数组
 */
export async function batchTranslateTexts(
        texts: string[],
        translator: (text: string) => Promise<string>
): Promise<string[]> {
        const results: string[] = []

        for (const text of texts) {
                try {
                        const translated = await translator(text)
                        results.push(translated)
                } catch (error) {
                        console.warn(`翻译失败: ${text}`, error)
                        results.push(text) // 失败时返回原文
                }
        }

        return results
}

/**
 * 创建翻译容器元素
 *
 * @param originalText - 原文
 * @param translatedText - 译文
 * @param shouldWrap - 是否使用行内容器
 * @returns 翻译容器元素
 */
export function createTranslationContainer(
        translatedText: string,
        shouldWrap: boolean
): HTMLElement {
        const container = document.createElement('div')
        container.className = 'bread-translation-container'

        if (shouldWrap) {
                container.style.display = 'inline'
        }

        const translationElement = document.createElement('span')
        translationElement.className = 'bread-translation'
        translationElement.textContent = translatedText

        container.appendChild(translationElement)
        return container
}

// 项目中使用的常量
const URL_GOOGLE_TRAN = 'https://translate.googleapis.com/translate_a/single'

// 生成谷歌翻译请求
const genGoogle = ({
        text,
        from,
        to,
        url = URL_GOOGLE_TRAN,
}: {
        text: string
        from: string
        to: string
        url?: string
}) => {
        const params = {
                client: 'gtx',
                dt: 't',
                dj: '1',
                ie: 'UTF-8',
                sl: from,
                tl: to,
                q: text,
        }
        const input = `${url}?${new URLSearchParams(params).toString()}`
        const init = {
                // GET请求不需要Content-Type头
        }

        return { input, init }
}

// 发送HTTP请求
const fetchTranslation = async (url: string, init: RequestInit) => {
        const response = await fetch(url, init)
        if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
        }
        try {
                const data = await response.json()
                return data
        } catch (error) {
                console.error('Failed to parse JSON from response:', error)
                throw new Error(
                        'Failed to fetch translation, invalid JSON response.'
                )
        }
}

// 谷歌翻译函数
export const translateContentGoogle = async (
        text: string,
        from: string = 'en',
        to: string
) => {
        const { input, init } = genGoogle({ text, from, to })
        const data = await fetchTranslation(input, init)
        // 解析翻译结果
        const translatedText = data.sentences?.[0]?.trans || ''
        return translatedText
}

// 微软翻译相关接口和常量
interface MicrosoftAuthToken {
        value: string
        expirationTimestamp: number
}

interface TranslationRequest {
        content: string
        sourceLang?: string
        targetLang?: string
}

const MICROSOFT_AUTH_ENDPOINT = 'https://edge.microsoft.com/translate/auth'
const MICROSOFT_TRANSLATE_API_URL =
        'https://api-edge.cognitive.microsofttranslator.com/translate'

/**
 * 解码JWT令牌并提取过期时间戳
 */
const decodeAuthTokenExpiration = (token: string): number => {
        try {
                return JSON.parse(atob(token.split('.')[1])).exp
        } catch (error) {
                console.error('Token decoding failed:', error)
                return Date.now()
        }
}

/**
 * 获取微软认证令牌
 */
const acquireAuthToken = async (): Promise<MicrosoftAuthToken> => {
        const response = await fetch(MICROSOFT_AUTH_ENDPOINT)
        if (!response.ok) {
                throw new Error(`Authentication failed: ${response.statusText}`)
        }
        const tokenValue = await response.text()
        return {
                value: tokenValue,
                expirationTimestamp: decodeAuthTokenExpiration(tokenValue),
        }
}

let cachedAuthToken: string | null = null

/**
 * 刷新身份验证令牌并返回新令牌及过期时间
 */
const refreshAuthToken = async (): Promise<[string, number]> => {
        if (cachedAuthToken) {
                const expiration = decodeAuthTokenExpiration(cachedAuthToken)
                if (expiration * 1000 > Date.now() + 1000) {
                        return [cachedAuthToken, expiration]
                }
        }
        const { value, expirationTimestamp } = await acquireAuthToken()
        cachedAuthToken = value
        return [value, expirationTimestamp]
}

/**
 * 构建微软翻译API请求配置和URL
 */
const buildTranslationRequest = async (
        request: TranslationRequest
): Promise<[string, RequestInit]> => {
        const [authToken] = await refreshAuthToken()
        const queryParameters = new URLSearchParams({
                from: request.sourceLang || 'auto',
                to: request.targetLang || 'zh-CN',
                'api-version': '3.0',
        })
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
        ]
}

/**
 * 执行翻译请求的异步函数
 */
const executeTranslation = async (
        endpoint: string,
        config: RequestInit
): Promise<string> => {
        const response = await fetch(endpoint, config)
        if (!response.ok) {
                throw new Error(`Translation failed: ${response.status}`)
        }
        const result = await response.json()
        return result[0].translations[0].text
}

/**
 * 微软翻译函数
 */
export const translateContentMicrosoft = async (
        text: string,
        sourceLang = 'en',
        targetLang = 'zh-CN'
): Promise<string> => {
        try {
                const [apiEndpoint, requestConfig] =
                        await buildTranslationRequest({
                                content: text,
                                sourceLang,
                                targetLang,
                        })
                return await executeTranslation(apiEndpoint, requestConfig)
        } catch (error) {
                console.error('Translation workflow error:', error)
                return text
        }
}
