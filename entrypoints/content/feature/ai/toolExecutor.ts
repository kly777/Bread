// 执行 AI 调用的工具
import type { PageController } from './PageController';
import type { AIStreamChunk } from './types';

export interface ToolExecutionResult {
    success: boolean;
    message: string;
    data?: unknown;
}

export interface ToolExecutorDependencies {
    pageController: PageController;
}

export class ToolExecutor {
    private pageController: PageController;

    constructor(dependencies: ToolExecutorDependencies) {
        this.pageController = dependencies.pageController;
    }

    async executeToolCall(
        name: string,
        argsStr: string
    ): Promise<ToolExecutionResult> {
        try {
            const args = JSON.parse(argsStr);
            
            switch (name) {
                case 'click_element': {
                    const { index } = args;
                    const result = await this.pageController.clickElement(index);
                    return {
                        success: result.success,
                        message: result.message || `已点击元素 [${index}]`,
                        data: result
                    };
                }
                
                case 'input_text': {
                    const { index, text } = args;
                    const result = await this.pageController.inputText(index, text);
                    return {
                        success: result.success,
                        message: result.message || `已在元素 [${index}] 中输入文本: "${text}"`,
                        data: result
                    };
                }
                
                case 'select_option': {
                    const { index, value } = args;
                    const result = await this.pageController.selectOption(index, value);
                    return {
                        success: result.success,
                        message: result.message || `已在元素 [${index}] 中选择选项: "${value}"`,
                        data: result
                    };
                }
                
                case 'scroll': {
                    const { direction, amount = 100 } = args;
                    const result = await this.pageController.scroll(direction, amount);
                    return {
                        success: result.success,
                        message: result.message || `已向 ${direction} 滚动 ${amount}px`,
                        data: result
                    };
                }
                
                case 'execute_javascript': {
                    const { code } = args;
                    const result = await this.pageController.executeJavaScript(code);
                    return {
                        success: result.success,
                        message: result.message || `已执行 JavaScript 代码`,
                        data: result
                    };
                }
                
                case 'get_browser_state': {
                    const state = await this.pageController.getBrowserState();
                    const stateText = `${state.header}\n\n${state.content}\n\n${state.footer}`;
                    return {
                        success: true,
                        message: '已获取最新页面状态',
                        data: stateText
                    };
                }
                
                default:
                    return {
                        success: false,
                        message: `未知工具: ${name}`
                    };
            }
        } catch (error) {
            console.error(`执行工具 ${name} 失败:`, error);
            return {
                success: false,
                message: `执行工具 ${name} 失败: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    async executeToolCallsFromStream(
        toolCalls: AIStreamChunk[]
    ): Promise<string> {
        const results: string[] = [];
        
        // 按工具调用 ID 分组
        const toolCallMap = new Map<string, { name: string; arguments: string }>();
        
        for (const chunk of toolCalls) {
            if (chunk.type === 'tool_call' && typeof chunk.data === 'object') {
                const data = chunk.data as Record<string, unknown>;
                const id = data.id as string;
                const name = data.name as string;
                const argumentsStr = data.arguments as string;
                
                if (id && name) {
                    if (!toolCallMap.has(id)) {
                        toolCallMap.set(id, { name, arguments: argumentsStr || '' });
                    } else {
                        const existing = toolCallMap.get(id);
                        if (existing) {
                            existing.arguments += argumentsStr || '';
                        }
                    }
                }
            }
        }
        
        for (const toolCall of toolCallMap.values()) {
            const { name, arguments: argsStr } = toolCall;
            if (name && argsStr) {
                try {
                    const result = await this.executeToolCall(name, argsStr);
                    results.push(`工具调用 ${name}: ${result.message}`);
                } catch (error) {
                    results.push(`工具调用 ${name} 失败: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
        
        return results.join('\n');
    }

    async getPageState(): Promise<string> {
        const state = await this.pageController.getBrowserState();
        return `${state.header}\n\n${state.content}\n\n${state.footer}`;
    }

    async cleanUpHighlights(): Promise<void> {
        await this.pageController.cleanUpHighlights();
    }
}