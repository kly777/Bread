import { AIService, AIProviderConfig, AIRequest, AIResponse, PageAnalysis, HighlightSuggestion } from './aiServiceBase'

/**
 * DeepSeek AI服务
 */
export class DeepSeekService extends AIService {
    private readonly defaultSystemPrompt = `你是一个专业的网页内容分析助手。你的任务是：
1. 分析网页内容并提供准确的总结
2. 提取关键信息点
3. 建议需要高亮的重要内容
4. 评估内容的复杂性和阅读时间

请用中文回复，保持专业、准确、简洁。`

    constructor(config: Partial<AIProviderConfig> = {}) {
        super({
            apiKey: config.apiKey || '',
            endpoint: config.endpoint || 'https://api.deepseek.com/v1/chat/completions',
            model: config.model || 'deepseek-chat',
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
                { role: 'system', content: this.defaultSystemPrompt },
                { role: 'user', content: prompt },
            ],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
        })

        return response.content
    }

    async extractKeyPoints(content: string): Promise<string[]> {
        const prompt = `请从以下内容中提取3-5个关键信息点：
${content}

请用中文回复，每个关键点用换行分隔。`

        const response = await this.generateResponse({
            messages: [
                { role: 'system', content: this.defaultSystemPrompt },
                { role: 'user', content: prompt },
            ],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
        })

        const lines = response.content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        return lines.slice(0, 5) // 最多返回5个关键点
    }

    async suggestHighlights(content: string): Promise<HighlightSuggestion[]> {
        const prompt = `请分析以下内容，建议需要高亮的重要部分：
${content}

请用JSON格式回复，包含一个数组，每个元素包含：
- text: 需要高亮的文本
- reason: 高亮原因
- importance: 重要性级别（high/medium/low）`

        const response = await this.generateResponse({
            messages: [
                { role: 'system', content: this.defaultSystemPrompt },
                { role: 'user', content: prompt },
            ],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
        })

        try {
            const jsonMatch = response.content.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]) as HighlightSuggestion[]
                // 验证重要性级别
                return parsed.map(item => ({
                    ...item,
                    importance: this.validateImportance(item.importance)
                }))
            }
        } catch (error) {
            console.error('解析高亮建议失败:', error)
        }

        // 如果解析失败，返回空数组
        return []
    }

    protected async generateResponse(request: AIRequest): Promise<AIResponse> {
        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
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
                throw new Error(`AI API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
            }

            const data = await response.json()
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content
                const usage = data.usage ? {
                    prompt_tokens: data.usage.prompt_tokens || 0,
                    completion_tokens: data.usage.completion_tokens || 0,
                    total_tokens: data.usage.total_tokens || 0,
                } : undefined

                return { content, usage }
            } else {
                throw new Error('AI API响应格式错误')
            }
        } catch (error) {
            console.error('AI请求失败:', error)
            return {
                content: `AI服务请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
                error: error instanceof Error ? error.message : '未知错误',
            }
        }
    }

    private validateComplexity(complexity: string): 'simple' | 'medium' | 'complex' {
        const normalized = complexity.toLowerCase()
        if (normalized.includes('简单') || normalized.includes('simple')) {
            return 'simple'
        } else if (normalized.includes('复杂') || normalized.includes('complex')) {
            return 'complex'
        } else {
            return 'medium'
        }
    }

    private validateImportance(importance: string): 'high' | 'medium' | 'low' {
        const normalized = importance.toLowerCase()
        if (normalized.includes('高') || normalized.includes('high')) {
            return 'high'
        } else if (normalized.includes('低') || normalized.includes('low')) {
            return 'low'
        } else {
            return 'medium'
        }
    }
}