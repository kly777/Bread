/**
 * 配置管理工具函数
 *
 * 提供统一的配置获取、设置和监听功能
 */

import { getKeyWithDomain, getCurrentDomain } from './domain'

type StorageKey = `local:${string}`


/**
 * 获取配置项值
 *
 * @param key - 配置键名
 * @param defaultValue - 默认值
 * @param domain - 域名，默认为当前域名
 * @returns 配置值
 */
export async function getSetting<T>(
        key: string,
        defaultValue: T,
        domain: string = getCurrentDomain()
): Promise<T> {
        try {
                const storageKey: StorageKey = getKeyWithDomain(
                        key,
                        domain
                ) as StorageKey
                const result = await browser.storage.local.get(storageKey)
                const value = result[storageKey]
                return value !== undefined ? (value as T) : defaultValue
        } catch (error) {
                console.warn(`获取配置 ${key} 失败:`, error)
                return defaultValue
        }
}

/**
 * 设置配置项值
 *
 * @param key - 配置键名
 * @param value - 配置值
 * @param domain - 域名，默认为当前域名
 */
export async function setSetting<T>(
        key: string,
        value: T,
        domain: string = getCurrentDomain()
): Promise<void> {
        try {
                const storageKey: StorageKey = getKeyWithDomain(
                        key,
                        domain
                ) as StorageKey
                await browser.storage.local.set({ [storageKey]: value })
        } catch (error) {
                console.error(`设置配置 ${key} 失败:`, error)
        }
}

/**
 * 监听配置项变化
 *
 * @param key - 配置键名
 * @param callback - 变化回调函数
 * @param domain - 域名，默认为当前域名
 * @returns 取消监听函数
 */
export function watchSetting<T>(
        key: string,
        callback: (newValue: T | null, oldValue: T | null) => void,
        domain: string = getCurrentDomain()
): () => void {
        const storageKey: StorageKey = getKeyWithDomain(
                key,
                domain
        ) as StorageKey

        const listener = (changes: Record<string, unknown>, area: string) => {
                if (area === 'local' && changes[storageKey]) {
                        const { newValue, oldValue } = changes[storageKey] as {
                                newValue: T | null
                                oldValue: T | null
                        }
                        callback(newValue, oldValue)
                }
        }

        browser.storage.onChanged.addListener(listener)

        // 返回取消监听函数
        return () => {
                browser.storage.onChanged.removeListener(listener)
        }
}

/**
 * 批量获取多个配置项
 *
 * @param keys - 配置键名数组
 * @param domain - 域名，默认为当前域名
 * @returns 配置项对象
 */
export async function getSettings<T extends Record<string, unknown>>(
        keys: string[],
        domain: string = getCurrentDomain()
): Promise<T> {
        const result = {} as T

        for (const key of keys) {
                const storageKey: StorageKey = getKeyWithDomain(
                        key,
                        domain
                ) as StorageKey
                const storageResult = await browser.storage.local.get(storageKey)
                const value = storageResult[storageKey]
                result[key as keyof T] = value as T[keyof T]
        }

        return result
}

/**
 * 批量设置多个配置项
 *
 * @param settings - 配置项对象
 * @param domain - 域名，默认为当前域名
 */
export async function setSettings<T extends Record<string, unknown>>(
        settings: T,
        domain: string = getCurrentDomain()
): Promise<void> {
        const updates: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(settings)) {
                const storageKey: StorageKey = getKeyWithDomain(
                        key,
                        domain
                ) as StorageKey
                updates[storageKey] = value
        }

        try {
                await browser.storage.local.set(updates)
        } catch (error) {
                console.error('批量设置配置失败:', error)
        }
}

/**
 * 删除配置项
 *
 * @param key - 配置键名
 * @param domain - 域名，默认为当前域名
 */
export async function removeSetting(
        key: string,
        domain: string = getCurrentDomain()
): Promise<void> {
        try {
                const storageKey: StorageKey = getKeyWithDomain(
                        key,
                        domain
                ) as StorageKey
                await browser.storage.local.remove(storageKey)
        } catch (error) {
                console.error(`删除配置 ${key} 失败:`, error)
        }
}
