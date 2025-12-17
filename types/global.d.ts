/**
 * 全局类型声明
 * 声明storage对象，替代wxt的全局storage
 */

// 存储键类型
type StorageKey = `local:${string}`

// storage对象接口
interface StorageInterface {
        getItem<T>(key: StorageKey): Promise<T | null>
        setItem<T>(key: StorageKey, value: T): Promise<void>
        setItems(items: { key: StorageKey; value: unknown }[]): Promise<void>
        removeItem(key: StorageKey): Promise<void>
        watch<T>(
                key: StorageKey,
                callback: (newValue: T | null, oldValue: T | null) => void
        ): () => void
        clear(): Promise<void>
        getAll(): Promise<Record<string, unknown>>
}

// 声明全局breadStorage对象，避免与标准Storage API冲突
declare const breadStorage: StorageInterface

const browser: typeof chrome

interface Window {
        breadStorage: StorageInterface
}
