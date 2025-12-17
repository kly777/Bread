import { intersectionObserverOptions } from './options'
import { bionicTextNode } from '../../feature/bionic/bionicNode'
import { manageMutationObserver } from '../domMutationObserver'
import { getTextNodes } from '../../utils/dom/textNodes'

/**
 * 仿生文本观察器模块
 * 功能：在元素进入视口时对其文本节点应用仿生效果，并管理相关资源
 * 工作流程：
 * 1. 监听DOM变化暂停/恢复观察器
 * 2. 当元素进入视口时应用文本效果
 * 3. 维护元素与文本节点的映射关系
 * 4. 清理已处理或移除的节点资源
 */
// 使用 Set 存储文本节点，避免重复并提升查找效率
export const parentToTextNodesMap = new Map<Element, Set<Text>>()

/**
 * IntersectionObserver配置选项
 * 获取具体配置参数（阈值0，根边距100px）
 */
export const bionicTextObserver = new IntersectionObserver((entries) => {
        manageMutationObserver(false)
        entries.forEach(processVisibleTextElement)
        manageMutationObserver(true)
}, intersectionObserverOptions)

/**
 * 处理IntersectionObserverEntry，当元素进入视口时应用文本节点的仿生效果并清理映射。
 * @param entry - IntersectionObserver回调接收的条目对象，包含目标元素和相交状态
 * @returns {void}
 * @remarks
 * 核心处理步骤：
 * 1. 检查元素有效性（是否仍在DOM中）
 * 2. 应用仿生效果到文本节点（如高亮、动画等）
 * 3. 清理已完成处理的元素与文本节点的映射关系
 * 4. 停止对当前元素的观察以避免重复处理
 */
function processVisibleTextElement(entry: IntersectionObserverEntry): void {
        const element = entry.target as Element
        const setTexts = parentToTextNodesMap.get(element)

        // 增加 document.contains 检查，确保元素仍在 DOM 中
        if (!setTexts || !entry.isIntersecting || !document.contains(element))
                return

        // 应用仿生效果到文本节点（例如高亮、动画等）
        applyBionicEffect(Array.from(setTexts))

        // 清理元素与文本节点的映射关系
        cleanupAndUnobserve(element)
}

/**
 * 将仿生效果应用到指定文本节点数组
 * @param textNodes - 需要应用效果的文本节点数组
 * @remarks
 * 调用feature/bionic/bionicNode中的bionicTextNode函数实现具体效果
 * @internal
 * 实现细节：遍历每个文本节点并调用bionicTextNode进行处理
 */
function applyBionicEffect(textNodes: Text[]) {
        textNodes.forEach((text) => bionicTextNode(text))
}

/**
 * 清理指定元素与文本节点的映射关系并停止观察
 * @param element - 需要清理的元素节点
 * @internal
 * 实现细节：删除元素映射并调用unobserve停止观察
 */
function cleanupAndUnobserve(element: Element) {
        parentToTextNodesMap.delete(element)
        bionicTextObserver.unobserve(element)
}

/**
 * 初始化单次使用观察器，开始观察文档主体
 * @remarks
 * 主要用于初始化阶段设置观察起点
 * @internal
 * 实现细节：调用observeElementNode方法观察document.body
 */
export function initializeSingleUseObserver() {
        observeElementNode(document.body)
}

/**
 * 观察指定元素的所有文本节点
 * @param ele - 需要观察的元素节点
 * @remarks
 * 调用kit/getTextNodes获取元素下的所有文本节点
 * @internal
 * 实现细节：获取元素下所有符合条件的文本节点并逐个观察
 */
export function observeElementNode(ele: Element) {
        getTextNodes(ele).forEach(observeTextNode)
}

/**
 * 观察单个文本节点
 * @param text - 需要观察的文本节点
 * @remarks
 * 1. 检查父元素是否存在且仍在DOM中
 * 2. 建立文本节点与父元素的关联映射
 * @internal
 * 实现细节：获取文本节点的父元素并调用linkTextToElement建立映射
 */
function observeTextNode(text: Text) {
        const parent = text.parentElement
        if (!parent || !document.contains(parent)) return // 新增存在性校验

        // 更新映射关系
        linkTextToElement(parent, text)
}

/**
 * 建立文本节点与其父元素的关联映射
 * @param parent - 父元素节点
 * @param text - 文本节点
 * @remarks
 * 1. 如果父元素已有映射则直接添加新文本节点
 * 2. 如果父元素没有映射则创建新的映射并开始观察
 * @internal
 * 实现细节：使用Map存储元素到文本节点集合的映射关系
 */
function linkTextToElement(parent: Element, text: Text) {
        if (parentToTextNodesMap.has(parent)) {
                const setTexts = parentToTextNodesMap.get(parent)
                if (setTexts) {
                        if (!setTexts.has(text)) {
                                setTexts.add(text)
                        }
                }
        } else {
                const setTexts = new Set<Text>([text])
                parentToTextNodesMap.set(parent, setTexts)
                bionicTextObserver.observe(parent)
        }
}
