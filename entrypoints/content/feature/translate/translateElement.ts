import { translator } from '../../featureManager/translateManager'
import {
        extractTextFragments,
        shouldSkipTranslation,
        shouldSkipElementTranslation,
} from './textExtractor'
import { performTranslation } from './translationCache'
import {
        updateOrCreateTranslationContainer,
        getElementStyleInfo,
} from './domRenderer'

/**
 * 翻译指定HTML元素的内容并更新其显示
 * @param element 需要翻译的HTML元素对象
 * @param targetLang 目标语言代码（默认值: "zh-CN"）
 * @returns 返回Promise<void>，表示异步翻译操作完成
 */
export const translateElement = async (
        element: HTMLElement,
        targetLang = 'zh-CN'
): Promise<void> => {
        // 提前检查是否应该跳过翻译
        if (shouldSkipElementTranslation(element)) {
                return
        }

        // 提取元素文本内容进行翻译处理
        const originalText = await extractTextFragments(element)
        if (shouldSkipTranslation(originalText)) {
                return
        }

        try {
                // 执行文本翻译操作
                const translatedText = await performTranslation(
                        translator,
                        originalText,
                        targetLang
                )

                // 如果翻译结果与原文本相同则跳过更新
                if (translatedText === originalText) {
                        return
                }

                // 获取元素样式信息
                const styleInfo = getElementStyleInfo(element)

                // 更新或创建翻译内容容器
                updateOrCreateTranslationContainer(
                        element,
                        translatedText,
                        styleInfo.shouldWrap
                )
        } catch (error) {
                console.error('Element translation failed:', {
                        error,
                        element,
                        timestamp: new Date().toISOString(),
                })
        }
}
