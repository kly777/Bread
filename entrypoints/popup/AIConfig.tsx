import { Component, createSignal, onMount, Show } from 'solid-js'

interface AIConfigProps {
        onConfigChange?: (config: {
                provider: 'openai' | 'deepseek' | 'mock'
                config: {
                        apiKey: string
                        endpoint: string
                        model: string
                        maxTokens: number
                        temperature: number
                }
        }) => void
}

interface AIProvider {
        id: 'openai' | 'deepseek' | 'mock'
        name: string
        description: string
        defaultEndpoint: string
        defaultModel: string
}

const AI_PROVIDERS: AIProvider[] = [
        {
                id: 'openai',
                name: 'OpenAI',
                description: 'OpenAI GPT 系列模型 (GPT-3.5, GPT-4 等)',
                defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
                defaultModel: 'gpt-3.5-turbo',
        },
        {
                id: 'deepseek',
                name: 'DeepSeek',
                description: 'DeepSeek AI 模型 (兼容 OpenAI API)',
                defaultEndpoint: 'https://api.deepseek.com/v1/chat/completions',
                defaultModel: 'deepseek-chat',
        },
        {
                id: 'mock',
                name: '模拟模式',
                description: '用于开发和测试的模拟服务',
                defaultEndpoint: 'mock-endpoint',
                defaultModel: 'mock-model',
        },
]

