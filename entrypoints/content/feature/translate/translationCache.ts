import { translateContentGoogle as translateG } from '../../utils/text/translation'
import { translateContentMicrosoft as translateMS } from '../../utils/text/translation'
import { getTranslator } from '../../featureManager/translateManager'

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

// 请求优先级枚举
enum RequestPriority {
        LOW = 1,    // 后台任务，低优先级
        NORMAL = 2, // 普通翻译请求
        HIGH = 3,   // 用户主动触发的翻译
        URGENT = 4  // 即时翻译需求
}

// 扩展批量翻译项接口以支持优先级
interface BatchTranslationItem {
        originalText: string
        targetLang: string
        resolve: (value: string) => void
        reject: (reason?: unknown) => void
        priority: RequestPriority
        timestamp: number
}

// 网络状况监控接口
interface NetworkMetrics {
        averageResponseTime: number
        successRate: number
        lastUpdate: number
}

// 批量处理结果类型
type BatchResult =
        | { item: BatchTranslationItem; result: string }
        | { item: BatchTranslationItem; error: unknown }

/**
 * 智能批量翻译器类
 * 支持自适应延迟、动态批量大小和请求优先级
 */
class BatchTranslator {
        private queue: BatchTranslationItem[] = []
        private processing = false
        
        // 自适应配置
        private baseBatchDelay = 50 // 基础延迟50ms
        private minBatchDelay = 10  // 最小延迟10ms
        private maxBatchDelay = 200 // 最大延迟200ms
        
        private baseBatchSize = 10  // 基础批量大小
        private minBatchSize = 1    // 最小批量大小
        private maxBatchSize = 20   // 最大批量大小
        
        // 网络状况监控
        private networkMetrics: NetworkMetrics = {
                averageResponseTime: 0,
                successRate: 1.0,
                lastUpdate: Date.now()
        }
        
        // 响应时间记录
        private responseTimes: number[] = []
        private readonly MAX_RESPONSE_TIME_SAMPLES = 20

        async addToBatch(
                originalText: string,
                targetLang: string,
                priority: RequestPriority = RequestPriority.NORMAL
        ): Promise<string> {
                return new Promise((resolve, reject) => {
                        const item: BatchTranslationItem = {
                                originalText,
                                targetLang,
                                resolve,
                                reject,
                                priority,
                                timestamp: Date.now()
                        }
                        
                        this.insertItemByPriority(item)
                        this.processBatch()
                })
        }

        /**
         * 按优先级插入队列
         */
        private insertItemByPriority(item: BatchTranslationItem): void {
                let insertIndex = this.queue.length
                
                // 从后往前找到第一个优先级小于等于当前项的索引
                for (let i = this.queue.length - 1; i >= 0; i--) {
                        if (this.queue[i].priority >= item.priority) {
                                insertIndex = i + 1
                                break
                        }
                }
                
                this.queue.splice(insertIndex, 0, item)
        }

        /**
         * 计算自适应批处理延迟
         */
        private calculateAdaptiveDelay(): number {
                const queueLength = this.queue.length
                const urgency = this.calculateQueueUrgency()
                
                // 基础延迟根据队列长度调整
                let delay = this.baseBatchDelay
                
                // 队列越长，延迟越短（尽快处理）
                if (queueLength > 15) {
                        delay = Math.max(this.minBatchDelay, delay - 30)
                } else if (queueLength > 5) {
                        delay = Math.max(this.minBatchDelay, delay - 15)
                }
                
                // 根据网络状况调整
                if (this.networkMetrics.averageResponseTime > 1000) {
                        // 网络状况差，增加延迟以减少并发
                        delay = Math.min(this.maxBatchDelay, delay + 50)
                } else if (this.networkMetrics.averageResponseTime < 200) {
                        // 网络状况好，减少延迟
                        delay = Math.max(this.minBatchDelay, delay - 10)
                }
                
                // 根据紧急程度调整
                delay = Math.max(this.minBatchDelay, delay - (urgency * 10))
                
                return delay
        }

        /**
         * 计算队列紧急程度（基于高优先级请求数量）
         */
        private calculateQueueUrgency(): number {
                const highPriorityCount = this.queue.filter(
                        item => item.priority >= RequestPriority.HIGH
                ).length
                
                return Math.min(highPriorityCount / 5, 3) // 最大紧急程度为3
        }

