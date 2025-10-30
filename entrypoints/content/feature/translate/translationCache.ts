import { translateContentGoogle as translateG } from '../../utils/text/translation'
import { translateContentMicrosoft as translateMS } from '../../utils/text/translation'
import { translator } from '../../featureManager/translateManager'

// 优化缓存机制：限制缓存大小，防止内存泄漏
const translationCache = new Map<string, string>()
const MAX_CACHE_SIZE = 1000
const cacheKeys: string[] = []

// 批量翻译队列
interface BatchTranslationItem {
        originalText: string
        targetLang: string
        resolve: (value: string) => void
        reject: (reason?: unknown) => void
}

// 批量处理结果类型
type BatchResult =
        | { item: BatchTranslationItem; result: string }
        | { item: BatchTranslationItem; error: unknown }

/**
 * 清理缓存函数
 */
function cleanupCache(): void {
        while (cacheKeys.length > MAX_CACHE_SIZE) {
                const oldestKey = cacheKeys.shift()
                if (oldestKey) {
                        translationCache.delete(oldestKey)
                }
        }
}

/**
 * 批量翻译器类
 */
class BatchTranslator {
        private queue: BatchTranslationItem[] = []
        private processing = false
        private readonly BATCH_DELAY = 50 // 50ms 批处理延迟
        private readonly MAX_BATCH_SIZE = 10 // 最大批处理数量

        async addToBatch(
                originalText: string,
                targetLang: string
        ): Promise<string> {
                return new Promise((resolve, reject) => {
                        this.queue.push({
                                originalText,
                                targetLang,
                                resolve,
                                reject,
                        })
                        this.processBatch()
                })
        }

        private async processBatch(): Promise<void> {
                if (this.processing || this.queue.length === 0) return

                this.processing = true

                // 延迟处理，收集更多请求
                await new Promise((resolve) =>
                        window.setTimeout(resolve, this.BATCH_DELAY)
                )

                const batch = this.queue.splice(0, this.MAX_BATCH_SIZE)
                this.processing = false

                if (batch.length === 1) {
                        // 单个请求直接处理
                        this.processSingle(batch[0])
                } else {
                        // 批量处理
                        await this.processBatchRequest(batch)
                }

                // 处理剩余请求
                if (this.queue.length > 0) {
                        this.processBatch()
                }
        }

        private async processSingle(item: BatchTranslationItem): Promise<void> {
                try {
                        const result = await this.performSingleTranslation(
                                item.originalText,
                                item.targetLang
                        )
                        item.resolve(result)
                } catch (error) {
                        item.reject(error)
                }
        }

        private async processBatchRequest(
                batch: BatchTranslationItem[]
        ): Promise<void> {
                // 注意：当前翻译API不支持真正的批量请求，这里使用并行处理模拟批量效果
                const promises: Promise<BatchResult>[] = batch.map((item) =>
                        this.performSingleTranslation(
                                item.originalText,
                                item.targetLang
                        )
                                .then(
                                        (result) =>
                                                ({
                                                        item,
                                                        result,
                                                }) as BatchResult
                                )
                                .catch(
                                        (error) =>
                                                ({ item, error }) as BatchResult
                                )
                )

                const results = await Promise.allSettled(promises)

                results.forEach((result) => {
                        if (result.status === 'fulfilled') {
                                const value = result.value
                                if ('result' in value) {
                                        value.item.resolve(value.result)
                                } else {
                                        value.item.reject(value.error)
                                }
                        } else {
                                // 处理 Promise 被拒绝的情况（理论上不会发生，因为使用了 allSettled）
                                console.warn(
                                        'Unexpected promise rejection in batch translation'
                                )
                        }
                })
        }

        private async performSingleTranslation(
                originalText: string,
                targetLang: string
        ): Promise<string> {
                const cacheKey = `${originalText}:${targetLang}:${translator}`

                // 检查缓存
                if (translationCache.has(cacheKey)) {
                        return translationCache.get(cacheKey)!
                }

                // 文本长度限制
                if (originalText.length > 50000 || originalText.length < 3) {
                        return originalText
                }

                let result: string = ''
                try {
                        if (translator === 'MS') {
                                result = await translateMS(
                                        originalText,
                                        undefined,
                                        targetLang
                                )
                        } else if (translator === 'G') {
                                result = await translateG(
                                        originalText,
                                        undefined,
                                        targetLang
                                )
                        }

                        // 确保结果有效
                        if (!result || result.trim().length === 0) {
                                result = originalText
                        }
                } catch (error) {
                        // 翻译失败时返回原文
                        result = originalText
                        if (import.meta.env.DEV) {
                                console.warn(
                                        'Translation failed, using original text:',
                                        error
                                )
                        }
                }

                // 更新缓存并清理
                translationCache.set(cacheKey, result)
                cacheKeys.push(cacheKey)
                cleanupCache()

                return result
        }
}

const batchTranslator = new BatchTranslator()

/**
 * 执行翻译操作
 */
export async function performTranslation(
        translator: string,
        originalText: string,
        targetLang: string
): Promise<string> {
        return batchTranslator.addToBatch(originalText, targetLang)
}
