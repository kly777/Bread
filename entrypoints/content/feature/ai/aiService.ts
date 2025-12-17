/**
 * AI服务模块
 * 负责与AI API的通信和集成
 */

export interface AIProviderConfig {
        apiKey: string
        endpoint: string
        model: string
        maxTokens: number
        temperature: number
}

export interface AIMessage {
        role: 'system' | 'user' | 'assistant'
        content: string
}

export interface AIRequest {
        messages: AIMessage[]
        max_tokens?: number
        temperature?: number
        stream?: boolean
}

export interface AIResponse {
        content: string
        usage?: {
                prompt_tokens: number
                completion_tokens: number
                total_tokens: number
        }
        error?: string
}

export interface HighlightSuggestion {
        text: string
        reason: string
        importance: 'high' | 'medium' | 'low'
}

export interface PageAnalysis {
        summary: string
        keyPoints: string[]
        suggestedHighlights: HighlightSuggestion[]
        readingTime: number
        complexity: 'simple' | 'medium' | 'complex'
}

/**
 * AI服务基类
 */
export abstract class AIService {
        protected config: AIProviderConfig

        constructor(config: AIProviderConfig) {
                this.config = config
        }

        /**
         * 分析网页内容
         */
        abstract analyzePage(content: string): Promise<PageAnalysis>

        /**
         * 总结文本内容
         */
        abstract summarizeText(
                content: string,
                maxLength?: number
        ): Promise<string>

        /**
         * 提取关键信息
         */
        abstract extractKeyPoints(content: string): Promise<string[]>

        /**
         * 建议高亮内容
         */
        abstract suggestHighlights(
                content: string
        ): Promise<HighlightSuggestion[]>

        /**
         * 生成响应
         */
        protected abstract generateResponse(
                request: AIRequest
        ): Promise<AIResponse>

        /**
         * 验证配置
         */
        protected validateConfig(): boolean {
                return !!this.config.apiKey && !!this.config.endpoint
        }
}

/**
 * OpenAI服务实现
 */
export class OpenAIService extends AIService {
        private readonly defaultSystemPrompt = `你是一个专业的网页内容分析助手。你的任务是：
1. 分析网页内容并提供准确的总结
2. 提取关键信息点
3. 建议需要高亮的重要内容
4. 评估内容的复杂性和阅读时间

请用中文回复，保持专业、准确、简洁。`

        constructor(config: Partial<AIProviderConfig> = {}) {
                super({
                        apiKey: config.apiKey || '',
                        endpoint:
                                config.endpoint ||
                                'https://api.openai.com/v1/chat/completions',
                        model: config.model || 'gpt-3.5-turbo',
                        maxTokens: config.maxTokens || 1000,
                        temperature: config.temperature || 0.7,
                })
        }

        async analyzePage(content: string): Promise<PageAnalysis> {
                const prompt = `请分析以下网页内容：

${content}

请提供：
1. 简要总结（不超过200字）
2. 3-5个关键信息点
3. 建议高亮的重要内容和原因
4. 预估阅读时间（分钟）
5. 内容复杂度（简单/中等/复杂）

请用JSON格式回复，包含以下字段：
- summary: 总结
- keyPoints: 关键信息点数组
- suggestedHighlights: 建议高亮的内容数组，每个包含text、reason、importance
- readingTime: 阅读时间（分钟）
- complexity: 复杂度`

                const response = await this.generateResponse({
                        messages: [
                                {
                                        role: 'system',
                                        content: this.defaultSystemPrompt,
                                },
                                { role: 'user', content: prompt },
                        ],
                        max_tokens: this.config.maxTokens,
                        temperature: this.config.temperature,
                })

                try {
                        // 尝试解析JSON响应
                        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
                        if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[0])
                                return {
                                        summary: parsed.summary || '',
                                        keyPoints: Array.isArray(
                                                parsed.keyPoints
                                        )
                                                ? parsed.keyPoints
                                                : [],
                                        suggestedHighlights: Array.isArray(
                                                parsed.suggestedHighlights
                                        )
                                                ? parsed.suggestedHighlights
                                                : [],
                                        readingTime: parsed.readingTime || 5,
                                        complexity: this.validateComplexity(
                                                parsed.complexity
                                        ),
                                }
                        }

