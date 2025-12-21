/**
 * 当前域名状态管理
 * 用于存储和获取当前页面的域名
 */

let currentDomain = 'default'

/**
 * 设置当前域名
 */
export function setDomain(domain: string): void {
        currentDomain = domain
}

/**
 * 获取当前域名
 */
export function getDomain(): string {
        return currentDomain
}

/**
 * 初始化域名
 * 从background脚本获取当前激活标签页的域名
 */
export async function initDomain(): Promise<void> {
        try {
                const response = await browser.runtime.sendMessage({
                        action: 'getDomain',
                })
                if (response && response.domain) {
                        currentDomain = response.domain
                } else {
                        currentDomain = 'default'
                }
        } catch (error) {
                console.error('获取域名失败:', error)
                currentDomain = 'default'
        }
}
