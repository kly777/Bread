import { Feature } from '../Feature'
import { render } from 'solid-js/web'
import { createSignal } from 'solid-js'
import AIWindow from './AIWindow'
import {
        getPageContent,
        highlightSelectedText,
        getPageStructure,
} from './aiUtils'
import { AIServiceFactory, PageAnalysis } from './aiService'


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

                const handleClose = () => {
                        this.off()
                }

                const handleSummarize = async () => {
                        await this.summarizePage(
                                setResult,
                                setIsLoading,
                                setIsError
                        )
                }

                const handleHighlight = () => {
                        const success = highlightSelectedText()
                        if (success) {
                                setResult('已成功标记选中内容！')
                                setIsError(false)
                        } else {
                                setResult('请先选择要标记的文本或元素。')
                                setIsError(true)
                        }
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
         * 总结页面内容
         */
        private async summarizePage(
                setResult: (result: string) => void,
                setIsLoading: (loading: boolean) => void,
                setIsError: (error: boolean) => void
        ) {
                console.log('开始总结页面内容')

                try {
                        setIsLoading(true)
                        setIsError(false)
                        setResult('正在分析页面内容...')

                        // 获取页面内容
                        const pageContent = getPageContent(4000)
                        const pageStructure = getPageStructure()

                        console.log('页面内容长度:', pageContent.length)
                        console.log('页面结构:', pageStructure)

                        // 创建AI服务
                        const aiService = AIServiceFactory.createService('mock')

                        // 分析页面内容
                        const analysis =
                                await aiService.analyzePage(pageContent)

                        // 格式化结果
                        const formattedResult = this.formatAnalysisResult(
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
