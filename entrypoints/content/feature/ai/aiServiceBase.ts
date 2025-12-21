/**
 * AI服务基础模块
 * 包含接口定义和抽象基类
 */

export interface AIProviderConfig {
        apiKey: string
        endpoint: string
        model: string
        maxTokens: number
        temperature: number
}

export interface AIConfig {
        provider: 'openai' | 'deepseek' | 'mock'
        config: Partial<AIProviderConfig>
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
