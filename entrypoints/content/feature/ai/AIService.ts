import type {
	AIConfig,
	AIMessage,
	AIFunctionTool,
	AIResponse,
	AIStreamChunk,
	AIProvider,
	ConfigLoader,
} from "./types";

import { ConfigLoader as DefaultConfigLoader } from "./configLoader";
import {
	createRequestBody,
	executeApiRequest,
	executeStreamApiRequest,
	createStreamParser,
	createSystemMessage,
	createUserMessage,
	createAssistantMessage,
} from "./apiClient";

export interface AIServiceDependencies {
	configLoader: ConfigLoader;
}

export class AIServiceRefactored implements AIProvider {
	private configLoader: ConfigLoader;

	constructor(dependencies: AIServiceDependencies) {
		this.configLoader = dependencies.configLoader;
	}

	async invoke(
		messages: AIMessage[],
		tools?: AIFunctionTool[],
		abortSignal?: AbortSignal,
	): Promise<AIResponse> {
		const config = this.configLoader.getConfig();
		if (!config) {
			throw new Error("AI 配置未加载");
		}
		return this.realInvoke(config, messages, tools, abortSignal);
	}

	async invokeStream(
		messages: AIMessage[],
		tools?: AIFunctionTool[],
		abortSignal?: AbortSignal,
	): Promise<ReadableStream<AIStreamChunk>> {
		const config = this.configLoader.getConfig();
		if (!config) {
			throw new Error("AI 配置未加载");
		}
		// 真实 API 流式调用
		return this.realInvokeStream(config, messages, tools, abortSignal);
	}

	private async realInvoke(
		config: AIConfig,
		messages: AIMessage[],
		tools?: AIFunctionTool[],
		abortSignal?: AbortSignal,
	): Promise<AIResponse> {
		const requestBody = createRequestBody(
			config.config,
			messages,
			tools,
			false,
		);

		return executeApiRequest(
			config.config.endpoint,
			config.config.apiKey,
			requestBody,
			abortSignal,
		);
	}

	private async realInvokeStream(
		config: AIConfig,
		messages: AIMessage[],
		tools?: AIFunctionTool[],
		abortSignal?: AbortSignal,
	): Promise<ReadableStream<AIStreamChunk>> {
		const requestBody = createRequestBody(config.config, messages, tools, true);

		const response = await executeStreamApiRequest(
			config.config.endpoint,
			config.config.apiKey,
			requestBody,
			abortSignal,
		);

		return createStreamParser(response);
	}

	createSystemMessage(content: string): AIMessage {
		const config = this.configLoader.getConfig();
		if (config?.provider === "mock") {
			return createSystemMessage(content);
		}
		return createSystemMessage(content);
	}

	createUserMessage(content: string): AIMessage {
		const config = this.configLoader.getConfig();
		if (config?.provider === "mock") {
			return createUserMessage(content);
		}
		return createUserMessage(content);
	}

	createAssistantMessage(content: string): AIMessage {
		const config = this.configLoader.getConfig();
		if (config?.provider === "mock") {
			return createAssistantMessage(content);
		}
		return createAssistantMessage(content);
	}

	getConfigLoader(): ConfigLoader {
		return this.configLoader;
	}
}

export async function createDefaultAIService(): Promise<AIServiceRefactored> {
	const configLoader = new DefaultConfigLoader();
	// 尝试加载配置
	await configLoader.loadConfig();
	return new AIServiceRefactored({ configLoader });
}
