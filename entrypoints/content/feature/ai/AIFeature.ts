/**
 *  AI 控制浏览器功能
 */

import { Feature } from "../Feature";
import { PageController } from "./PageController";
import { createDefaultAIService } from "./AIService";
import { ToolExecutor } from "./toolExecutor";
import { buildSystemPrompt, buildUserMessage } from "./systemPrompt";
import { buildToolDefinitions } from "./toolDefinitions";

interface SimpleAIService {
	invoke(messages: unknown[], tools?: unknown[]): Promise<unknown>;
	invokeStream(
		messages: unknown[],
		tools?: unknown[],
	): Promise<ReadableStream<unknown>>;
	createSystemMessage(content: string): unknown;
	createUserMessage(content: string): unknown;
	createAssistantMessage(content: string): unknown;
}

export class AIFeature extends Feature {
	readonly name = "page-agent";
	readonly default = false;

	private pageController: PageController | null = null;
	private aiService: SimpleAIService | null = null;
	private toolExecutor: ToolExecutor | null = null;
	private isActive = false;

	async init(): Promise<void> {
		console.log("AI 功能初始化");
		// 初始化可以在构造函数中完成
	}

	async on(): Promise<void> {
		if (this.isActive) {
			return;
		}

		console.log("启用 AI 功能");
		this.isActive = true;

		try {
			// 创建 PageController
			this.pageController = new PageController();

			// 创建 AI 服务
			this.aiService = await createDefaultAIService();

			// 创建工具执行器
			this.toolExecutor = new ToolExecutor({
				pageController: this.pageController,
			});

			// 初始化 UI
			import("./UI")
				.then(({ initUI }) => {
					initUI(this);
				})
				.catch((error) => {
					console.error("初始化 UI 失败:", error);
				});

			console.log("AI 功能已启用");
		} catch (error) {
			console.error("启用 AI 功能失败:", error);
			this.isActive = false;
			throw error;
		}
	}

	async off(): Promise<void> {
		if (!this.isActive) {
			return;
		}

		console.log("禁用 AI 功能");
		this.isActive = false;

		if (this.toolExecutor) {
			await this.toolExecutor.cleanUpHighlights();
		}

		import("./UI")
			.then(({ destroyUI }) => {
				destroyUI();
			})
			.catch((error) => {
				console.error("销毁 UI 失败:", error);
			});

		this.pageController = null;
		this.aiService = null;
		this.toolExecutor = null;
	}

	async executeCommand(command: string): Promise<string> {
		if (
			!this.isActive ||
			!this.pageController ||
			!this.aiService ||
			!this.toolExecutor
		) {
			throw new Error("功能未启用");
		}

		return this.processCommandWithAI(command);
	}

	async executeCommandStream(command: string): Promise<ReadableStream<string>> {
		if (
			!this.isActive ||
			!this.pageController ||
			!this.aiService ||
			!this.toolExecutor
		) {
			return new ReadableStream<string>({
				start(controller) {
					controller.enqueue("功能未启用");
					controller.close();
				},
			});
		}

		return this.processCommandWithAIStream(command);
	}

	async getPageState(): Promise<string> {
		if (!this.isActive || !this.toolExecutor) {
			throw new Error("功能未启用");
		}

		return this.toolExecutor.getPageState();
	}

