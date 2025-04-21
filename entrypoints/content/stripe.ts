import tinycolor from "tinycolor2";

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
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node: Node) => {
        if (
          node.parentElement &&
          [
            "input",
            "textarea",
            "select",
            "button",
            "script",
            "style",
            "a",
          ].includes(node.parentElement.tagName.toLowerCase())
        ) {
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parentElement = node.parentElement;
    if (
      parentElement &&
      node.textContent &&
      node.textContent.trim().length > 0
    ) {
      stripeElement(parentElement);
    }
  }
}
/**
 * 为指定元素应用条纹效果
 * @param element - 需要应用条纹效果的元素
 */
function stripeElement(element: HTMLElement) {
  // element.style.backgroundImage =
  //     "linear-gradient(90deg, #0000 95%, rgba(123, 123, 123, 0.28) 5%)";
  // element.style.backgroundSize = "20px 25%";
  // element.style.backgroundClip = "content-box";
  // element.style.backgroundOrigin = "content-box";
  const existingStripe = element.querySelector("striped");
  if (existingStripe) {
    element.classList.remove("striped");
  }

  if (!element.classList.contains("striped")) {
    element.classList.add("striped");
    element.style.position = "relative"; // 确保伪元素相对于父元素定位

    // 获取元素的背景颜色
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;

    // 生成条纹颜色
    const stripeColor = generateStripeColor(backgroundColor);

    // 创建伪元素
    const stripe = document.createElement("span");
    stripe.style.position = "absolute";
    stripe.style.bottom = "0";
    stripe.style.left = "0";
    stripe.style.width = "100%";
    stripe.style.height = "100%";
    stripe.style.pointerEvents = "none";
    // stripe.style.backgroundImage =
    //     "linear-gradient(90deg, #0000 35px, rgba(95, 95, 95, 0.3) 1px)";
    stripe.style.backgroundImage = `linear-gradient(90deg, #0000 35px, ${stripeColor} 1px)`;
    stripe.style.backgroundSize = "36px 100%";
    stripe.style.backgroundClip = "content-box";
    stripe.style.backgroundOrigin = "content-box";

    // 将伪元素插入到元素中
    element.insertBefore(stripe, element.firstChild);
  }
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
    .darken(20) // 使颜色变暗
    .toRgbString(); // 转换为 RGB 字符串
  return complementColor;
}
