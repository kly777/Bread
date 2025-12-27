import { translateContentGoogle as translateG } from '../../utils/text/translation'
import { translateContentMicrosoft as translateMS } from '../../utils/text/translation'

interface CacheEntry {
        translation: string
        frequency: number
        lastAccess: number
}

type CacheData = Record<string, CacheEntry>

class TranslationCacheManager {
        private readonly CACHE_KEY_PREFIX = 'feature:translate:cache'
        private readonly MAX_CACHE_SIZE = 1000
        private readonly CLEANUP_THRESHOLD = 1200 // 当缓存超过此值时触发清理
        private memoryCaches = new Map<string, Map<string, CacheEntry>>()
        private initialized = false
        private saveTimer: number | null = null
        private readonly SAVE_DELAY = 1000 // 延迟保存时间（毫秒）
        private pendingSaveDomains = new Set<string>() // 需要保存的域名集合

        /**
         * 初始化缓存管理器，从存储中加载缓存数据
         */
        async initialize(): Promise<void> {
                if (this.initialized) return

                try {
                        const domain = this.getCurrentDomain()
                        const cacheKey = `${this.CACHE_KEY_PREFIX}:${domain}`

                        const result = await browser.storage.local.get(cacheKey)
                        const cacheData = result[cacheKey] as
                                | CacheData
                                | undefined

                        if (cacheData) {
                                const domainCache = new Map<
                                        string,
                                        CacheEntry
                                >()

                                // 将存储的数据加载到内存缓存中
                                Object.entries(cacheData).forEach(
                                        ([cacheKey, entry]) => {
                                                domainCache.set(cacheKey, entry)
                                        }
                                )

                                this.memoryCaches.set(domain, domainCache)
                                console.log(
                                        `域名 ${domain} 的翻译缓存加载成功，共 ${domainCache.size} 条记录`
                                )
                        } else {
                                // 如果当前域名没有缓存，创建一个空的缓存
                                this.memoryCaches.set(
                                        domain,
                                        new Map<string, CacheEntry>()
                                )
                                console.log(
                                        `域名 ${domain} 的翻译缓存初始化完成（无历史缓存）`
                                )
                        }
                } catch (error) {
                        console.warn('加载翻译缓存失败:', error)
                }

                this.initialized = true
        }

        /**
         * 获取缓存的翻译结果
         */
        get(
                originalText: string,
                targetLang: string,
                translator: string
        ): string | null {
                const domain = this.getCurrentDomain()
                const domainCache = this.memoryCaches.get(domain)
                if (!domainCache) return null

                const cacheKey = this.generateCacheKey(
                        originalText,
                        targetLang,
                        translator
                )
                const entry = domainCache.get(cacheKey)

                if (entry) {
                        // 更新访问信息
                        entry.frequency++
                        entry.lastAccess = Date.now()
                        domainCache.set(cacheKey, entry)

                        // 异步保存更新后的缓存
                        this.scheduleSave(domain)

                        return entry.translation
                }

                return null
        }

        /**
         * 设置缓存条目
         */
        async set(
                originalText: string,
                targetLang: string,
                translator: string,
                translation: string
        ): Promise<void> {
                await this.initialize()

                const domain = this.getCurrentDomain()
                let domainCache = this.memoryCaches.get(domain)

                if (!domainCache) {
                        domainCache = new Map<string, CacheEntry>()
                        this.memoryCaches.set(domain, domainCache)
                }

                const cacheKey = this.generateCacheKey(
                        originalText,
                        targetLang,
                        translator
                )

                // 创建新的缓存条目
                const newEntry: CacheEntry = {
                        translation,
                        frequency: 1,
                        lastAccess: Date.now(),
                }

                domainCache.set(cacheKey, newEntry)

                // 检查是否需要清理缓存
                if (domainCache.size > this.CLEANUP_THRESHOLD) {
                        await this.cleanupDomainCache(domain)
                } else {
                        // 异步保存到存储
                        this.scheduleSave(domain)
                }
        }

        /**
         * 生成缓存键
         */
        private generateCacheKey(
                originalText: string,
                targetLang: string,
                translator: string
        ): string {
                // 对原文进行简单规范化处理（去除首尾空格，转换为小写）
                const normalizedText = originalText.trim().toLowerCase()
                return `${normalizedText}:${targetLang}:${translator}`
        }

        /**
         * 清理指定域名的缓存，移除最不常用的条目
         */
        private async cleanupDomainCache(domain: string): Promise<void> {
                const domainCache = this.memoryCaches.get(domain)
                if (!domainCache) return

                console.log(
                        `开始清理域名 ${domain} 的翻译缓存，当前大小: ${domainCache.size}`
                )

                if (domainCache.size <= this.MAX_CACHE_SIZE) {
                        return
                }

                // 将缓存条目转换为数组进行排序
                const entries = Array.from(domainCache.entries())

                // 按频率升序、最后访问时间升序排序（频率越低、越久未访问的排在前面）
                entries.sort((a, b) => {
                        const entryA = a[1]
                        const entryB = b[1]

                        // 首先按频率排序
                        if (entryA.frequency !== entryB.frequency) {
                                return entryA.frequency - entryB.frequency
                        }

                        // 频率相同则按最后访问时间排序
                        return entryA.lastAccess - entryB.lastAccess
                })

                // 计算需要移除的条目数量
                const entriesToRemove = entries.slice(
                        0,
                        entries.length - this.MAX_CACHE_SIZE
                )

                // 移除最不常用的条目
                entriesToRemove.forEach(([key]) => {
                        domainCache.delete(key)
                })

                console.log(
                        `域名 ${domain} 的缓存清理完成，移除了 ${entriesToRemove.length} 条记录，剩余 ${domainCache.size} 条`
                )

                // 保存清理后的缓存
                this.scheduleSave(domain)
        }

