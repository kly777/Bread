import { Feature } from '../Feature'
import { render } from 'solid-js/web'
import { createSignal } from 'solid-js'
import AIWindow from './AIWindow'
import {
        getChatPageContent,
        highlightSelectedText,
        getPageStructure,
        estimateTokens,
} from './aiUtils'
import { AIServiceFactory } from './aiServiceFactory'
import { PageAnalysis } from './aiServiceBase'

/**
 * AI功能
 * 提供网页内容总结、重点标记等AI功能
 */
export class AIFeature extends Feature {
        readonly name = 'ai'
        readonly default = false

        private isActive = false
        private aiWindow: HTMLElement | null = null

        async init() {
                // 初始化AI功能
                console.log('AI功能初始化')

                // 加载AI配置
                await this.loadAIConfig()
        }

        async on() {
                if (this.isActive) return
                console.log('启用AI功能')

                // 创建AI浮动窗口
                this.createAIWindow()

                this.isActive = true
        }

        async off() {
                if (!this.isActive) return
                console.log('禁用AI功能')

                // 移除AI浮动窗口
                this.removeAIWindow()

                this.isActive = false
        }

        /**
         * 创建AI浮动窗口
         */
        private createAIWindow() {
                if (this.aiWindow) return

                // 创建容器元素
                const container = document.createElement('div')
                container.id = 'bread-ai-container'
                document.body.appendChild(container)

                // 创建SolidJS组件
                const [result, setResult] = createSignal('')
                const [isLoading, setIsLoading] = createSignal(false)
                const [isError, setIsError] = createSignal(false)
                const [chatMessages] = createSignal<
                        Array<{
                                role: 'user' | 'assistant'
                                content: string
                                timestamp: Date
                        }>
                >([])

                const handleClose = () => {
                        this.off()
                }

                const handleSummarize = async () => {
                        try {
                                setIsLoading(true)
                                setIsError(false)
                                setResult('正在分析页面内容...')

                                // 获取高质量的页面内容
                                const pageContent = getChatPageContent(4000)
                                console.log('页面内容长度:', pageContent.length)

                                // 加载AI配置并创建服务
                                const aiConfig =
                                        await AIServiceFactory.loadConfigFromStorage()
                                const aiService =
                                        AIServiceFactory.createService(
                                                aiConfig.provider,
                                                aiConfig.config
                                        )

                                // 分析页面内容
                                const analysis =
                                        await aiService.analyzePage(pageContent)

                                // 格式化结果
                                const pageStructure = getPageStructure()
                                const formattedResult =
                                        this.formatAnalysisResult(
                                                analysis,
                                                pageStructure
                                        )
                                setResult(formattedResult)
                                setIsError(false)
                        } catch (error) {
                                console.error('总结页面失败:', error)
                                setResult(
                                        `分析失败: ${error instanceof Error ? error.message : '未知错误'}`
                                )
                                setIsError(true)
                        } finally {
                                setIsLoading(false)
                        }
                }

                const handleHighlight = () => {
                        const success = highlightSelectedText()
                        if (success) {
                                setResult(
                                        '已成功标记选中内容！\n\nAI助手可以使用这些标记来更好地理解页面内容。'
                                )
                                setIsError(false)
                        } else {
                                setResult(
                                        '请先选择要标记的文本或元素。\n\n标记的内容将帮助AI更好地分析页面。'
                                )
                                setIsError(true)
                        }
                }

                const handleSendMessage = async (
                        message: string
                ): Promise<string> => {
                        try {
                                const aiConfig =
                                        await AIServiceFactory.loadConfigFromStorage()
                                const aiService =
                                        AIServiceFactory.createService(
                                                aiConfig.provider,
                                                aiConfig.config
                                        )

                                // 检查消息中是否包含页面内容
                                const hasPageContent =
                                        message.includes('当前页面内容:')

                                if (hasPageContent) {
                                        // 如果有页面内容，使用analyzePage进行分析
                                        const pageContentMatch =
                                                message.match(
                                                        /当前页面内容:\n([\s\S]*)/
                                                )
                                        if (pageContentMatch) {
                                                const pageContent =
                                                        pageContentMatch[1]
                                                const analysis =
                                                        await aiService.analyzePage(
                                                                pageContent
                                                        )

                                                // 格式化分析结果
                                                let response = `📊 **基于页面内容的分析结果**\n\n`
                                                response += `**总结**: ${analysis.summary}\n\n`

                                                if (
                                                        analysis.keyPoints
                                                                .length > 0
                                                ) {
                                                        response += `**关键点**:\n`
                                                        analysis.keyPoints.forEach(
                                                                (
                                                                        point,
                                                                        index
                                                                ) => {
                                                                        response += `${index + 1}. ${point}\n`
                                                                }
                                                        )
                                                        response += `\n`
                                                }

                                                if (
                                                        analysis
                                                                .suggestedHighlights
                                                                .length > 0
                                                ) {
                                                        response += `**建议标记的内容**:\n`
                                                        analysis.suggestedHighlights.forEach(
                                                                (highlight) => {
                                                                        const importanceIcon =
                                                                                highlight.importance ===
                                                                                'high'
                                                                                        ? '🔴'
                                                                                        : highlight.importance ===
                                                                                            'medium'
                                                                                          ? '🟡'
                                                                                          : '🟢'
                                                                        response += `${importanceIcon} **${highlight.text}**\n`
                                                                        response += `   📝 ${highlight.reason}\n`
                                                                }
                                                        )
                                                }

                                                response += `\n**阅读时间**: ${analysis.readingTime}分钟\n`
                                                response += `**复杂度**: ${
                                                        analysis.complexity ===
                                                        'simple'
                                                                ? '简单'
                                                                : analysis.complexity ===
                                                                    'medium'
                                                                  ? '中等'
                                                                  : '复杂'
                                                }\n`

                                                return response
                                        }
                                }

                                // 检查消息是否请求页面分析
                                const isPageAnalysisRequest =
                                        message
                                                .toLowerCase()
                                                .includes('分析页面') ||
                                        message
                                                .toLowerCase()
                                                .includes('总结页面') ||
                                        message
                                                .toLowerCase()
                                                .includes('page analysis') ||
                                        message
                                                .toLowerCase()
                                                .includes('summarize')

                                if (isPageAnalysisRequest) {
                                        // 获取高质量的页面内容并分析
                                        const pageContent =
                                                getChatPageContent(4000)
                                        const analysis =
                                                await aiService.analyzePage(
                                                        pageContent
                                                )

                                        // 格式化分析结果
                                        let response = `📊 **页面分析结果**\n\n`
                                        response += `**总结**: ${analysis.summary}\n\n`

                                        if (analysis.keyPoints.length > 0) {
                                                response += `**关键点**:\n`
                                                analysis.keyPoints.forEach(
                                                        (point, index) => {
                                                                response += `${index + 1}. ${point}\n`
                                                        }
                                                )
                                                response += `\n`
                                        }

                                        response += `**阅读时间**: ${analysis.readingTime}分钟\n`
                                        response += `**复杂度**: ${
                                                analysis.complexity === 'simple'
                                                        ? '简单'
                                                        : analysis.complexity ===
                                                            'medium'
                                                          ? '中等'
                                                          : '复杂'
                                        }\n`

                                        return response
                                }

                                // 普通对话，使用summarizeText
                                const response = await aiService.summarizeText(
                                        message,
                                        500
                                )
                                return response
                        } catch (error) {
                                console.error('AI对话失败:', error)
                                return `抱歉，AI对话时出错: ${error instanceof Error ? error.message : '未知错误'}`
                        }
                }

                const handleGetPageContent = (): string => {
                        // 获取高质量的页面内容，限制token数量
                        const pageContent = getChatPageContent(2000)
                        const pageStructure = getPageStructure()

                        let content = `当前页面内容:\n`
                        content += `页面标题: ${pageStructure.title}\n`
                        content += `页面URL: ${pageStructure.url}\n`
                        if (pageStructure.description) {
                                content += `页面描述: ${pageStructure.description}\n`
                        }
                        content += `提取内容长度: ${estimateTokens(pageContent)} tokens\n\n`
                        content += `页面主要内容:\n${pageContent}`

                        return content
                }

                render(
                        () => (
                                <AIWindow
                                        onClose={handleClose}
                                        onSummarize={handleSummarize}
                                        onHighlight={handleHighlight}
                                        result={result()}
                                        isLoading={isLoading()}
                                        isError={isError()}
                                        onSendMessage={handleSendMessage}
                                        onGetPageContent={handleGetPageContent}
                                        initialChatMessages={chatMessages()}
                                />
                        ),
                        container
                )

                this.aiWindow = container
        }

