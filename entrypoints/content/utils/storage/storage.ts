/**
 * 存储键名生成工具函数
 *
 * 提供基于域名的存储键名生成功能
 */

type StorageKey = `local:${string}`

/**
 * 生成带域名的存储键名（用于popup场景）
 *
 * @param key - 基础键名
 * @returns 完整的存储键名
 */
export function getKeyWithDomainPop(key: string): StorageKey {
        let domain = 'default'
        browser.runtime.sendMessage({ action: 'getDomain' }, (response) => {
                domain = response.domain
        })
        return generateStorageKey(domain, key)
}

/**
 * 生成带域名的存储键名
 *
 * @param key - 基础键名
 * @returns 完整的存储键名
 */
export function getKeyWithDomain(key: string): StorageKey {
        const domain = getCurrentDomain()
        return generateStorageKey(domain, key)
}

let currentDomain: string | null = null

/**
 * 获取当前域名
 *
 * @returns 当前域名
 */
function getCurrentDomain(): string {
        if (currentDomain) {
                return currentDomain
        }
        // 从当前页面URL提取（content script场景）
        if (typeof window !== 'undefined') {
                currentDomain = window.location.hostname
                return currentDomain
        }
        return 'default'
}

/**
 * 生成存储键名
 *
 * @param domain - 域名
 * @param key - 基础键名
 * @returns 完整的存储键名
 */
function generateStorageKey(domain: string, key: string): StorageKey {
        return `local:${domain}:${key}`
}
