// 从存储中加载和 AI 配置
import type { AIConfig } from './types';

export interface ConfigStorage {
    get(key: string): Promise<Record<string, unknown>>;
}

export class ConfigLoader {
    private config: AIConfig | null = null;
    private storage: ConfigStorage;

    constructor(storage: ConfigStorage = browser.storage.local) {
        this.storage = storage;
    }

    async loadConfig(): Promise<AIConfig | null> {
        try {
            const result = await this.storage.get('configs:ai');
            const savedConfig = result['configs:ai'] as AIConfig | undefined;
            
            if (savedConfig) {
                this.config = savedConfig;
                return savedConfig;
            }
        } catch (error) {
            console.error('加载 AI 配置失败:', error);
        }
        
        return null;
    }

    getConfig(): AIConfig | null {
        return this.config;
    }

    isConfigured(): boolean {
        return !!this.config && !!this.config.config.apiKey;
    }

    setConfig(config: AIConfig): void {
        this.config = config;
    }

    clearConfig(): void {
        this.config = null;
    }
}