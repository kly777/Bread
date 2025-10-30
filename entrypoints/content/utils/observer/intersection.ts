/**
 * IntersectionObserver 相关工具函数
 *
 * 提供 IntersectionObserver 的配置和创建功能
 */

/**
 * IntersectionObserver 配置选项
 */
export const intersectionObserverOptions: IntersectionObserverInit = {
        threshold: 0,
}

/**
 * 创建 IntersectionObserver 实例
 *
 * @param callback - 观察器回调函数
 * @param options - 观察器配置选项
 * @returns IntersectionObserver 实例
 */
export function createIntersectionObserver(
        callback: IntersectionObserverCallback,
        options: IntersectionObserverInit = intersectionObserverOptions
): IntersectionObserver {
        return new IntersectionObserver(callback, options)
}

/**
 * 观察指定元素
 *
 * @param observer - IntersectionObserver 实例
 * @param element - 要观察的元素
 */
export function observeElement(
        observer: IntersectionObserver,
        element: Element
): void {
        observer.observe(element)
}

/**
 * 停止观察指定元素
 *
 * @param observer - IntersectionObserver 实例
 * @param element - 要停止观察的元素
 */
export function unobserveElement(
        observer: IntersectionObserver,
        element: Element
): void {
        observer.unobserve(element)
}

/**
 * 断开观察器连接
 *
 * @param observer - IntersectionObserver 实例
 */
export function disconnectObserver(observer: IntersectionObserver): void {
        observer.disconnect()
}

/**
 * 检查元素是否在视口中可见
 *
 * @param element - 要检查的元素
 * @returns 如果元素在视口中可见返回 true，否则返回 false
 */
export function isElementVisible(element: Element): boolean {
        const rect = element.getBoundingClientRect()
        return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <=
                        (window.innerHeight ||
                                document.documentElement.clientHeight) &&
                rect.right <=
                        (window.innerWidth ||
                                document.documentElement.clientWidth)
        )
}
