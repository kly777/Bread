import './anchor.css'

export function createAnchorLayout(): HTMLElement {
        // 创建容器元素
        const container = document.createElement('div')
        container.className = 'bread'

        // 状态变量
        let pageWordCount = 0
        let pageCharCount = 0
        let headingCount = 0
        let mediaCount = 0
        let selectedText = ''
        let scrollProgress = 0

        // 创建子元素用于显示
        const pageStatsSpan = document.createElement('span')
        const headingSpan = document.createElement('span')
        const mediaSpan = document.createElement('span')
        const selectionSpan = document.createElement('span')
        const scrollSpan = document.createElement('span')

        // 辅助函数：更新页面统计
        const calculatePageStats = () => {
                try {
                        const textContent = document.body.textContent || ''
                        pageWordCount = textContent
                                .split(/\s+/)
                                .filter(Boolean).length
                        pageCharCount = textContent.length
                        headingCount = document.querySelectorAll(
                                'h1, h2, h3, h4, h5, h6'
                        ).length
                        mediaCount =
                                document.querySelectorAll(
                                        'img, video, audio'
                                ).length
                } catch (e) {
                        console.error('Error calculating page stats:', e)
                }
        }

        // 辅助函数：获取选中文本
        const getSelectionText = () => {
                const selection = window.getSelection?.()
                if (selection && selection.toString().trim() !== '') {
                        selectedText = selection.toString()
                } else {
                        selectedText = ''
                }
        }

        // 辅助函数：更新滚动进度
        const updateScrollProgress = () => {
                const scrollTop = window.scrollY
                const docHeight = document.documentElement.scrollHeight
                const winHeight = window.innerHeight
                const maxScroll = docHeight - winHeight
                scrollProgress =
                        maxScroll <= 0 ? 0 : (scrollTop / maxScroll) * 100
        }

        // 辅助函数：更新 UI
        const updateUI = () => {
                // 页面统计
                if (pageWordCount > 0) {
                        pageStatsSpan.textContent = `pw: ${(
                                pageWordCount / 1000
                        ).toFixed(
                                1
                        )}k | pc: ${(pageCharCount / 1000).toFixed(1)}k |`
                        pageStatsSpan.style.display = 'inline-block'
                } else {
                        pageStatsSpan.style.display = 'none'
                }

                // 标题数量
                if (headingCount > 0) {
                        headingSpan.textContent = ` h: ${headingCount} |`
                        headingSpan.style.display = 'inline-block'
                } else {
                        headingSpan.style.display = 'none'
                }

                // 媒体数量
                if (mediaCount > 0) {
                        mediaSpan.textContent = ` m: ${mediaCount} |`
                        mediaSpan.style.display = 'inline-block'
                } else {
                        mediaSpan.style.display = 'none'
                }

                // 选中文本
                if (selectedText) {
                        const lines = selectedText.split('\n').length
                        const words = selectedText.split(' ').length
                        const chars = selectedText.length
                        selectionSpan.textContent = ` p: ${lines} | w: ${words} | c: ${chars} |`
                        selectionSpan.style.display = 'inline-block'
                } else {
                        selectionSpan.style.display = 'none'
                }

                // 滚动进度
                scrollSpan.textContent = ` ${scrollProgress.toFixed(0)}% `
        }

        // 初始化
        calculatePageStats()
        updateScrollProgress()
        updateUI()

        // 添加子元素
        container.appendChild(pageStatsSpan)
        container.appendChild(headingSpan)
        container.appendChild(mediaSpan)
        container.appendChild(selectionSpan)
        container.appendChild(scrollSpan)

        // 监听 DOM 变化
        const observer = new MutationObserver(() => {
                observer.disconnect()
                calculatePageStats()
                updateUI()
                observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        characterData: true,
                })
        })
        observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
        })

        // 监听选中文本变化（使用 mousemove 作为简单检测）
        const handleSelectionChange = () => {
                getSelectionText()
                updateUI()
        }
        document.addEventListener('mousemove', handleSelectionChange)

        // 监听滚动
        const handleScroll = () => {
                updateScrollProgress()
                updateUI()
        }
        window.addEventListener('scroll', handleScroll)

        // 清理函数（如果需要）
        const cleanup = () => {
                observer.disconnect()
                document.removeEventListener('mousemove', handleSelectionChange)
                window.removeEventListener('scroll', handleScroll)
        }

        // 将 cleanup 附加到容器上，以便外部可以调用
        ;(container as HTMLElement & { cleanup?: () => void }).cleanup = cleanup

        return container
}
