import { intersectionObserverOptions } from './options'

import { manageMutationObserver } from '../domMutationObserver'
import { getTextContainerElement } from '../../utils/dom/traversal'
// 翻译钩子系统
type TranslateHook = (element: HTMLElement) => Promise<void>

let translateHook: TranslateHook | null = null

export function registerTranslateHook(hook: TranslateHook): void {
        console.log('注册翻译钩子')
        translateHook = hook
}

export function hasTranslateHook(): boolean {
        return translateHook !== null
}
import { preprocessExcludedElements } from '../../feature/translate/textExtractor'
import { registerNewElementsHook } from '../observerHooks'

/**
 * 翻译观察器模块
 *
 * 功能：观察元素进入视口，延迟翻译可见元素
 * 工作流程：
 * 1. 初始化时预处理排除元素
 * 2. 观察文本容器元素的可见性变化
 * 3. 当元素进入视口时，延迟300毫秒后翻译
 * 4. 当元素离开视口时，取消待处理的翻译
 * 5. 定期清理长时间未进入视口的元素
 */

/**
 * 待处理翻译数据接口
 */
interface PendingTranslationData {
        timer: number | null
        isIntersecting: boolean
        lastEntryTime: number
}

/**
 * 跟踪每个元素的待处理翻译和计时器
 */
const pendingTranslations = new Map<HTMLElement, PendingTranslationData>()

/**
 * 延迟时间（毫秒）- 用户停留300毫秒后才翻译
 */
const TRANSLATION_DELAY = 300

/**
 * 过时阈值（毫秒）- 60秒未进入视口的元素将被清理
 */
const STALE_THRESHOLD = 60000

/**
 * 清理间隔（毫秒）- 每30秒清理一次过时元素
 */
const CLEANUP_INTERVAL = 30000

/**
 * IntersectionObserver 翻译观察器
 *
 * 核心处理逻辑：
 * 1. 在观察器回调开始时暂停DOM变更观察器
 * 2. 处理每个进入/离开视口的元素
 * 3. 处理完成后恢复DOM变更观察器
 */
const translateObserver = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
                manageMutationObserver(false)
                entries.forEach(handleIntersection)
                manageMutationObserver(true)
        },
        intersectionObserverOptions
)

/**
 * 处理IntersectionObserver条目
 *
 * @param entry - IntersectionObserver回调接收的条目对象
 * @remarks
 * 核心处理步骤：
 * 1. 获取或创建元素的待处理翻译数据
 * 2. 更新元素的相交状态和最后进入时间
 * 3. 根据是否相交调度或取消翻译
 */
function handleIntersection(entry: IntersectionObserverEntry): void {
        const element = entry.target as HTMLElement
        const now = Date.now()

        let data = pendingTranslations.get(element)
        if (!data) {
                data = {
                        timer: null,
                        isIntersecting: entry.isIntersecting,
                        lastEntryTime: now,
                }
                pendingTranslations.set(element, data)
        }

        data.isIntersecting = entry.isIntersecting
        data.lastEntryTime = now

        if (entry.isIntersecting) {
                // 元素进入视口，调度延迟翻译
                scheduleTranslation(element)
        } else {
                // 元素离开视口，取消待处理翻译
                cancelTranslation(element)
        }
}

/**
 * 调度元素的延迟翻译
 *
 * @param element - 需要翻译的HTML元素
 * @remarks
 * 处理步骤：
 * 1. 获取元素的待处理翻译数据
 * 2. 清除现有的计时器（避免重复调度）
 * 3. 设置新的计时器，延迟300毫秒后执行翻译
 * 4. 计时器触发时检查元素是否仍在视口中
 * 5. 执行翻译并清理资源
 */
