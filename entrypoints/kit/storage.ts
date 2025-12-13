/**
 * 替代wxt的storage对象，使用Firefox原生API
 * 提供与wxt storage兼容的接口
 */

type StorageKey = `local:${string}`

/**
 * 获取存储项
 */
export async function getItem<T>(key: StorageKey): Promise<T | null> {
        try {
                const result = await browser.storage.local.get(key)
                return result[key] !== undefined ? (result[key] as T) : null
        } catch (error) {
                console.warn(`获取存储项 ${key} 失败:`, error)
                return null
        }
}

/**
 * 设置存储项
 */
export async function setItem<T>(key: StorageKey, value: T): Promise<void> {
        try {
                await browser.storage.local.set({ [key]: value })
        } catch (error) {
                console.error(`设置存储项 ${key} 失败:`, error)
        }
}

/**
 * 批量设置存储项
 */
export async function setItems(
        items: { key: StorageKey; value: unknown }[]
): Promise<void> {
        try {
                const updates: Record<string, unknown> = {}
                for (const item of items) {
                        updates[item.key] = item.value
                }
                await browser.storage.local.set(updates)
        } catch (error) {
                console.error('批量设置存储项失败:', error)
        }
}

/**
 * 删除存储项
 */
export async function removeItem(key: StorageKey): Promise<void> {
        try {
                await browser.storage.local.remove(key)
        } catch (error) {
                console.error(`删除存储项 ${key} 失败:`, error)
        }
}

/**
 * 监听存储变化
 */
export function watch<T>(
        key: StorageKey,
        callback: (newValue: T | null, oldValue: T | null) => void
): () => void {
        const listener = (changes: Record<string, unknown>, area: string) => {
                if (area === 'local' && changes[key]) {
                        const change = changes[key] as {
                                newValue?: T
                                oldValue?: T
                        }
                        callback(
                                change.newValue ?? null,
                                change.oldValue ?? null
                        )
                }
        }

        browser.storage.onChanged.addListener(listener)

        // 返回取消监听函数
        return () => {
                browser.storage.onChanged.removeListener(listener)
        }
}

/**
 * 清空存储
 */
export async function clear(): Promise<void> {
        try {
                await browser.storage.local.clear()
        } catch (error) {
                console.error('清空存储失败:', error)
        }
}

/**
 * 获取所有存储项
 */
export async function getAll(): Promise<Record<string, unknown>> {
        try {
                return await browser.storage.local.get(null)
        } catch (error) {
                console.error('获取所有存储项失败:', error)
                return {}
        }
}
