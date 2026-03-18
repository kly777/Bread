/**
 * AI 服务类型定义
 */

export interface AIConfig {
    provider: 'openai' | 'deepseek' | 'mock';
    config: {
        apiKey: string;
        endpoint: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
}

export interface AIMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    tool_call_id?: string;
}

export interface AIFunctionTool {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}

export interface AIResponse {
    content: string;
    tool_calls?: {
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: string;
        };
    }[];
}

export interface AIStreamChunk {
    type: 'content' | 'tool_call' | 'finish' | 'error';
    data: string | Record<string, unknown>;
    tool_call_id?: string;
    tool_name?: string;
}

export interface ToolCallDelta {
    index: number;
    id?: string;
    type?: 'function';
    function?: {
        name?: string;
        arguments?: string;
    };
}

export interface ParsedToolCall {
    id: string;
    name: string;
    arguments: string;
    index: number;
}

export interface AIProvider {
    invoke(messages: AIMessage[], tools?: AIFunctionTool[], abortSignal?: AbortSignal): Promise<AIResponse>;
    invokeStream(messages: AIMessage[], tools?: AIFunctionTool[], abortSignal?: AbortSignal): Promise<ReadableStream<AIStreamChunk>>;
    createSystemMessage(content: string): AIMessage;
    createUserMessage(content: string): AIMessage;
    createAssistantMessage(content: string): AIMessage;
}

export interface ConfigLoader {
    loadConfig(): Promise<AIConfig | null>;
    getConfig(): AIConfig | null;
    isConfigured(): boolean;
}