function scheduleTranslation(element: HTMLElement): void {
        const data = pendingTranslations.get(element)
        if (!data) return

        // 清除现有计时器
        if (data.timer !== null) {
                clearTimeout(data.timer)
                data.timer = null
        }

        // 设置新的计时器
        data.timer = window.setTimeout(() => {
                // 计时器触发时，检查元素是否仍然在视口中
                const currentData = pendingTranslations.get(element)
                if (!currentData || !currentData.isIntersecting) {
                        // 元素已离开视口，跳过翻译
                        console.log('Element left viewport')
                        pendingTranslations.delete(element)
                        return
                }

                // 执行翻译
                if (translateHook !== null) {
                        translateHook(element).finally(() => {
                                // 翻译完成后清理
                                pendingTranslations.delete(element)
                                // 停止观察该元素（可选）
                                translateObserver.unobserve(element)
                        })
                } else {
                        console.warn('No translate hook registered')
                        pendingTranslations.delete(element)
                }
        }, TRANSLATION_DELAY)
}

/**
 * 取消元素的待处理翻译
 *
 * @param element -
 需要取消翻译的HTML元素
 * @remarks
 * 处理步骤：
 * 1. 获取元素的待处理翻译数据
 * 2. 清除计时器
 * 3. 保留数据以便重新进入视口时使用
 */
function cancelTranslation(element: HTMLElement): void {
        const data = pendingTranslations.get(element)
        if (!data) return

        if (data.timer !== null) {
                clearTimeout(data.timer)
                data.timer = null
        }
        // 如果元素离开视口，我们保留数据以便重新进入时使用
        // 但可以稍后清理（例如，如果元素长时间不在视口中）
}

/**
 * 清理长时间未进入视口的元素
 *
 * @remarks
 * 定期执行，清理超过60秒未进入视口的元素
 * 防止内存泄漏和无效数据积累
 */
function cleanupStaleElements(): void {
        const now = Date.now()

        for (const [element, data] of pendingTranslations.entries()) {
                if (
                        !data.isIntersecting &&
                        now - data.lastEntryTime > STALE_THRESHOLD
                ) {
                        cancelTranslation(element)
                        pendingTranslations.delete(element)
                }
        }
}

// 启动定期清理任务
setInterval(cleanupStaleElements, CLEANUP_INTERVAL)

/**
 * 初始化翻译观察器
 *
 * @remarks
 * 执行步骤：
 * 1. 预处理排除元素，确保翻译行为与DOM结构顺序无关
 * 2. 开始观察文档主体中的文本容器元素
 */
export function initializeTranslateObserver(): void {
        // 预处理排除元素，确保翻译行为与DOM结构顺序无关
        preprocessExcludedElements(document.body)
        observeTranslateElements(document.body)
}

/**
 * 观察指定根元素下的文本容器元素
 *
 * @param root - 观察的根元素
 * @remarks
 * 遍历根元素下的所有文本容器元素并开始观察
 */
export function observeTranslateElements(root: Element): void {
        getTextContainerElement(root).forEach((el) =>
                translateObserver.observe(el)
        )
}

/**
 * 停止翻译观察器
 *
 * @remarks
 * 清理步骤：
 * 1. 断开IntersectionObserver连接
 * 2. 清理所有待处理计时器
 * 3. 清除待处理翻译数据
 * 4. 移除所有翻译结果元素
 */
export function stopTranslatorObserver(): void {
        translateObserver.disconnect()

        // 清理所有待处理计时器
        for (const [, data] of pendingTranslations.entries()) {
                if (data.timer !== null) {
                        clearTimeout(data.timer)
                }
        }

        pendingTranslations.clear()

        // 移除所有翻译结果元素
        document.querySelectorAll<HTMLElement>('.translation-result').forEach(
                (tr) => {
                        tr.remove()
                }
        )
}

/**
 * 注册新元素钩子
 *
 * 当DOM变化检测到新元素时，自动观察这些元素的翻译需求
 */
registerNewElementsHook((elements: Element[]) => {
        console.log('New elements detected for translation observer')
        elements.forEach((element) => {
                observeTranslateElements(element)
        })
})