	private async processCommandWithAI(command: string): Promise<string> {
		if (!this.pageController || !this.aiService || !this.toolExecutor) {
			return "功能未初始化";
		}

		try {
			// 获取页面状态作为上下文
			const pageState = await this.getPageState();

			// 构建系统提示
			const systemPrompt = buildSystemPrompt();

			// 构建用户消息
			const userMessage = buildUserMessage(pageState, command);

			// 准备消息
			const messages = [
				this.aiService.createSystemMessage(systemPrompt),
				this.aiService.createUserMessage(userMessage),
			];

			// 准备工具定义
			const tools = buildToolDefinitions();

			// 调用 AI 服务
			const response = await this.aiService.invoke(messages, tools);

			// 处理响应
			return this.handleAIResponse(response);
		} catch (error) {
			console.error("AI 处理命令失败:", error);
			return `AI 处理失败: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	private async processCommandWithAIStream(
		command: string,
	): Promise<ReadableStream<string>> {
		if (!this.pageController || !this.aiService || !this.toolExecutor) {
			return new ReadableStream<string>({
				start(controller) {
					controller.enqueue("功能未初始化");
					controller.close();
				},
			});
		}

		try {
			// 获取页面状态作为上下文
			const pageState = await this.getPageState();

			// 构建系统提示
			const systemPrompt = buildSystemPrompt();

			// 构建用户消息
			const userMessage = buildUserMessage(pageState, command);

			// 准备消息
			const messages = [
				this.aiService.createSystemMessage(systemPrompt),
				this.aiService.createUserMessage(userMessage),
			];

			// 准备工具定义
			const tools = buildToolDefinitions();

			// 调用 AI 服务（流式）
			const stream = await this.aiService.invokeStream(messages, tools);

			// 处理流式响应
			return this.handleAIStream(stream);
		} catch (error) {
			console.error("AI 流式处理命令失败:", error);
			return new ReadableStream<string>({
				start(controller) {
					controller.enqueue(
						`AI 处理失败: ${error instanceof Error ? error.message : String(error)}`,
					);
					controller.close();
				},
			});
		}
	}

	private async handleAIResponse(response: unknown): Promise<string> {
		if (!this.toolExecutor) {
			return "工具执行器未初始化";
		}

		const resp = response as Record<string, unknown>;
		const content = (resp.content as string) || "";
		const tool_calls = (resp.tool_calls as Record<string, unknown>[]) || [];

		let result = content;

		if (tool_calls && tool_calls.length > 0) {
			const toolResults: string[] = [];

			for (const toolCall of tool_calls) {
				const type = toolCall.type as string;
				const func = toolCall.function as Record<string, unknown> | undefined;
				if (type === "function" && func) {
					const name = func.name as string;
					const argsStr = func.arguments as string;
					try {
						const toolResult = await this.toolExecutor.executeToolCall(
							name,
							argsStr,
						);
						toolResults.push(`工具调用 ${name}: ${toolResult.message}`);
					} catch (error) {
						toolResults.push(
							`工具调用 ${name} 失败: ${error instanceof Error ? error.message : String(error)}`,
						);
					}
				}
			}

			if (toolResults.length > 0) {
				result += `\n\n${toolResults.join("\n")}`;
			}
		}

		return result;
	}

	private handleAIStream(
		stream: ReadableStream<unknown>,
	): ReadableStream<string> {
		// 保存 toolExecutor 的引用，以便在闭包中使用
		const toolExecutor = this.toolExecutor;

		return new ReadableStream<string>({
			async start(controller) {
				const reader = stream.getReader();

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						// value 应该是 AIStreamChunk 对象，而不是 Uint8Array
						const chunk = value as Record<string, unknown>;
						const type = chunk.type as string;
						const data = chunk.data;

						if (type === "content") {
							// 内容数据
							controller.enqueue(String(data));
						} else if (type === "tool_call") {
							// 工具调用数据
							// 工具名称应该在 tool_name 字段中，而不是 data.name 中
							const toolName = chunk.tool_name as string;
							let actualToolName = toolName;

							if (!actualToolName) {
								// 如果 tool_name 不存在，尝试从 data.function.name 获取
								const toolData = data as Record<string, unknown>;
								const functionData = toolData.function as
									| Record<string, unknown>
									| undefined;
								actualToolName = (functionData?.name as string) || "未知工具";
							}

							controller.enqueue(`[工具调用: ${actualToolName}]`);

							// 如果有 toolExecutor，执行工具调用
							if (toolExecutor && typeof data === "object" && data !== null) {
								const toolData = data as Record<string, unknown>;
								const functionData = toolData.function as
									| Record<string, unknown>
									| undefined;

								if (functionData?.name && functionData?.arguments) {
									const name = functionData.name as string;
									const argsStr = functionData.arguments as string;

									try {
										const toolResult = await toolExecutor.executeToolCall(
											name,
											argsStr,
										);
										controller.enqueue(`[工具执行结果: ${toolResult.message}]`);
									} catch (error) {
										controller.enqueue(
											`[工具执行失败: ${error instanceof Error ? error.message : String(error)}]`,
										);
									}
								}
							}
						} else if (type === "finish") {
						} else if (type === "error") {
							controller.enqueue(`[错误: ${String(data)}]`);
						}
					}

					controller.close();
				} catch (error) {
					console.error("流式处理失败:", error);
					controller.error(error);
				}
			},
		});
	}

	async executeCommandWithAutoLoop(command: string): Promise<string> {
		if (!this.isActive) {
			throw new Error("功能未启用");
		}

		let result = "";
		let iteration = 0;
		const maxIterations = 10; // 防止无限循环

		while (iteration < maxIterations) {
			iteration++;
			console.log(`自动化循环迭代 ${iteration}`);

			const response = await this.executeCommand(command);
			result += `${response}\n\n`;

			// 检查是否还有工具调用
			// 这里简化处理：如果响应包含"工具调用"，则继续循环
			// 实际应该解析 AI 响应来判断是否需要继续
			if (!response.includes("工具调用")) {
				break;
			}

			// 等待一下再继续
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		return result;
	}

	async executeCommandStreamWithAutoLoop(
		command: string,
	): Promise<ReadableStream<string>> {
		// 简化实现：直接返回普通流式响应
		return this.executeCommandStream(command);
	}
}
