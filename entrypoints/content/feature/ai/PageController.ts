import { getPageInfo, getInteractiveElements, formatInteractiveElements, PageInfo } from './utils/domTools';

export interface PageControllerConfig {
    /** 启用视觉遮罩覆盖（默认：false） */
    enableMask?: boolean;
    /** 视口扩展像素（默认：0） */
    viewportExpansion?: number;
}

export interface BrowserState {
    url: string;
    title: string;
    /** 页面信息 + 滚动位置提示 */
    header: string;
    /** 交互元素的简化 HTML */
    content: string;
    /** 页面底部提示 */
    footer: string;
}

export interface ActionResult {
    success: boolean;
    message: string;
}

export class PageController {
    private config: PageControllerConfig;
    private isInitialized = false;

    constructor(config: PageControllerConfig = {}) {
        this.config = {
            enableMask: false,
            viewportExpansion: 0,
            ...config
        };
    }

    async init(): Promise<void> {
        if (this.isInitialized) return;
        
        console.log('PageController 初始化');
        this.isInitialized = true;
    }

    async getCurrentUrl(): Promise<string> {
        return window.location.href;
    }

    /**
     * 获取浏览器状态
     */
    async getBrowserState(): Promise<BrowserState> {
        const url = window.location.href;
        const title = document.title;
        
        const pageInfo = getPageInfo();
        
        // 获取交互元素
        const interactiveElements = getInteractiveElements();
        const content = formatInteractiveElements(interactiveElements);
        
        const header = buildPageHeader(url, title, pageInfo, this.config);
        
        const footer = buildPageFooter(pageInfo, this.config);

        return {
            url,
            title,
            header,
            content,
            footer
        };
    }


    async clickElement(index: number): Promise<ActionResult> {
        try {
            const element = getElementByIndex(getInteractiveElements(), index);
            if (!element) {
                return {
                    success: false,
                    message: `未找到索引为 ${index} 的元素`
                };
            }

            element.click();
            return {
                success: true,
                message: `成功点击元素 ${index}`
            };
        } catch (error) {
            return {
                success: false,
                message: `点击元素失败: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    async inputText(index: number, text: string): Promise<ActionResult> {
        try {
            const element = getElementByIndex(getInteractiveElements(), index) as HTMLInputElement | HTMLTextAreaElement;
            if (!element) {
                return {
                    success: false,
                    message: `未找到索引为 ${index} 的输入元素`
                };
            }

            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));

            return {
                success: true,
                message: `成功在元素 ${index} 输入文本: "${text}"`
            };
        } catch (error) {
            return {
                success: false,
                message: `输入文本失败: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    async selectOption(index: number, value: string): Promise<ActionResult> {
        try {
            const element = getElementByIndex(getInteractiveElements(), index) as HTMLSelectElement;
            if (!element) {
                return {
                    success: false,
                    message: `未找到索引为 ${index} 的选择元素`
                };
            }

            element.value = value;
            element.dispatchEvent(new Event('change', { bubbles: true }));

            return {
                success: true,
                message: `成功在元素 ${index} 选择选项: "${value}"`
            };
        } catch (error) {
            return {
                success: false,
                message: `选择选项失败: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    async scroll(direction: 'up' | 'down' | 'left' | 'right', amount = 100): Promise<ActionResult> {
        try {
            const scrollOptions: ScrollToOptions = { behavior: 'smooth' };
            
            switch (direction) {
                case 'up':
                    window.scrollBy({ ...scrollOptions, top: -amount });
                    break;
                case 'down':
                    window.scrollBy({ ...scrollOptions, top: amount });
                    break;
                case 'left':
                    window.scrollBy({ ...scrollOptions, left: -amount });
                    break;
                case 'right':
                    window.scrollBy({ ...scrollOptions, left: amount });
                    break;
            }

            return {
                success: true,
                message: `成功向${direction}滚动 ${amount}px`
            };
        } catch (error) {
            return {
                success: false,
                message: `滚动失败: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    async executeJavaScript(code: string): Promise<ActionResult> {
        try {
            const result = eval(code);
            return {
                success: true,
                message: `JavaScript 执行成功: ${result}`
            };
        } catch (error) {
            return {
                success: false,
                message: `JavaScript 执行失败: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    async cleanUpHighlights(): Promise<void> {
        // 实现高亮清理逻辑
        console.log('清理高亮');
    }

    dispose(): void {
        this.isInitialized = false;
        console.log('PageController 已销毁');
    }
}

function buildPageHeader(url: string, title: string, pageInfo: PageInfo, config: PageControllerConfig): string {
    const titleLine = `当前页面: [${title}](${url})`;
    const pageInfoLine = `页面信息: ${pageInfo.viewportWidth}x${pageInfo.viewportHeight}px 视口, ${pageInfo.pageWidth}x${pageInfo.pageHeight}px 总页面大小, ${pageInfo.pagesAbove.toFixed(1)} 页在上方, ${pageInfo.pagesBelow.toFixed(1)} 页在下方, ${pageInfo.totalPages.toFixed(1)} 总页数, 位于页面 ${(pageInfo.currentPagePosition * 100).toFixed(0)}% 位置`;

    const hasContentAbove = pageInfo.pixelsAbove > 4;
    const scrollHintAbove = hasContentAbove && config.viewportExpansion !== -1
        ? `[页面开始] (上方还有 ${Math.round(pageInfo.pixelsAbove)} 像素内容)`
        : '[页面开始]';

    return `${titleLine}\n${pageInfoLine}\n${scrollHintAbove}`;
}

function buildPageFooter(pageInfo: PageInfo, config: PageControllerConfig): string {
    const hasContentBelow = pageInfo.pixelsBelow > 4;
    const scrollHintBelow = hasContentBelow && config.viewportExpansion !== -1
        ? `... 下方还有 ${Math.round(pageInfo.pixelsBelow)} 像素内容 ...`
        : '[页面结束]';

    return scrollHintBelow;
}

function getElementByIndex(elements: HTMLElement[], index: number): HTMLElement | null {
    return elements[index] || null;
}