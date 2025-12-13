// 移除wxt的defineBackground，改为直接执行

// 声明browser API类型


console.log('Hello background!')

// 检查browser API是否可用
if (typeof browser !== 'undefined' && browser.runtime) {
        console.log('Browser runtime ID:', browser.runtime.id)

        browser.runtime.onMessage.addListener(
                (message, _, sendResponse: (response) => void) => {
                        if (message.action === 'getDomain') {
                                browser.tabs.query(
                                        { active: true, currentWindow: true },
                                        (tabs: any[]) => {
                                                if (
                                                        tabs.length > 0 &&
                                                        tabs[0].url
                                                ) {
                                                        const url = new URL(
                                                                tabs[0].url
                                                        )
                                                        const domain =
                                                                url.hostname
                                                        sendResponse({
                                                                domain: domain,
                                                        })
                                                } else {
                                                        sendResponse({
                                                                domain: null,
                                                        })
                                                }
                                        }
                                )
                                return true // 保持消息通道开放
                        }
                        return false
                }
        )
} else {
        console.warn('Browser API not available in this context')
}
