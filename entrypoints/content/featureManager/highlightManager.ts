import {
        highlightTextInNode,
        removeHighlights,
} from '../feature/highlight/highlightNode'
import { getTextContainerElement } from '../kit/getTextContainer'
import { getSelectedText } from '../kit/getSelectedText'
import { manageMutationObserver } from '../observer/domMutationObserver'

let listen = false
let isHighlightActive = false

// 声明事件处理函数
const handleDown = () => {
        listen = true
}

const handleMove = () => {
        if (listen) {
                highlightFeature()
        }
}

const handleUp = () => {
        listen = false
        highlightFeature()
}

/**
 * 开启文本高亮功能
 * 绑定鼠标事件监听器以激活高亮操作
 * 如果功能已激活则直接返回
 */
export function openHighlight() {
        // 仅当未激活时绑定事件
        if (isHighlightActive) return

        // 绑定事件监听
        document.addEventListener('mousedown', handleDown)
        document.addEventListener('mousemove', handleMove)
        document.addEventListener('mouseup', handleUp)

        isHighlightActive = true
}

/**
 * 停止文本高亮功能
 * 移除所有事件监听器并清除高亮状态
 * 最终会移除页面上所有已存在的高亮标记
 */
export function stopHighlight() {
        // 获取存储的处理函数

        // 移除所有事件监听
        document.removeEventListener('mousedown', handleDown)
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)

        // 清理状态
        isHighlightActive = false
        removeHighlights()
}
/**
 * 执行文本高亮核心逻辑
 * 1. 暂停DOM变更观察以避免冲突
 * 2. 获取当前选中文本并验证有效性
 * 3. 遍历所有文本容器元素进行高亮渲染
 * 4. 重新启动DOM变更观察器
 */
function highlightFeature() {
        console.log('highlightFeature')
        manageMutationObserver(false)
        removeHighlights()

        const text = getSelectedText()
        if (text.trim() === '') {
                manageMutationObserver(true)
                return
        }

        const elements = getTextContainerElement()
        /**
         * 对每个文本容器元素执行高亮操作
         * 通过highlightTextInNode方法将选中文本
         * 在当前元素范围内进行标记渲染
         */
        elements.forEach((ele) => {
                highlightTextInNode(text, ele)
                // ele.style.border="1px solid red"
        })

        manageMutationObserver(true)
}
