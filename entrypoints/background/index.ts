export default defineBackground(() => {
        console.log('Hello background!', { id: browser.runtime.id })

        browser.runtime.onMessage.addListener(
                (message, sender, sendResponse) => {
                        if (message.action === 'getDomain') {
                                browser.tabs.query(
                                        { active: true, currentWindow: true },
                                        (tabs) => {
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
                }
        )
})
