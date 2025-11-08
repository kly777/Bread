/**
 * 高亮相关工具函数
 *
 * 提供文本高亮相关的功能
 */

/**
 * 高亮词配置接口
 */
export interface HighlightWord {
        text: string // 要匹配的文本内容
        enabled: boolean // 是否启用此高亮词
        colorIndex: number // 颜色索引，对应颜色方案中的颜色
        caseSensitive: boolean // 是否区分大小写
        regex: boolean // 是否使用正则表达式匹配
}

/**
 * 创建高亮词对象
 *
 * @param text - 要匹配的文本
 * @param enabled - 是否启用，默认为 true
 * @returns 完整的高亮词配置对象
 */
export function createHighlightWord(
        text: string,
        enabled: boolean = true
): HighlightWord {
        return {
                text,
                enabled,
                colorIndex: 0, // 默认使用第一个颜色
                caseSensitive: false, // 默认不区分大小写
                regex: false, // 默认不使用正则表达式
        }
}

/**
 * 检查文本节点是否包含高亮关键词
 *
 * @param node - 文本节点
 * @param highlightWords - 高亮词列表
 * @returns 如果包含高亮关键词返回 true，否则返回 false
 */
export function shouldHighlightNode(
        node: Text,
        highlightWords: HighlightWord[]
): boolean {
        const text = node.textContent || ''
        return shouldHighlightText(text, highlightWords)
}

/**
 * 获取文本节点中高亮关键词的匹配信息
 *
 * @param node - 文本节点
 * @param highlightWords - 高亮词列表
 * @returns 匹配信息数组
 */
export function getHighlightMatches(
        node: Text,
        highlightWords: HighlightWord[]
): Array<{ word: HighlightWord; matches: RegExpMatchArray[] }> {
        const text = node.textContent || ''
        const matches: Array<{
                word: HighlightWord
                matches: RegExpMatchArray[]
        }> = []

        for (const word of highlightWords) {
                if (!word.enabled) continue

                let wordMatches: RegExpMatchArray[] = []
                if (word.regex) {
                        try {
                                const regex = new RegExp(
                                        word.text,
                                        word.caseSensitive ? 'g' : 'gi'
                                )
                                wordMatches = Array.from(text.matchAll(regex))
                        } catch (error) {
                                console.warn(
                                        '无效的正则表达式:',
                                        word.text,
                                        error
                                )
                        }
                } else {
                        const regex = new RegExp(
                                word.text.replace(
                                        /[.*+?^${}()|[\]\\]/g,
                                        '\\$&'
                                ),
                                word.caseSensitive ? 'g' : 'gi'
                        )
                        wordMatches = Array.from(text.matchAll(regex))
                }

                if (wordMatches.length > 0) {
                        matches.push({ word, matches: wordMatches })
                }
        }

        return matches
}

/**
 * 检查文本是否应该被高亮
 *
 * @param text - 要检查的文本
 * @param highlightWords - 高亮词列表
 * @returns 如果文本应该被高亮返回 true，否则返回 false
 */
export function shouldHighlightText(
        text: string,
        highlightWords: HighlightWord[]
): boolean {
        for (const word of highlightWords) {
                if (!word.enabled) continue

                let match = false
                if (word.regex) {
                        try {
                                const regex = new RegExp(
                                        word.text,
                                        word.caseSensitive ? '' : 'i'
                                )
                                match = regex.test(text)
                        } catch (error) {
                                console.warn(
                                        '无效的正则表达式:',
                                        word.text,
                                        error
                                )
                        }
                } else {
                        if (word.caseSensitive) {
                                match = text.includes(word.text)
                        } else {
                                match = text
                                        .toLowerCase()
                                        .includes(word.text.toLowerCase())
                        }
                }

                if (match) return true
        }

        return false
}
