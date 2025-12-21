console.log('Hello background!', { id: browser.runtime.id })

browser.runtime.onMessage.addListener(async (message) => {
        if (message.action === 'getDomain') {
                try {
                        const tabs = await browser.tabs.query({
                                active: true,
                                currentWindow: true,
                        })

                        if (tabs.length > 0 && tabs[0].url) {
                                const url = new URL(tabs[0].url)
                                const domain = url.hostname
                                return {
                                        domain: domain,
                                }
                        } else {
                                return {
                                        domain: null,
                                }
                        }
                } catch (error) {
                        console.error('获取域名失败:', error)
                        return {
                                domain: null,
                        }
                }
        }
        return false
})
