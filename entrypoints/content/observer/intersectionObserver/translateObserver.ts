import { intersectionObserverOptions } from './options'

import { manageMutationObserver } from '../domMutationObserver'
import { getTextContainerElement } from '../../utils/dom/traversal'
import { translateElement } from '../../feature/translate/translateElement'
import { preprocessExcludedElements } from '../../feature/translate/textExtractor'
import { registerNewElementsHook } from '../observerHooks'

// 跟踪每个元素的待处理翻译和计时器
const pendingTranslations = new Map<
        HTMLElement,
        {
                timer: number | null
                isIntersecting: boolean
                lastEntryTime: number
        }
>()

// 延迟时间（毫秒）
const TRANSLATION_DELAY = 300 // 用户停留300毫秒后才翻译

const translateObserver = new IntersectionObserver((entries) => {
        manageMutationObserver(false)
        entries.forEach(handleIntersection)
        manageMutationObserver(true)
}, intersectionObserverOptions)

function handleIntersection(entry: IntersectionObserverEntry) {
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

function scheduleTranslation(element: HTMLElement) {
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
                translateElement(element).finally(() => {
                        // 翻译完成后清理
                        pendingTranslations.delete(element)
                        // 停止观察该元素（可选）
                        translateObserver.unobserve(element)
                })
        }, TRANSLATION_DELAY)
}

function cancelTranslation(element: HTMLElement) {
        const data = pendingTranslations.get(element)
        if (!data) return
        if (data.timer !== null) {
                clearTimeout(data.timer)
                data.timer = null
        }
        // 如果元素离开视口，我们保留数据以便重新进入时使用
        // 但可以稍后清理（例如，如果元素长时间不在视口中）
}

// 清理长时间未进入视口的元素
setInterval(() => {
        const now = Date.now()
        const staleThreshold = 60000 // 60秒
        for (const [element, data] of pendingTranslations.entries()) {
                if (
                        !data.isIntersecting &&
                        now - data.lastEntryTime > staleThreshold
                ) {
                        cancelTranslation(element)
                        pendingTranslations.delete(element)
                }
        }
}, 30000)

// 初始化入口
export function initializeTranslateObserver() {
        // 预处理排除元素，确保翻译行为与DOM结构顺序无关
        preprocessExcludedElements(document.body)
        observeTranslateElements(document.body)
}

// 统一观察方法
export function observeTranslateElements(root: Element) {
        getTextContainerElement(root).forEach((el) =>
                translateObserver.observe(el)
        )
}
registerNewElementsHook((elements) => {
        console.log('New elements detected')
        elements.forEach((element) => {
                observeTranslateElements(element)
        })
})
export function stopTranslatorObserver() {
        translateObserver.disconnect()
        // 清理所有待处理计时器
        for (const [, data] of pendingTranslations.entries()) {
                if (data.timer !== null) {
                        clearTimeout(data.timer)
                }
        }
        pendingTranslations.clear()
        document.querySelectorAll<HTMLElement>('.translation-result').forEach(
                (tr) => {
                        tr.remove()
                }
        )
}
