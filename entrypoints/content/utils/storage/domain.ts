/**
 * 域名相关存储工具函数
 *
 * 提供基于域名的存储键名生成功能
 */

/**
 * 生成带域名的存储键名
 *
 * @param key - 基础键名
 * @param domain - 域名，如果为 'default' 则不添加域名前缀
 * @returns 完整的存储键名
 */
export function getKeyWithDomain(
        key: string,
        domain: string = 'default'
): string {
        // 如果域名是默认值，则不添加域名前缀
        if (domain === 'default') {
                return `local:${key}`
        }
        // 否则，添加域名前缀
        return `local:${domain}:${key}`
}

/**
 * 从存储键名中提取域名
 *
 * @param storageKey - 存储键名
 * @returns 提取的域名，如果没有域名则返回 'default'
 */
export function extractDomainFromKey(storageKey: string): string {
        const parts = storageKey.split(':')
        if (parts.length >= 3 && parts[0] === 'local') {
                return parts[1]
        }
        return 'default'
}

/**
 * 获取当前页面的域名
 *
 * @returns 当前页面的域名
 */
export function getCurrentDomain(): string {
        return window.location.hostname
}

/**
 * 检查是否为默认域名配置
 *
 * @param domain - 要检查的域名
 * @returns 如果是默认域名返回 true，否则返回 false
 */
export function isDefaultDomain(domain: string): boolean {
        return domain === 'default'
}
