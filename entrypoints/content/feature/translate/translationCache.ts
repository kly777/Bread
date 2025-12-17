import { translateContentGoogle as translateG } from '../../utils/text/translation'
import { translateContentMicrosoft as translateMS } from '../../utils/text/translation'

class SimpleTranslationCache {
        private cache = new Map<string, string>()
        private readonly MAX_CACHE_SIZE = 1000

        get(key: string): string | null {
                return this.cache.get(key) || null
        }

        set(key: string, result: string): void {
                this.cache.set(key, result)

                // 简单的缓存清理
                if (this.cache.size > this.MAX_CACHE_SIZE) {
                        const firstKey = this.cache.keys().next().value
                        if (firstKey) {
                                this.cache.delete(firstKey)
                        }
                }
        }

        clear(): void {
                this.cache.clear()
        }
}

const cache = new SimpleTranslationCache()

class SimpleBatchTranslator {
        private queue: {
                originalText: string
                targetLang: string
                translator: string
                resolve: (value: string) => void
                reject: (reason?: unknown) => void
        }[] = []
        private processing = false
        private readonly BATCH_DELAY = 10 // 固定延迟10ms
        private readonly BATCH_SIZE = 5 // 固定批量大小

        async addToBatch(
                originalText: string,
                targetLang: string,
                translator: string
        ): Promise<string> {
                return new Promise((resolve, reject) => {
                        this.queue.push({
                                originalText,
                                targetLang,
                                translator,
                                resolve,
                                reject,
                        })
                        this.processBatch()
                })
        }

        private async processBatch(): Promise<void> {
                if (this.processing || this.queue.length === 0) return

                this.processing = true

                // 使用固定延迟
                await new Promise((resolve) =>
                        window.setTimeout(resolve, this.BATCH_DELAY)
                )

                // 处理固定大小的批次
                const batch = this.queue.splice(0, this.BATCH_SIZE)
                this.processing = false

                // 并行处理批次
                const promises = batch.map((item) =>
                        this.performSingleTranslation(
                                item.originalText,
                                item.targetLang,
                                item.translator
                        )
                                .then((result) => ({ item, result }))
                                .catch((error) => ({ item, error }))
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
                        }
                })

                // 处理剩余请求
                if (this.queue.length > 0) {
                        this.processBatch()
                }
        }

        private async performSingleTranslation(
                originalText: string,
                targetLang: string,
                translator: string
        ): Promise<string> {
                const cacheKey = `${originalText}:${targetLang}:${translator}`

                // 检查缓存
                const cachedResult = cache.get(cacheKey)
                if (cachedResult !== null) {
                        return cachedResult
                }

                // 文本长度限制
                if (originalText.length > 50000 || originalText.length < 3) {
                        return originalText
                }

                let result = ''
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
                        console.warn(
                                'Translation failed, using original text:',
                                error
                        )
                }

                // 更新缓存
                cache.set(cacheKey, result)

                return result
        }
}

const batchTranslator = new SimpleBatchTranslator()

/**
 * 翻译操作
 */
export async function performTranslation(
        translator: string,
        originalText: string,
        targetLang: string
): Promise<string> {
        return batchTranslator.addToBatch(originalText, targetLang, translator)
}
