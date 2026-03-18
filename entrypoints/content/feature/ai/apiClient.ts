// API 客户端
import type {
    AIConfig,
    AIMessage,
    AIFunctionTool,
    AIResponse,
    AIStreamChunk,
    ToolCallDelta,
    ParsedToolCall
} from './types';

export function createRequestBody(
    config: AIConfig['config'],
    messages: AIMessage[],
    tools?: AIFunctionTool[],
    stream = false
): Record<string, unknown> {
    const requestBody: Record<string, unknown> = {
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream,
    };

    if (tools && tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto'; // 让 AI 决定是否使用工具
    }

    return requestBody;
}

/**
 * 执行 API 请求（非流式）
 */
export async function executeApiRequest(
    endpoint: string,
    apiKey: string,
    requestBody: Record<string, unknown>,
    abortSignal?: AbortSignal
): Promise<AIResponse> {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: abortSignal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API 错误: ${response.status} ${errorText}`);
    }

    const data = await response.json() as Record<string, unknown>;
    
    // 解析响应
    const choices = data.choices as Record<string, unknown>[] | undefined;
    const choice = choices?.[0];
    if (!choice) {
        throw new Error('AI 响应格式错误');
    }

    const message = choice.message as Record<string, unknown>;
    
    return {
        content: (message.content as string) || '',
        tool_calls: message.tool_calls as AIResponse['tool_calls'],
    };
}

/**
 * 执行 API 请求（流式）
 */
export async function executeStreamApiRequest(
    endpoint: string,
    apiKey: string,
    requestBody: Record<string, unknown>,
    abortSignal?: AbortSignal
): Promise<Response> {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: abortSignal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API 错误: ${response.status} ${errorText}`);
    }

    return response;
}

/**
 * 解析 SSE 行数据
 */
function parseSSELine(line: string): Record<string, unknown> | null {
    if (line.trim() === '') return null;
    if (!line.startsWith('data: ')) return null;
    
    const data = line.slice(6);
    if (data === '[DONE]') return { done: true };
    
    try {
        return JSON.parse(data) as Record<string, unknown>;
    } catch (error) {
        console.error('解析 SSE 数据失败:', error, '数据:', data);
        return null;
    }
}

/**
 * 处理内容增量
 */
function processContentDelta(
    delta: Record<string, unknown>,
    controller: ReadableStreamDefaultController<AIStreamChunk>
): void {
    if (delta.content) {
        controller.enqueue({
            type: 'content',
            data: delta.content as string,
        });
    }
}

/**
 * 累积工具调用数据
 */
function accumulateToolCall(
    toolCallDelta: ToolCallDelta,
    toolCallAccumulators: Map<number, ParsedToolCall>
): ParsedToolCall | null {
    const { index, id, function: func } = toolCallDelta;
    
    if (index === undefined) {
        console.log('工具调用没有 index:', toolCallDelta);
        return null;
    }
    
    // 获取或创建累积器
    let accumulator = toolCallAccumulators.get(index);
    if (!accumulator) {
        accumulator = {
            id: id || `tool-call-${index}`,
            name: '',
            arguments: '',
            index,
        };
        toolCallAccumulators.set(index, accumulator);
    }
    
    // 如果这个块有 ID，更新累积器的 ID
    if (id) {
        accumulator.id = id;
    }
    
    // 合并函数数据
    if (func?.name) {
        accumulator.name += func.name;
    }
    
    if (func?.arguments) {
        accumulator.arguments += func.arguments;
    }
    
    return accumulator;
}

/**
 * 检查工具调用是否完整
 */
function isToolCallComplete(toolCall: ParsedToolCall): boolean {
    return !!toolCall.name && 
           !!toolCall.arguments && 
           typeof toolCall.arguments === 'string' &&
           toolCall.arguments.includes('}'); // 简单的完整性检查
}

/**
 * 发送完整的工具调用
 */