                        // 如果JSON解析失败，返回默认结构
                        return {
                                summary: response.content,
                                keyPoints: [],
                                suggestedHighlights: [],
                                readingTime: 5,
                                complexity: 'medium',
                        }
                } catch (error) {
                        console.error('解析AI响应失败:', error)
                        return {
                                summary: response.content,
                                keyPoints: [],
                                suggestedHighlights: [],
                                readingTime: 5,
                                complexity: 'medium',
                        }
                }
        }

        async summarizeText(content: string, maxLength = 500): Promise<string> {
                const prompt = `请用中文总结以下内容，总结长度不超过${maxLength}字：

${content}`

                const response = await this.generateResponse({
                        messages: [
                                {
                                        role: 'system',
                                        content: '你是一个专业的文本总结助手。',
                                },
                                { role: 'user', content: prompt },
                        ],
                        max_tokens: Math.min(
                                maxLength * 2,
                                this.config.maxTokens
                        ),
                        temperature: 0.5, // 更低的温度以获得更确定的总结
                })

                return response.content
        }

        async extractKeyPoints(content: string): Promise<string[]> {
                const prompt = `请从以下内容中提取3-5个关键信息点，用中文回复：

${content}

请用列表格式回复，每个关键点一行。`

                const response = await this.generateResponse({
                        messages: [
                                {
                                        role: 'system',
                                        content: '你是一个关键信息提取专家。',
                                },
                                { role: 'user', content: prompt },
                        ],
                        max_tokens: 300,
                        temperature: 0.3,
                })

                // 解析列表格式的响应
                const lines = response.content.split('\n').filter((line) => {
                        const trimmed = line.trim()
                        return (
                                trimmed.length > 0 &&
                                !trimmed.startsWith('```') &&
                                (trimmed.match(/^[•\-*]\s/) ||
                                        trimmed.match(/^\d+\.\s/))
                        )
                })

                if (lines.length > 0) {
                        return lines.map((line) =>
                                line.replace(/^[•\-*]\s|^\d+\.\s/, '').trim()
                        )
                }

                // 如果没有列表格式，尝试按句子分割
                return response.content
                        .split(/[。！？]/)
                        .filter((sentence) => sentence.trim().length > 10)
                        .slice(0, 5)
        }

        async suggestHighlights(
                content: string
        ): Promise<HighlightSuggestion[]> {
                const prompt = `请分析以下内容，建议3-5个需要高亮的重要部分：

${content}

对于每个建议，请提供：
1. 需要高亮的文本（尽量简短）
2. 高亮的理由
3. 重要性等级（high/medium/low）

请用JSON格式回复，包含一个suggestions数组。`

                const response = await this.generateResponse({
                        messages: [
                                {
                                        role: 'system',
                                        content: '你是一个内容高亮建议专家。',
                                },
                                { role: 'user', content: prompt },
                        ],
                        max_tokens: 500,
                        temperature: 0.4,
                })

                try {
                        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
                        if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[0])
                                if (Array.isArray(parsed.suggestions)) {
                                        return parsed.suggestions.map(
                                                (s: {
                                                        text?: string
                                                        reason?: string
                                                        importance?: string
                                                }) => ({
                                                        text: s.text || '',
                                                        reason: s.reason || '',
                                                        importance: this.validateImportance(
                                                                s.importance ||
                                                                        'medium'
                                                        ),
                                                })
                                        )
                                }
                        }
                } catch (error) {
                        console.error('解析高亮建议失败:', error)
                }

                // 默认返回空数组
                return []
        }

        protected async generateResponse(
                request: AIRequest
        ): Promise<AIResponse> {
                if (!this.validateConfig()) {
                        throw new Error('AI配置无效，请检查API密钥和端点')
                }

                try {
                        const response = await fetch(this.config.endpoint, {
                                method: 'POST',
                                headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${this.config.apiKey}`,
                                },
                                body: JSON.stringify({
                                        model: this.config.model,
                                        messages: request.messages,
                                        max_tokens:
                                                request.max_tokens ||
                                                this.config.maxTokens,
                                        temperature:
                                                request.temperature ||
                                                this.config.temperature,
                                        stream: false,
                                }),
                        })

                        if (!response.ok) {
                                const errorText = await response.text()
                                throw new Error(
                                        `AI API请求失败: ${response.status} - ${errorText}`
                                )
                        }

                        const data = await response.json()

                        return {
                                content:
                                        data.choices?.[0]?.message?.content ||
                                        '无响应内容',
                                usage: data.usage
                                        ? {
                                                  prompt_tokens:
                                                          data.usage
                                                                  .prompt_tokens,
                                                  completion_tokens:
                                                          data.usage
                                                                  .completion_tokens,
                                                  total_tokens:
                                                          data.usage
                                                                  .total_tokens,
                                          }
                                        : undefined,
                        }
                } catch (error) {
                        console.error('AI请求错误:', error)
                        return {
                                content: 'AI服务暂时不可用，请稍后重试。',
                                error:
                                        error instanceof Error
                                                ? error.message
                                                : '未知错误',
                        }
                }
        }

        private validateComplexity(
                complexity: string
        ): 'simple' | 'medium' | 'complex' {
                const normalized = complexity.toLowerCase()
                if (normalized.includes('简单') || normalized === 'simple')
                        return 'simple'
                if (normalized.includes('复杂') || normalized === 'complex')
                        return 'complex'
                return 'medium'
        }

        private validateImportance(
                importance: string
        ): 'high' | 'medium' | 'low' {
                const normalized = importance.toLowerCase()
                if (normalized === 'high' || normalized.includes('高'))
                        return 'high'
                if (normalized === 'low' || normalized.includes('低'))
                        return 'low'
                return 'medium'
        }
}

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

        async extractKeyPoints(): Promise<string[]> {
                await new Promise((resolve) => setTimeout(resolve, 600))

                return [
                        '模拟关键点1：重要信息',
                        '模拟关键点2：核心概念',
                        '模拟关键点3：关键数据',
                        '模拟关键点4：主要结论',
                ]
        }

        async suggestHighlights(): Promise<HighlightSuggestion[]> {
                await new Promise((resolve) => setTimeout(resolve, 700))

                return [
                        {
                                text: '定义部分',
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

/**
 * AI服务工厂
 */
export const AIServiceFactory = {
        createService(
                provider: 'openai' | 'mock' = 'mock',
                config?: Partial<AIProviderConfig>
        ): AIService {
                switch (provider) {
                        case 'openai':
                                return new OpenAIService(config)
                        case 'mock':
                        default:
                                return new MockAIService()
                }
        },

        /**
         * 从存储中加载AI配置
         */
        async loadConfigFromStorage(): Promise<Partial<AIProviderConfig>> {
                try {
                        const result =
                                await breadStorage.getItem<
                                        Partial<AIProviderConfig>
                                >('local:ai_config')
                        return result || {}
                } catch (error) {
                        console.warn('加载AI配置失败:', error)
                        return {}
                }
        },

        /**
         * 保存AI配置到存储
         */
        async saveConfigToStorage(
                config: Partial<AIProviderConfig>
        ): Promise<void> {
                try {
                        await breadStorage.setItem('local:ai_config', config)
                } catch (error) {
                        console.error('保存AI配置失败:', error)
                }
        },
} as const
