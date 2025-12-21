import { AIService } from './aiServiceBase'
import { OpenAIService } from './openaiService'
import { DeepSeekService } from './deepseekService'
import { MockAIService } from './mockService'
import type { AIConfig, AIProviderConfig } from './aiServiceBase'

/**
 * AI服务工厂
 */
export const AIServiceFactory = {
        /**
         * 创建AI服务实例
         */
        createService(
                provider: 'openai' | 'deepseek' | 'mock' = 'mock',
                config?: Partial<AIProviderConfig>
        ): AIService {
                switch (provider) {
                        case 'openai':
                                return new OpenAIService(config)
                        case 'deepseek':
                                return new DeepSeekService(config)
                        case 'mock':
                        default:
                                return new MockAIService()
                }
        },

        /**
         * 从存储中加载AI配置
         */
        async loadConfigFromStorage(): Promise<AIConfig> {
                try {
                        const result =
                                await browser.storage.local.get('configs:ai')
                        const config = result['configs:ai'] as
                                | AIConfig
                                | undefined
                        return config || { provider: 'mock', config: {} }
                } catch (error) {
                        console.warn('加载AI配置失败:', error)
                        return { provider: 'mock', config: {} }
                }
        },

        /**
         * 保存AI配置到存储
         */
        async saveConfigToStorage(config: AIConfig): Promise<void> {
                try {
                        await browser.storage.local.set({
                                'configs:ai': config,
                        })
                } catch (error) {
                        console.error('保存AI配置失败:', error)
                }
        },

        /**
         * 获取默认配置
         */
        getDefaultConfig(
                provider: 'openai' | 'deepseek'
        ): Partial<AIProviderConfig> {
                switch (provider) {
                        case 'openai':
                                return {
                                        endpoint: 'https://api.openai.com/v1/chat/completions',
                                        model: 'gpt-3.5-turbo',
                                        maxTokens: 1000,
                                        temperature: 0.7,
                                }
                        case 'deepseek':
                                return {
                                        endpoint: 'https://api.deepseek.com/v1/chat/completions',
                                        model: 'deepseek-chat',
                                        maxTokens: 1000,
                                        temperature: 0.7,
                                }
                        default:
                                return {}
                }
        },

        /**
         * 获取支持的提供者列表
         */
        getProviders(): Array<{
                id: 'openai' | 'deepseek' | 'mock'
                name: string
                description: string
        }> {
                return [
                        {
                                id: 'openai',
                                name: 'OpenAI',
                                description: 'OpenAI GPT 系列模型',
                        },
                        {
                                id: 'deepseek',
                                name: 'DeepSeek',
                                description:
                                        'DeepSeek AI 模型（兼容 OpenAI API）',
                        },
                        {
                                id: 'mock',
                                name: '模拟模式',
                                description: '用于开发和测试的模拟服务',
                        },
                ]
        },

        /**
         * 验证配置是否有效
         */
        validateConfig(config: AIConfig): boolean {
                if (config.provider === 'mock') {
                        return true
                }

                const aiConfig = config.config
                if (!aiConfig.apiKey) {
                        console.warn('API密钥缺失')
                        return false
                }

                if (!aiConfig.endpoint) {
                        console.warn('API端点缺失')
                        return false
                }

                return true
        },
} as const
