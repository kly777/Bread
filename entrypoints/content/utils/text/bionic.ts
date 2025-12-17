/**
 * Bionic Reading 相关工具函数
 *
 * 提供 Bionic Reading 文本分析和计算功能
 */

/**
 * 分析文本节点是否适合应用 Bionic 效果
 *
 * @param node - 文本节点
 * @returns 如果适合应用 Bionic 效果返回 true，否则返回 false
 */
export function shouldApplyBionic(node: Text): boolean {
        const text = node.textContent || ''
        return text.trim().length > 0
}

/**
 * 获取文本节点的 Bionic 分析结果
 *
 * @param node - 文本节点
 * @returns Bionic 分析结果
 */
export function analyzeBionicText(node: Text): {
        text: string
        words: {
                word: string
                isChinese: boolean
                boldLength: number
                boldPart: string
                normalPart: string
        }[]
} {
        const text = node.textContent || ''
        const words = text.split(/(\s+)/)

        const analyzedWords = words.map((word) => {
                if (word.trim() === '') {
                        return {
                                word,
                                isChinese: false,
                                boldLength: 0,
                                boldPart: '',
                                normalPart: word,
                        }
                }

                const isChinese = isChineseWord(word)
                const boldLength = isChinese
                        ? Math.ceil(word.length * 0.5)
                        : Math.ceil(word.length * 0.6)

                return {
                        word,
                        isChinese,
                        boldLength,
                        boldPart: word.slice(0, boldLength),
                        normalPart: word.slice(boldLength),
                }
        })

        return {
                text,
                words: analyzedWords,
        }
}

// /**
//  * 处理英文单词的 Bionic 效果
//  *
//  * @param word - 英文单词
//  * @returns 包含 Bionic 效果的文档片段
//  */
// function bionicEn(word: string): DocumentFragment {
//         return createBionicWordFragment(word, Math.ceil(word.length * 0.6))
// }

// /**
//  * 处理中文词语的 Bionic 效果
//  *
//  * @param word - 中文词语
//  * @returns 包含 Bionic 效果的文档片段
//  */
// function bionicCn(word: string): DocumentFragment {
//         return createBionicWordFragment(word, Math.ceil(word.length * 0.5))
// }

/**
 * 检查是否为中文字符
 *
 * @param char - 要检查的字符
 * @returns 如果是中文字符返回 true，否则返回 false
 */
function isChineseChar(char: string): boolean {
        const code = char.charCodeAt(0)
        return (
                (code >= 0x4e00 && code <= 0x9fff) ||
                (code >= 0x3400 && code <= 0x4dbf) ||
                (code >= 0x20000 && code <= 0x2a6df) ||
                (code >= 0x2a700 && code <= 0x2b73f) ||
                (code >= 0x2b740 && code <= 0x2b81f) ||
                (code >= 0x2b820 && code <= 0x2ceaf) ||
                (code >= 0x2ceb0 && code <= 0x2ebe0) ||
                (code >= 0x2ebf0 && code <= 0x2ee5d) ||
                (code >= 0x30000 && code <= 0x3134a) ||
                (code >= 0xf900 && code <= 0xfaff) ||
                (code >= 0x2f800 && code <= 0x2fa1f)
        )
}

/**
 * 检查是否为中文词语
 *
 * @param word - 要检查的词语
 * @returns 如果是中文词语返回 true，否则返回 false
 */
function isChineseWord(word: string): boolean {
        return Array.from(word).every(isChineseChar)
}

// /**
//  * 创建 Bionic 单词片段
//  *
//  * @param word - 单词
//  * @param boldLength - 加粗部分的长度
//  * @returns 包含 Bionic 效果的文档片段
//  */
// function createBionicWordFragment(
//         word: string,
//         boldLength: number
// ): DocumentFragment {
//         const fragment = document.createDocumentFragment()
//         const span = document.createElement('span')
//         span.className = 'bionic-text'

//         if (boldLength >= word.length) {
//                 // 整个单词加粗
//                 span.appendChild(createStrongElement(word))
//         } else {
//                 // 部分加粗
//                 const boldPart = word.slice(0, boldLength)
//                 const normalPart = word.slice(boldLength)

//                 span.appendChild(createStrongElement(boldPart))
//                 span.appendChild(document.createTextNode(normalPart))
//         }

//         fragment.appendChild(span)
//         return fragment
// }

// /**
//  * 创建加粗元素
//  *
//  * @param text - 要加粗的文本
//  * @returns 加粗的 HTML 元素
//  */
// function createStrongElement(text: string): HTMLElement {
//         const strong = document.createElement('strong')
//         strong.textContent = text
//         return strong
// }
