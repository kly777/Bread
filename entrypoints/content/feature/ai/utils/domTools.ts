export function getPageInfo(): PageInfo {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pageWidth = document.documentElement.scrollWidth;
    const pageHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;

    const pixelsAbove = scrollTop;
    const pixelsBelow = pageHeight - scrollTop - viewportHeight;
    const pagesAbove = pixelsAbove / viewportHeight;
    const pagesBelow = pixelsBelow / viewportHeight;
    const totalPages = pageHeight / viewportHeight;
    const currentPagePosition = scrollTop / (pageHeight - viewportHeight) || 0;

    return {
        viewportWidth,
        viewportHeight,
        pageWidth,
        pageHeight,
        scrollTop,
        scrollLeft,
        pixelsAbove,
        pixelsBelow,
        pagesAbove,
        pagesBelow,
        totalPages,
        currentPagePosition
    };
}

export function getInteractiveElements(): HTMLElement[] {
    // 获取所有可交互元素
    const selectors = [
        'a', 'button', 'input', 'textarea', 'select',
        '[role="button"]', '[role="link"]', '[role="checkbox"]',
        '[role="radio"]', '[role="tab"]', '[role="menuitem"]',
        '[onclick]', '[tabindex]'
    ];

    const elements: HTMLElement[] = [];
    const seen = new Set<HTMLElement>();

    selectors.forEach(selector => {
        document.querySelectorAll<HTMLElement>(selector).forEach(element => {
            if (!seen.has(element) && isElementVisible(element)) {
                seen.add(element);
                elements.push(element);
            }
        });
    });

    return elements;
}

export function isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        style.opacity !== '0'
    );
}

export function formatInteractiveElements(elements: HTMLElement[]): string {
    if (elements.length === 0) {
        return '<EMPTY>';
    }

    return elements.map((element, index) => {
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent?.trim() || '';
        const placeholder = (element as HTMLInputElement).placeholder || '';
        const value = (element as HTMLInputElement).value || '';
        const type = element.getAttribute('type') || '';
        const id = element.id || '';
        const className = element.className || '';
        
        let description = `[${index}] <${tagName}`;
        if (id) description += ` id="${id}"`;
        if (className) description += ` class="${className}"`;
        if (type) description += ` type="${type}"`;
        if (placeholder) description += ` placeholder="${placeholder}"`;
        if (value) description += ` value="${value}"`;
        
        description += `>`;
        if (text) description += ` "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`;
        
        return description;
    }).join('\n');
}

export interface PageInfo {
    viewportWidth: number;
    viewportHeight: number;
    pageWidth: number;
    pageHeight: number;
    scrollTop: number;
    scrollLeft: number;
    pixelsAbove: number;
    pixelsBelow: number;
    pagesAbove: number;
    pagesBelow: number;
    totalPages: number;
    currentPagePosition: number;
}