        /**
         * 移除AI浮动窗口
         */
        private removeAIWindow() {
                if (this.aiWindow) {
                        // 卸载SolidJS组件
                        const root = this.aiWindow
                        root.innerHTML = ''
                        root.remove()
                        this.aiWindow = null
                }
        }

        /**
         * 加载AI配置
         */
        private async loadAIConfig() {
                try {
                        const config =
                                await AIServiceFactory.loadConfigFromStorage()
                        console.log('AI配置加载成功:', config)
                } catch (error) {
                        console.warn('加载AI配置失败:', error)
                }
        }

        /**
         * 格式化分析结果
         */
        private formatAnalysisResult(
                analysis: PageAnalysis,
                pageStructure: {
                        title: string
                        url: string
                        description: string
                }
        ): string {
                const { title, url, description } = pageStructure

                let result = `📄 **页面分析报告**\n\n`
                result += `**页面标题**: ${title}\n`
                result += `**页面URL**: ${url}\n`
                if (description) {
                        result += `**页面描述**: ${description}\n`
                }
                result += `\n---\n\n`

                result += `📋 **内容总结**\n${analysis.summary}\n\n`

                if (analysis.keyPoints.length > 0) {
                        result += `🔑 **关键信息点**\n`
                        analysis.keyPoints.forEach((point, index) => {
                                result += `${index + 1}. ${point}\n`
                        })
                        result += `\n`
                }

                if (analysis.suggestedHighlights.length > 0) {
                        result += `🎯 **建议高亮内容**\n`
                        analysis.suggestedHighlights.forEach((highlight) => {
                                const importanceIcon =
                                        highlight.importance === 'high'
                                                ? '🔴'
                                                : highlight.importance ===
                                                    'medium'
                                                  ? '🟡'
                                                  : '🟢'
                                result += `${importanceIcon} **${highlight.text}**\n`
                                result += `   📝 ${highlight.reason}\n`
                        })
                        result += `\n`
                }

                result += `📊 **分析指标**\n`
                result += `• 预估阅读时间: ${analysis.readingTime} 分钟\n`
                result += `• 内容复杂度: ${
                        analysis.complexity === 'simple'
                                ? '简单'
                                : analysis.complexity === 'medium'
                                  ? '中等'
                                  : '复杂'
                }\n`

                return result
        }
}