const AIConfig: Component<AIConfigProps> = (props) => {
        const [selectedProvider, setSelectedProvider] =
                createSignal<AIProvider['id']>('mock')
        const [apiKey, setApiKey] = createSignal('')
        const [endpoint, setEndpoint] = createSignal('')
        const [model, setModel] = createSignal('')
        const [maxTokens, setMaxTokens] = createSignal(1000)
        const [temperature, setTemperature] = createSignal(0.7)
        const [isLoading, setIsLoading] = createSignal(false)
        const [saveStatus, setSaveStatus] = createSignal<
                'idle' | 'saving' | 'success' | 'error'
        >('idle')

        // 加载保存的配置
        onMount(async () => {
                try {
                        setIsLoading(true)
                        const result =
                                await browser.storage.local.get('configs:ai')
                        const savedConfig = result['configs:ai']

                        if (savedConfig) {
                                setSelectedProvider(
                                        savedConfig.provider || 'mock'
                                )

                                if (savedConfig.config) {
                                        setApiKey(
                                                savedConfig.config.apiKey || ''
                                        )
                                        setEndpoint(
                                                savedConfig.config.endpoint ||
                                                        ''
                                        )
                                        setModel(savedConfig.config.model || '')
                                        setMaxTokens(
                                                savedConfig.config.maxTokens ||
                                                        1000
                                        )
                                        setTemperature(
                                                savedConfig.config
                                                        .temperature || 0.7
                                        )
                                }
                        }
                } catch (error) {
                        console.error('加载AI配置失败:', error)
                } finally {
                        setIsLoading(false)
                }
        })

        // 获取当前选中的提供者
        const getCurrentProvider = () => {
                return (
                        AI_PROVIDERS.find((p) => p.id === selectedProvider()) ||
                        AI_PROVIDERS[0]
                )
        }

        // 重置为默认配置
        const resetToDefaults = () => {
                const provider = getCurrentProvider()
                setEndpoint(provider.defaultEndpoint)
                setModel(provider.defaultModel)
                setMaxTokens(1000)
                setTemperature(0.7)
        }

        // 保存配置
        const saveConfig = async () => {
                try {
                        setSaveStatus('saving')

                        const config = {
                                provider: selectedProvider(),
                                config: {
                                        apiKey: apiKey(),
                                        endpoint:
                                                endpoint() ||
                                                getCurrentProvider()
                                                        .defaultEndpoint,
                                        model:
                                                model() ||
                                                getCurrentProvider()
                                                        .defaultModel,
                                        maxTokens: maxTokens(),
                                        temperature: temperature(),
                                },
                        }

                        await browser.storage.local.set({
                                'configs:ai': config,
                        })

                        // 通知父组件配置已更改
                        if (props.onConfigChange) {
                                props.onConfigChange(config)
                        }

                        setSaveStatus('success')

                        // 3秒后重置状态
                        setTimeout(() => setSaveStatus('idle'), 3000)
                } catch (error) {
                        console.error('保存AI配置失败:', error)
                        setSaveStatus('error')

                        // 3秒后重置状态
                        setTimeout(() => setSaveStatus('idle'), 3000)
                }
        }

        // 验证配置
        const validateConfig = () => {
                if (selectedProvider() === 'mock') {
                        return true
                }

                if (!apiKey().trim()) {
                        return false
                }

                if (!endpoint().trim()) {
                        return false
                }

                if (!model().trim()) {
                        return false
                }

                return true
        }

        return (
                <div class="ai-config">
                        <div class="ai-config-header">
                                <h3>AI服务配置</h3>
                                <div class="ai-config-status">
                                        <Show when={saveStatus() === 'saving'}>
                                                <span class="ai-status-saving">
                                                        保存中...
                                                </span>
                                        </Show>
                                        <Show when={saveStatus() === 'success'}>
                                                <span class="ai-status-success">
                                                        保存成功
                                                </span>
                                        </Show>
                                        <Show when={saveStatus() === 'error'}>
                                                <span class="ai-status-error">
                                                        保存失败
                                                </span>
                                        </Show>
                                </div>
                        </div>

                        <Show when={isLoading()}>
                                <div class="ai-config-loading">
                                        加载配置中...
                                </div>
                        </Show>

                        <Show when={!isLoading()}>
                                {/* 提供者选择 */}
                                <div class="ai-config-section">
                                        <label class="ai-config-label">
                                                AI服务提供者
                                        </label>
                                        <div class="ai-providers">
                                                {AI_PROVIDERS.map(
                                                        (provider) => (
                                                                <div
                                                                        class="ai-provider"
                                                                        classList={{
                                                                                'ai-provider-selected':
                                                                                        selectedProvider() ===
                                                                                        provider.id,
                                                                        }}
                                                                        onClick={() => {
                                                                                setSelectedProvider(
                                                                                        provider.id
                                                                                )
                                                                                // 切换到新提供者时重置为默认配置
                                                                                setEndpoint(
                                                                                        provider.defaultEndpoint
                                                                                )
                                                                                setModel(
                                                                                        provider.defaultModel
                                                                                )
                                                                        }}
                                                                >
                                                                        <div class="ai-provider-name">
                                                                                {
                                                                                        provider.name
                                                                                }
                                                                        </div>
                                                                        <div class="ai-provider-description">
                                                                                {
                                                                                        provider.description
                                                                                }
                                                                        </div>
                                                                </div>
                                                        )
                                                )}
                                        </div>
                                </div>

                                {/* API配置 */}
                                <Show when={selectedProvider() !== 'mock'}>
                                        <div class="ai-config-section">
                                                <label class="ai-config-label">
                                                        API密钥
                                                </label>
                                                <input
                                                        type="password"
                                                        class="ai-config-input"
                                                        placeholder="输入API密钥"
                                                        value={apiKey()}
                                                        onInput={(e) =>
                                                                setApiKey(
                                                                        e
                                                                                .currentTarget
                                                                                .value
                                                                )
                                                        }
                                                />
                                                <div class="ai-config-hint">
                                                        您的API密钥仅保存在本地浏览器中，不会发送到任何服务器。
                                                </div>
                                        </div>

                                        <div class="ai-config-section">
                                                <label class="ai-config-label">
                                                        API端点
                                                </label>
                                                <input
                                                        type="text"
                                                        class="ai-config-input"
                                                        placeholder="API端点URL"
                                                        value={endpoint()}
                                                        onInput={(e) =>
                                                                setEndpoint(
                                                                        e
                                                                                .currentTarget
                                                                                .value
                                                                )
                                                        }
                                                />
                                                <div class="ai-config-hint">
                                                        默认:{' '}
                                                        {
                                                                getCurrentProvider()
                                                                        .defaultEndpoint
                                                        }
                                                </div>
                                        </div>

                                        <div class="ai-config-section">
                                                <label class="ai-config-label">
                                                        模型名称
                                                </label>
                                                <input
                                                        type="text"
                                                        class="ai-config-input"
                                                        placeholder="模型名称"
                                                        value={model()}
                                                        onInput={(e) =>
                                                                setModel(
                                                                        e
                                                                                .currentTarget
                                                                                .value
                                                                )
                                                        }
                                                />
                                                <div class="ai-config-hint">
                                                        默认:{' '}
                                                        {
                                                                getCurrentProvider()
                                                                        .defaultModel
                                                        }
                                                </div>
                                        </div>

                                        <div class="ai-config-grid">
                                                <div class="ai-config-section">
                                                        <label class="ai-config-label">
                                                                最大Token数
                                                        </label>
                                                        <input
                                                                type="number"
                                                                class="ai-config-input"
                                                                min="100"
                                                                max="4000"
                                                                step="100"
                                                                value={maxTokens()}
                                                                onInput={(e) =>
                                                                        setMaxTokens(
                                                                                parseInt(
                                                                                        e
                                                                                                .currentTarget
                                                                                                .value
                                                                                ) ||
                                                                                        1000
                                                                        )
                                                                }
                                                        />
                                                        <div class="ai-config-hint">
                                                                控制响应长度
                                                                (100-4000)
                                                        </div>
                                                </div>

                                                <div class="ai-config-section">
                                                        <label class="ai-config-label">
                                                                温度
                                                        </label>
                                                        <input
                                                                type="number"
                                                                class="ai-config-input"
                                                                min="0"
                                                                max="2"
                                                                step="0.1"
                                                                value={temperature()}
                                                                onInput={(e) =>
                                                                        setTemperature(
                                                                                parseFloat(
                                                                                        e
                                                                                                .currentTarget
                                                                                                .value
                                                                                ) ||
                                                                                        0.7
                                                                        )
                                                                }
                                                        />
                                                        <div class="ai-config-hint">
                                                                控制随机性 (0-2)
                                                        </div>
                                                </div>
                                        </div>
                                </Show>

                                {/* 模拟模式提示 */}
                                <Show when={selectedProvider() === 'mock'}>
                                        <div class="ai-config-mock-info">
                                                <div class="ai-config-mock-icon">
                                                        🎭
                                                </div>
                                                <div class="ai-config-mock-text">
                                                        <strong>
                                                                模拟模式已启用
                                                        </strong>
                                                        <p>
                                                                此模式用于开发和测试，无需API密钥即可体验AI功能。
                                                        </p>
                                                        <p>
                                                                要使用真实的AI服务，请选择OpenAI或DeepSeek提供者。
                                                        </p>
                                                </div>
                                        </div>
                                </Show>

                                {/* 操作按钮 */}
                                <div class="ai-config-actions">
                                        <Show
                                                when={
                                                        selectedProvider() !==
                                                        'mock'
                                                }
                                        >
                                                <button
                                                        class="ai-config-btn ai-config-btn-secondary"
                                                        onClick={
                                                                resetToDefaults
                                                        }
                                                >
                                                        重置为默认
                                                </button>
                                        </Show>
                                        <button
                                                class="ai-config-btn ai-config-btn-primary"
                                                onClick={saveConfig}
                                                disabled={
                                                        !validateConfig() ||
                                                        saveStatus() ===
                                                                'saving'
                                                }
                                        >
                                                {saveStatus() === 'saving'
                                                        ? '保存中...'
                                                        : '保存配置'}
                                        </button>
                                </div>

                                {/* DeepSeek特别提示 */}
                                <Show when={selectedProvider() === 'deepseek'}>
                                        <div class="ai-config-tip">
                                                <strong>
                                                        DeepSeek使用提示:
                                                </strong>
                                                <ul>
                                                        <li>
                                                                DeepSeek
                                                                API兼容OpenAI格式，可直接使用
                                                        </li>
                                                        <li>
                                                                需要申请API密钥:{' '}
                                                                <a
                                                                        href="https://platform.deepseek.com/"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                >
                                                                        DeepSeek平台
                                                                </a>
                                                        </li>
                                                        <li>
                                                                支持模型:
                                                                deepseek-chat
                                                                (非思考模式),
                                                                deepseek-reasoner
                                                                (思考模式)
                                                        </li>
                                                        <li>
                                                                也可使用基础URL:
                                                                https://api.deepseek.com
                                                                (不带/v1)
                                                        </li>
                                                </ul>
                                        </div>
                                </Show>
                        </Show>
                </div>
        )
}

export default AIConfig