        /**
         * 计算动态批量大小
         */
        private calculateDynamicBatchSize(): number {
                let batchSize = this.baseBatchSize
                
                // 根据网络状况调整
                if (this.networkMetrics.averageResponseTime > 1000) {
                        // 网络慢，减少批量大小
                        batchSize = Math.max(this.minBatchSize, Math.floor(batchSize * 0.5))
                } else if (this.networkMetrics.averageResponseTime < 200) {
                        // 网络快，增加批量大小
                        batchSize = Math.min(this.maxBatchSize, Math.floor(batchSize * 1.5))
                }
                
                // 根据队列中高优先级请求数量调整
                const highPriorityCount = this.queue.filter(
                        item => item.priority >= RequestPriority.HIGH
                ).length
                
                if (highPriorityCount > 0) {
                        // 有高优先级请求时，减少批量大小以更快响应
                        batchSize = Math.max(this.minBatchSize, Math.min(batchSize, 5))
                }
                
                return batchSize
        }

        private async processBatch(): Promise<void> {
                if (this.processing || this.queue.length === 0) return

                this.processing = true

                // 使用自适应延迟
                const adaptiveDelay = this.calculateAdaptiveDelay()
                await new Promise((resolve) =>
                        window.setTimeout(resolve, adaptiveDelay)
                )

                // 使用动态批量大小
                const dynamicBatchSize = this.calculateDynamicBatchSize()
                const batch = this.queue.splice(0, dynamicBatchSize)
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
                const startTime = Date.now()
                try {
                        const result = await this.performSingleTranslation(
                                item.originalText,
                                item.targetLang
                        )
                        this.recordResponseTime(Date.now() - startTime, true)
                        item.resolve(result)
                } catch (error) {
                        this.recordResponseTime(Date.now() - startTime, false)
                        item.reject(error)
                }
        }

        private async processBatchRequest(
                batch: BatchTranslationItem[]
        ): Promise<void> {
                const startTime = Date.now()
                
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
                                                } as BatchResult)
                                )
                                .catch(
                                        (error) =>
                                                ({ item, error } as BatchResult)
                                )
                )

                const results = await Promise.allSettled(promises)
                
                // 记录响应时间和成功率
                const totalTime = Date.now() - startTime
                const successCount = results.filter(r =>
                        r.status === 'fulfilled' && 'result' in r.value
                ).length
                
                this.recordResponseTime(totalTime / batch.length, successCount / batch.length)

                results.forEach((result) => {
                        if (result.status === 'fulfilled') {
                                const value = result.value
                                if ('result' in value) {
                                        value.item.resolve(value.result)
                                } else {
                                        value.item.reject(value.error)
                                }
                        } else {
                                console.warn(
                                        'Unexpected promise rejection in batch translation'
                                )
                        }
                })
        }

        /**
         * 记录响应时间并更新网络指标
         */
        private recordResponseTime(responseTime: number, success: boolean | number = true): void {
                // 记录响应时间
                this.responseTimes.push(responseTime)
                if (this.responseTimes.length > this.MAX_RESPONSE_TIME_SAMPLES) {
                        this.responseTimes.shift()
                }
                
                // 计算平均响应时间
                const avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
                
                // 更新成功率
                let successRate: number
                if (typeof success === 'boolean') {
                        successRate = success ? 1.0 : 0.0
                } else {
                        successRate = success
                }
                
                // 平滑更新网络指标
                this.networkMetrics = {
                        averageResponseTime: avgResponseTime,
                        successRate: this.networkMetrics.successRate * 0.7 + successRate * 0.3,
                        lastUpdate: Date.now()
                }
        }

        private async performSingleTranslation(
                originalText: string,
                targetLang: string
        ): Promise<string> {
                const currentTranslator = getTranslator()
                const cacheKey = `${originalText}:${targetLang}:${currentTranslator}`

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
                        if (currentTranslator === 'MS') {
                                result = await translateMS(
                                        originalText,
                                        undefined,
                                        targetLang
                                )
                        } else if (currentTranslator === 'G') {
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
        targetLang: string,
        priority: RequestPriority = RequestPriority.NORMAL
): Promise<string> {
        return batchTranslator.addToBatch(originalText, targetLang, priority)
}

/**
 * 导出优先级枚举，供外部使用
 */
export { RequestPriority }
