import { translateContentGoogle as translateG } from '../../utils/text/translation'
import { translateContentMicrosoft as translateMS } from '../../utils/text/translation'
import { translator } from '../../featureManager/translateManager'

// 多级缓存系统
class TranslationCacheManager {
        private memoryCache = new Map<
                string,
                { result: string; timestamp: number }
        >()
        private readonly MEMORY_CACHE_TTL = 5 * 60 * 1000 // 5分钟
        private readonly MAX_MEMORY_CACHE_SIZE = 2000

        // 本地存储缓存键
        private readonly STORAGE_KEY = 'bread_translation_cache'
        private readonly STORAGE_CACHE_TTL = 24 * 60 * 60 * 1000 // 24小时

        constructor() {
                this.cleanupExpiredCache()
        }

        /**
         * 获取缓存结果
         */
        async get(key: string): Promise<string | null> {
                // 1. 检查内存缓存
                const memoryResult = this.memoryCache.get(key)
                if (
                        memoryResult &&
                        Date.now() - memoryResult.timestamp <
                                this.MEMORY_CACHE_TTL
                ) {
                        return memoryResult.result
                }

                // 2. 检查本地存储
                try {
                        const storageCache = await this.getStorageCache()
                        const storageResult = storageCache[key]
                        if (
                                storageResult &&
                                Date.now() - storageResult.timestamp <
                                        this.STORAGE_CACHE_TTL
                        ) {
                                // 将存储缓存提升到内存缓存
                                this.setMemoryCache(key, storageResult.result)
                                return storageResult.result
                        }
                } catch (error) {
                        console.warn('Failed to read storage cache:', error)
                }

                return null
        }

        /**
         * 设置缓存
         */
        async set(key: string, result: string): Promise<void> {
                // 设置内存缓存
                this.setMemoryCache(key, result)

                // 异步设置存储缓存
                try {
                        await this.setStorageCache(key, result)
                } catch (error) {
                        console.warn('Failed to write storage cache:', error)
                }
        }

        /**
         * 设置内存缓存
         */
        private setMemoryCache(key: string, result: string): void {
                this.memoryCache.set(key, { result, timestamp: Date.now() })

                // 清理过大的内存缓存
                if (this.memoryCache.size > this.MAX_MEMORY_CACHE_SIZE) {
                        const oldestKey = this.memoryCache.keys().next().value
                        if (oldestKey) {
                                this.memoryCache.delete(oldestKey)
                        }
                }
        }

        /**
         * 获取存储缓存
         */
        private async getStorageCache(): Promise<
                Record<string, { result: string; timestamp: number }>
        > {
                const cached = await storage.getItem<string>(
                        `local:${this.STORAGE_KEY}`
                )
                return cached ? JSON.parse(cached) : {}
        }

        /**
         * 设置存储缓存
         */
        private async setStorageCache(
                key: string,
                result: string
        ): Promise<void> {
                const storageCache = await this.getStorageCache()
                storageCache[key] = { result, timestamp: Date.now() }

                // 清理过期的存储缓存
                const now = Date.now()
                Object.keys(storageCache).forEach((cacheKey) => {
                        if (
                                now - storageCache[cacheKey].timestamp >
                                this.STORAGE_CACHE_TTL
                        ) {
                                delete storageCache[cacheKey]
                        }
                })

                await storage.setItem(
                        `local:${this.STORAGE_KEY}`,
                        JSON.stringify(storageCache)
                )
        }

        /**
         * 清理过期缓存
         */
        private cleanupExpiredCache(): void {
                const now = Date.now()

                // 清理内存缓存
                for (const [key, value] of this.memoryCache.entries()) {
                        if (now - value.timestamp > this.MEMORY_CACHE_TTL) {
                                this.memoryCache.delete(key)
                        }
                }

                // 异步清理存储缓存
                this.cleanupStorageCache()
        }

        /**
         * 异步清理存储缓存
         */
        private async cleanupStorageCache(): Promise<void> {
                try {
                        const storageCache = await this.getStorageCache()
                        const now = Date.now()
                        let hasChanges = false

                        Object.keys(storageCache).forEach((key) => {
                                if (
                                        now - storageCache[key].timestamp >
                                        this.STORAGE_CACHE_TTL
                                ) {
                                        delete storageCache[key]
                                        hasChanges = true
                                }
                        })

                        if (hasChanges) {
                                await storage.setItem(
                                        `local:${this.STORAGE_KEY}`,
                                        JSON.stringify(storageCache)
                                )
                        }
                } catch (error) {
                        console.warn('Failed to cleanup storage cache:', error)
                }
        }

        /**
         * 清空所有缓存
         */
        async clear(): Promise<void> {
                this.memoryCache.clear()
                try {
                        await storage.removeItem(`local:${this.STORAGE_KEY}`)
                } catch (error) {
                        console.warn('Failed to clear storage cache:', error)
                }
        }
}

const cacheManager = new TranslationCacheManager()

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
                // 使用并行处理模拟批量效果
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
                const cachedResult = await cacheManager.get(cacheKey)
                if (cachedResult !== null) {
                        return cachedResult
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

                // 更新缓存
                await cacheManager.set(cacheKey, result)

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
