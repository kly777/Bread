import { AIService, AIProviderConfig, AIRequest, AIResponse, PageAnalysis, HighlightSuggestion } from './aiServiceBase'

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
            endpoint: config.endpoint || 'https://api.openai.com/v1/chat/completions',
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
                { role: 'system', content: this.defaultSystemPrompt },
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
                    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
                    suggestedHighlights: Array.isArray(parsed.suggestedHighlights) ? parsed.suggestedHighlights : [],
                    readingTime: parsed.readingTime || 5,
                    complexity: this.validateComplexity(parsed.complexity),
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
                { role: 'system', content: '你是一个专业的文本总结助手。' },
                { role: 'user', content: prompt },
            ],
            max_tokens: Math.min(maxLength * 2, this.config.maxTokens),
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
                { role: 'system', content: '你是一个关键信息提取专家。' },
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
                (trimmed.match(/^[•\-*]\s/) || trimmed.match(/^\d+\.\s/))
            )
        })

        if (lines.length > 0) {
            return lines.map((line) => line.replace(/^[•\-*]\s|^\d+\.\s/, '').trim())
        }

        // 如果没有列表格式，尝试按句子分割
        return response.content
            .split(/[。！？]/)
            .filter((sentence) => sentence.trim().length > 10)
            .slice(0, 5)
    }

    async suggestHighlights(content: string): Promise<HighlightSuggestion[]> {
        const prompt = `请分析以下内容，建议3-5个需要高亮的重要部分：

${content}

对于每个建议，请提供：
1. 需要高亮的文本（尽量简短）
2. 高亮的理由
3. 重要性等级（high/medium/low）

请用JSON格式回复，包含一个suggestions数组。`

        const response = await this.generateResponse({
            messages: [
                { role: 'system', content: '你是一个内容高亮建议专家。' },
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
                    return parsed.suggestions.map((s: { text?: string; reason?: string; importance?: string }) => ({
                        text: s.text || '',
                        reason: s.reason || '',
                        importance: this.validateImportance(s.importance || 'medium'),
                    }))
                }
            }
        } catch (error) {
            console.error('解析高亮建议失败:', error)
        }

        // 默认返回空数组
        return []
    }

    protected async generateResponse(request: AIRequest): Promise<AIResponse> {
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
                    max_tokens: request.max_tokens || this.config.maxTokens,
                    temperature: request.temperature || this.config.temperature,
                    stream: false,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`AI API请求失败: ${response.status} - ${errorText}`)
            }

            const data = await response.json()

            return {
                content: data.choices?.[0]?.message?.content || '无响应内容',
                usage: data.usage
                    ? {
                          prompt_tokens: data.usage.prompt_tokens,
                          completion_tokens: data.usage.completion_tokens,
                          total_tokens: data.usage.total_tokens,
                      }
                    : undefined,
            }
        } catch (error) {
            console.error('AI请求错误:', error)
            return {
                content: 'AI服务暂时不可用，请稍后重试。',
                error: error instanceof Error ? error.message : '未知错误',
            }
        }
    }

    private validateComplexity(complexity: string): 'simple' | 'medium' | 'complex' {
        const normalized = complexity.toLowerCase()
        if (normalized.includes('简单') || normalized === 'simple') return 'simple'
        if (normalized.includes('复杂') || normalized === 'complex') return 'complex'
        return 'medium'
    }

    private validateImportance(importance: string): 'high' | 'medium' | 'low' {
        const normalized = importance.toLowerCase()
        if (normalized === 'high' || normalized.includes('高')) return 'high'
        if (normalized === 'low' || normalized.includes('低')) return 'low'
        return 'medium'
    }
}