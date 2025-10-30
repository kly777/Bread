import { getTextWalker } from '../../utils/dom/textNodes'

export function initStripe() {
        const observe = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                                mutation.addedNodes.forEach((node) => {
                                        if (node.nodeType === Node.TEXT_NODE) {
                                                const parentElement =
                                                        node.parentElement
                                                if (
                                                        parentElement &&
                                                        hasOnlyTextContent(
                                                                parentElement
                                                        )
                                                ) {
                                                        stripeElement(
                                                                parentElement
                                                        )
                                                }
                                        }
                                })
                        }
                })
        })
        observe.observe(document.body, {
                childList: true,
                subtree: true,
        })

        stripeAll()
}
function stripeAll() {
        const walker = getTextWalker(document.body, { excludeHidden: false })
        let node: Node | null
        while ((node = walker.nextNode())) {
                const parent = node.parentElement
                if (parent && node.textContent?.trim()) {
                        stripeElement(parent)
                }
        }
}

/**
 * 为指定元素应用条纹效果
 * @param element - 需要应用条纹效果的元素
 */
function stripeElement(element: HTMLElement) {
        const backgroundElement = findAncestorWithBackground(element)
        // console.log(backgroundElement, element);
        if (backgroundElement) {
                // 添加条纹类并设置颜色
                if (!element.classList.contains('striped')) {
                        element.classList.add('striped')

                        // 获取背景颜色并生成条纹颜色
                        // const computedStyle = window.getComputedStyle(backgroundElement);
                        // const backgroundColor = computedStyle.backgroundColor;
                        // const stripeColor = generateStripeColor(backgroundColor);

                        // 通过 CSS 变量注入动态颜色
                        // element.style.backgroundColor=stripeColor;
                }
        }
}
/**
 * 查找最近的具有背景色的祖先元素
 * @param element - 起始元素
 * @returns 具有背景色的祖先元素或null
 */
function findAncestorWithBackground(element: HTMLElement): HTMLElement | null {
        let current: HTMLElement | null = element
        while (current) {
                const style = getComputedStyle(current)
                // 判断背景色是否为非透明或存在背景图
                if (
                        style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                        style.backgroundImage !== 'none'
                ) {
                        return current
                }
                current = current.parentElement
        }
        return null
}

/**
 * 检查元素是否只包含文本内容
 * @param element - 需要检查的元素
 * @returns 如果元素只包含文本内容，返回 true；否则返回 false
 */
function hasOnlyTextContent(element: HTMLElement): boolean {
        for (const child of element.childNodes) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                        return false
                }
        }
        return true
}
// /**
//  * 根据背景颜色生成条纹颜色
//  * @param backgroundColor - 背景颜色字符串
//  * @returns 生成的条纹颜色字符串
//  */
// function generateStripeColor(backgroundColor: string): string {
//     const color = tinycolor(backgroundColor);
//     const complement = color.complement();
//     // 强制设置透明度为 0.3（与 CSS 默认值一致）
//     return complement.setAlpha(0.3).toRgbString();
// }
