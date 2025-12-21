import {
        AIService,
        AIResponse,
        PageAnalysis,
        HighlightSuggestion,
} from './aiServiceBase'

/**
 * 模拟AI服务，用于开发和测试
 */
export class MockAIService extends AIService {
        constructor() {
                super({
                        apiKey: 'mock-key',
                        endpoint: 'mock-endpoint',
                        model: 'mock-model',
                        maxTokens: 1000,
                        temperature: 0.7,
                })
        }

        async analyzePage(content: string): Promise<PageAnalysis> {
                // 模拟处理延迟
                await new Promise((resolve) => setTimeout(resolve, 1000))

                const contentPreview = content.substring(0, 100) + '...'

                return {
                        summary: `这是对以下内容的分析总结：${contentPreview}`,
                        keyPoints: [
                                '这是一个模拟的关键点1',
                                '这是一个模拟的关键点2',
                                '这是一个模拟的关键点3',
                        ],
                        suggestedHighlights: [
                                {
                                        text: '重要概念',
                                        reason: '这是页面中的核心概念',
                                        importance: 'high',
                                },
                                {
                                        text: '关键数据',
                                        reason: '包含重要的统计信息',
                                        importance: 'medium',
                                },
                        ],
                        readingTime: Math.ceil(content.length / 1000), // 每1000字符1分钟
                        complexity:
                                content.length > 5000
                                        ? 'complex'
                                        : content.length > 2000
                                          ? 'medium'
                                          : 'simple',
                }
        }

        async summarizeText(content: string, maxLength = 500): Promise<string> {
                await new Promise((resolve) => setTimeout(resolve, 800))

                const preview = content.substring(
                        0,
                        Math.min(200, content.length)
                )
                return `这是内容的总结：${preview}...（总结长度限制：${maxLength}字）`
        }

        async extractKeyPoints(content: string): Promise<string[]> {
                await new Promise((resolve) => setTimeout(resolve, 600))

                const contentPreview =
                        content.substring(0, 50) +
                        (content.length > 50 ? '...' : '')

                return [
                        `模拟关键点1：${contentPreview}中的重要信息`,
                        '模拟关键点2：核心概念',
                        '模拟关键点3：关键数据',
                        '模拟关键点4：主要结论',
                ]
        }

        async suggestHighlights(
                content: string
        ): Promise<HighlightSuggestion[]> {
                await new Promise((resolve) => setTimeout(resolve, 700))

                const contentPreview =
                        content.substring(0, 30) +
                        (content.length > 30 ? '...' : '')

                return [
                        {
                                text: contentPreview,
                                reason: '包含重要定义和概念',
                                importance: 'high',
                        },
                        {
                                text: '数据展示',
                                reason: '展示关键统计信息',
                                importance: 'medium',
                        },
                        {
                                text: '结论段落',
                                reason: '总结主要发现',
                                importance: 'high',
                        },
                ]
        }

        protected async generateResponse(): Promise<AIResponse> {
                await new Promise((resolve) => setTimeout(resolve, 500))

                return {
                        content: '这是模拟AI的响应。实际使用需要配置真实的AI API。',
                        usage: {
                                prompt_tokens: 100,
                                completion_tokens: 50,
                                total_tokens: 150,
                        },
                }
        }
}