        /**
         * 获取当前域名
         */
        private getCurrentDomain(): string {
                if (typeof window !== 'undefined' && window.location) {
                        return window.location.hostname
                }
                return 'default'
        }

        /**
         * 将指定域名的内存缓存保存到浏览器存储
         */
        /**
         * 计划延迟保存缓存
         */
        private scheduleSave(domain: string): void {
                // 将域名添加到待保存集合
                this.pendingSaveDomains.add(domain)

                // 清除已有的定时器
                if (this.saveTimer !== null) {
                        clearTimeout(this.saveTimer)
                }

                // 创建新的延迟保存定时器
                this.saveTimer = setTimeout(() => {
                        this.executePendingSaves()
                }, this.SAVE_DELAY) as unknown as number
        }

        /**
         * 执行待保存的缓存
         */
        private async executePendingSaves(): Promise<void> {
                // 清除定时器引用
                this.saveTimer = null

                // 复制待保存的域名集合，然后清空原集合
                const domainsToSave = Array.from(this.pendingSaveDomains)
                this.pendingSaveDomains.clear()

                // 批量保存所有待保存的域名
                for (const domain of domainsToSave) {
                        await this.saveDomainCache(domain)
                }
        }

        private async saveDomainCache(domain: string): Promise<void> {
                const domainCache = this.memoryCaches.get(domain)
                if (!domainCache) return

                try {
                        // 将Map转换为对象
                        const cacheData: CacheData = {}
                        domainCache.forEach((entry, key) => {
                                cacheData[key] = entry
                        })

                        const cacheKey = `${this.CACHE_KEY_PREFIX}:${domain}`
                        await browser.storage.local.set({
                                [cacheKey]: cacheData,
                        })
                } catch (error) {
                        console.warn(
                                `保存域名 ${domain} 的翻译缓存失败:`,
                                error
                        )
                }
        }

        /**
         * 获取当前域名的缓存统计信息
         */
        getStats(): { size: number; maxSize: number } {
                const domain = this.getCurrentDomain()
                const domainCache = this.memoryCaches.get(domain)

                return {
                        size: domainCache ? domainCache.size : 0,
                        maxSize: this.MAX_CACHE_SIZE,
                }
        }

        /**
         * 获取指定域名的缓存统计信息
         */
        getDomainStats(
                domain: string
        ): { size: number; maxSize: number } | null {
                const domainCache = this.memoryCaches.get(domain)
                if (!domainCache) return null

                return {
                        size: domainCache.size,
                        maxSize: this.MAX_CACHE_SIZE,
                }
        }

        /**
         * 清空所有缓存
         */
        async clear(): Promise<void> {
                try {
                        // 获取当前域名的缓存键
                        const domain = this.getCurrentDomain()
                        const cacheKey = `${this.CACHE_KEY_PREFIX}:${domain}`

                        // 从内存中移除当前域名的缓存
                        this.memoryCaches.delete(domain)

                        // 从存储中删除当前域名的缓存
                        await browser.storage.local.remove(cacheKey)
                        console.log(`域名 ${domain} 的翻译缓存已清空`)
                } catch (error) {
                        console.warn('清空翻译缓存失败:', error)
                }
        }

        /**
         * 清空指定域名的缓存
         */
        async clearDomain(domain: string): Promise<void> {
                this.memoryCaches.delete(domain)
                try {
                        const cacheKey = `${this.CACHE_KEY_PREFIX}:${domain}`
                        await browser.storage.local.remove(cacheKey)
                        console.log(`域名 ${domain} 的翻译缓存已清空`)
                } catch (error) {
                        console.warn(
                                `清空域名 ${domain} 的翻译缓存失败:`,
                                error
                        )
                }
        }
}

// 创建全局缓存管理器实例
const translationCacheManager = new TranslationCacheManager()

interface UntranslatedTextInfo {
        originalText: string
        targetLang: string
        translator: string
        resolve: (value: string) => void
        reject: (reason?: unknown) => void
}

class SimpleBatchTranslator {
        private queue: UntranslatedTextInfo[] = []
        private processing = false
        private readonly BATCH_DELAY = 5 // 固定延迟10ms
        private readonly BATCH_SIZE = 20 // 固定批量大小

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
                // 检查缓存
                const cachedResult = translationCacheManager.get(
                        originalText,
                        targetLang,
                        translator
                )
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
                await translationCacheManager.set(
                        originalText,
                        targetLang,
                        translator,
                        result
                )

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
        // 确保缓存管理器已初始化
        await translationCacheManager.initialize()

        return batchTranslator.addToBatch(originalText, targetLang, translator)
}

/**
 * 获取当前域名的缓存统计信息
 */
export function getCacheStats(): { size: number; maxSize: number } {
        return translationCacheManager.getStats()
}

/**
 * 获取指定域名的缓存统计信息
 */
export function getDomainCacheStats(
        domain: string
): { size: number; maxSize: number } | null {
        return translationCacheManager.getDomainStats(domain)
}

/**
 * 清空所有翻译缓存
 */
export async function clearTranslationCache(): Promise<void> {
        await translationCacheManager.clear()
}

/**
 * 清空指定域名的翻译缓存
 */
export async function clearDomainTranslationCache(
        domain: string
): Promise<void> {
        await translationCacheManager.clearDomain(domain)
}
