import tinycolor from "tinycolor2";
import { getTextWalker } from "../../kit/getNodes";

export function initStripe() {
    const observe = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const parentElement = node.parentElement;
                        if (
                            parentElement &&
                            hasOnlyTextContent(parentElement)
                        ) {
                            stripeElement(parentElement);
                        }
                    }
                });
            }
        });
    });
    observe.observe(document.body, {
        childList: true,
        subtree: true,
    });

    stripeAll();
}
function stripeAll() {
    const walker = getTextWalker(document.body, { excludeHidden: false });
    let node: Node | null;
    while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (parent && node.textContent?.trim()) {
            stripeElement(parent);
        }
    }
}

/**
 * 为指定元素应用条纹效果
 * @param element - 需要应用条纹效果的元素
 */
function stripeElement(element: HTMLElement) {
    // 移除旧的条纹类（修正选择器逻辑）
    if (element.classList.contains("striped")) {
        element.classList.remove("striped");
    }

    // 添加条纹类并设置颜色
    if (!element.classList.contains("striped")) {
        element.classList.add("striped");

        // 获取背景颜色并生成条纹颜色
        const computedStyle = window.getComputedStyle(element);
        const backgroundColor = computedStyle.backgroundColor;
        const stripeColor = generateStripeColor(backgroundColor);

        // 通过 CSS 变量注入动态颜色
        element.style.setProperty("--stripe-color", stripeColor);
    }
}
/**
 * 查找最近的具有背景色的祖先元素
 * @param element - 起始元素
 * @returns 具有背景色的祖先元素或null
 */
function findAncestorWithBackground(element: Element): Element | null {
    let current: Element | null = element;
    while (current) {
        const style = getComputedStyle(current);
        if (style.backgroundColor !== "rgba(0, 0, 0, 0)") {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}


/**
 * 检查元素是否只包含文本内容
 * @param element - 需要检查的元素
 * @returns 如果元素只包含文本内容，返回 true；否则返回 false
 */
function hasOnlyTextContent(element: HTMLElement): boolean {
    for (let child of element.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            return false;
        }
    }
    return true;
}
/**
 * 根据背景颜色生成条纹颜色
 * @param backgroundColor - 背景颜色字符串
 * @returns 生成的条纹颜色字符串
 */
function generateStripeColor(backgroundColor: string): string {
    const color = tinycolor(backgroundColor);
    const complementColor = color
        .complement() // 获取互补色
        .setAlpha(0.09) // 设置透明度
        // .darken(20) // 使颜色变暗
        .toRgbString(); // 转换为 RGB 字符串
    return complementColor;
}