function emitCompleteToolCalls(
    toolCallAccumulators: Map<number, ParsedToolCall>,
    controller: ReadableStreamDefaultController<AIStreamChunk>
): void {
    const completedIndices: number[] = [];
    
    for (const [index, toolCall] of toolCallAccumulators.entries()) {
        if (isToolCallComplete(toolCall)) {
            controller.enqueue({
                type: 'tool_call',
                data: {
                    id: toolCall.id,
                    type: 'function',
                    function: {
                        name: toolCall.name,
                        arguments: toolCall.arguments,
                    }
                },
                tool_call_id: toolCall.id,
                tool_name: toolCall.name,
            });
            completedIndices.push(index);
        }
    }
    
    // 删除已发送的累积器
    for (const index of completedIndices) {
        toolCallAccumulators.delete(index);
    }
}

/**
 * 处理工具调用增量
 */
function processToolCallDelta(
    delta: Record<string, unknown>,
    toolCallAccumulators: Map<number, ParsedToolCall>,
    controller: ReadableStreamDefaultController<AIStreamChunk>
): void {
    const toolCalls = delta.tool_calls as ToolCallDelta[] | undefined;
    if (!toolCalls) return;
    
    // 调试日志
    console.log('检测到工具调用增量:', toolCalls);
    
    for (const toolCallDelta of toolCalls) {
        const accumulator = accumulateToolCall(toolCallDelta, toolCallAccumulators);
        
        if (accumulator) {
            // 调试日志
            console.log('累积工具调用:', accumulator);
            
            // 检查是否完整
            if (isToolCallComplete(accumulator)) {
                console.log('发送完整工具调用:', accumulator);
                controller.enqueue({
                    type: 'tool_call',
                    data: {
                        id: accumulator.id,
                        type: 'function',
                        function: {
                            name: accumulator.name,
                            arguments: accumulator.arguments,
                        }
                    },
                    tool_call_id: accumulator.id,
                    tool_name: accumulator.name,
                });
                toolCallAccumulators.delete(accumulator.index);
            }
        }
    }
}

/**
 * 处理解析后的数据
 */
function processParsedData(
    parsed: Record<string, unknown>,
    toolCallAccumulators: Map<number, ParsedToolCall>,
    controller: ReadableStreamDefaultController<AIStreamChunk>
): void {
    const choices = parsed.choices as Record<string, unknown>[] | undefined;
    const choice = choices?.[0];
    
    if (!choice) return;
    
    const delta = choice.delta as Record<string, unknown>;
    
    // 处理内容增量
    processContentDelta(delta, controller);
    
    // 处理工具调用
    if (delta.tool_calls) {
        processToolCallDelta(delta, toolCallAccumulators, controller);
    }
}

/**
 * 解析流式响应
 */
export function createStreamParser(response: Response): ReadableStream<AIStreamChunk> {
    const reader = response.body?.getReader();
    
    if (!reader) {
        throw new Error('响应体不可读');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    // 用于累积工具调用数据，键为 index
    const toolCallAccumulators = new Map<number, ParsedToolCall>();

    return new ReadableStream<AIStreamChunk>({
        async start(controller) {
            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        // 发送完成信号
                        controller.enqueue({
                            type: 'finish',
                            data: 'Stream completed',
                        });
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const parsed = parseSSELine(line);
                        if (!parsed) continue;
                        
                        if ('done' in parsed) {
                            // 发送所有累积的完整工具调用
                            emitCompleteToolCalls(toolCallAccumulators, controller);
                            
                            controller.enqueue({
                                type: 'finish',
                                data: 'Stream completed',
                            });
                            continue;
                        }
                        
                        processParsedData(parsed, toolCallAccumulators, controller);
                    }
                }
            } catch (error) {
                controller.enqueue({
                    type: 'error',
                    data: error instanceof Error ? error.message : String(error),
                });
            } finally {
                controller.close();
                reader.releaseLock();
            }
        },

        cancel() {
            reader.cancel();
        },
    });
}

export function createSystemMessage(content: string): AIMessage {
    return { role: 'system', content };
}

export function createUserMessage(content: string): AIMessage {
    return { role: 'user', content };
}

export function createAssistantMessage(content: string): AIMessage {
    return { role: 'assistant', content };
}
