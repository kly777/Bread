import { createSignal, createEffect, onCleanup, For } from 'solid-js';
import { render } from 'solid-js/web';
import { AIFeature } from './AIFeature';

interface UIProps {
    feature: AIFeature;
}

export function UI(props: UIProps) {
    const [isVisible, setIsVisible] = createSignal(false);
    const [command, setCommand] = createSignal('');
    const [result, setResult] = createSignal('');
    const [streamingResult, setStreamingResult] = createSignal('');
    const [isLoading, setIsLoading] = createSignal(false);
    const [isStreaming, setIsStreaming] = createSignal(false);
    const [history, setHistory] = createSignal<{ command: string; result: string; timestamp: Date }[]>([]);
    
    // 输入框引用
    let inputRef: HTMLInputElement | undefined;

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!command().trim() || isLoading() || isStreaming()) return;

        const currentCommand = command();
        setCommand('');
        setResult('');
        setStreamingResult('');
        
        // 检查是否应该使用流式传输
        const useStreaming = true; // 默认使用流式传输
        
        if (useStreaming) {
            await handleSubmitStreaming(currentCommand);
        } else {
            await handleSubmitNonStreaming(currentCommand);
        }
    };

    const handleSubmitNonStreaming = async (currentCommand: string) => {
        setIsLoading(true);
        
        try {
            const commandResult = await props.feature.executeCommand(currentCommand);
            setResult(commandResult);
            setHistory(prev => [...prev, {
                command: currentCommand,
                result: commandResult,
                timestamp: new Date()
            }]);
        } catch (error) {
            setResult(`执行失败: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitStreaming = async (currentCommand: string) => {
        setIsStreaming(true);
        setStreamingResult('');
        
        try {
            const stream = await props.feature.executeCommandStream(currentCommand);
            const reader = stream.getReader();
            let fullResult = '';
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }
                
                fullResult += value;
                setStreamingResult(fullResult);
            }
            
            // 流式传输完成后，将结果添加到历史记录
            setHistory(prev => [...prev, {
                command: currentCommand,
                result: fullResult,
                timestamp: new Date()
            }]);
            
            // 同时更新 result 以便在非流式视图中显示
            setResult(fullResult);
            
        } catch (error) {
            setStreamingResult(`流式执行失败: ${error instanceof Error ? error.message : String(error)}`);
            setResult(`执行失败: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsStreaming(false);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    const handleToggleVisibility = () => {
        setIsVisible(!isVisible());
    };

    const handleClearHistory = () => {
        setHistory([]);
        setResult('');
        setStreamingResult('');
    };

    const handleGetPageState = async () => {
        setIsLoading(true);
        try {
            const state = await props.feature.getPageState();
            setResult(state);
        } catch (error) {
            setResult(`获取页面状态失败: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    // 当 UI 可见时，自动聚焦到输入框
    createEffect(() => {
        if (isVisible() && inputRef) {
            // 使用 setTimeout 确保 DOM 已经渲染完成
            setTimeout(() => {
                inputRef?.focus();
            }, 50);
        }
    });

    // 键盘快捷键：Ctrl+Shift+P 打开/关闭控制面板
    createEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                handleToggleVisibility();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
    });

    return (
        <>
            {/* 浮动按钮 */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                'z-index': '10000'
            }}>
                <button
                    onClick={handleToggleVisibility}
                    style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        'border-radius': '50%',
                        width: '50px',
                        height: '50px',
                        'font-size': '24px',
                        cursor: 'pointer',
                        'box-shadow': '0 2px 10px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    AI
                </button>
            </div>

            {/* 控制面板 */}
            {isVisible() && (
                <div style={{
                    position: 'fixed',
                    bottom: '80px',
                    right: '20px',
                    width: '500px',
                    'max-width': '90vw',
                    height: '600px',
                    'max-height': '80vh',
                    background: 'white',
                    'border-radius': '12px',
                    'box-shadow': '0 10px 30px rgba(0,0,0,0.3)',
                    'z-index': '9999',
                    display: 'flex',
                    'flex-direction': 'column',
                    overflow: 'hidden'
                }}>
                    {/* 标题栏 */}
                    <div style={{
                        background: '#007bff',
                        color: 'white',
                        padding: '15px 20px',
                        display: 'flex',
                        'justify-content': 'space-between',
                        'align-items': 'center'
                    }}>
                        <h3 style={{ margin: '0', 'font-size': '18px' }}>AI 助手</h3>
                        <button
                            onClick={handleClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                'font-size': '20px',
                                cursor: 'pointer',
                                padding: '0',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                'align-items': 'center',
                                'justify-content': 'center'
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {/* 内容区域 */}
                    <div style={{
                        flex: '1',
                        padding: '20px',
                        overflow: 'auto',
                        display: 'flex',
                        'flex-direction': 'column',
                        gap: '15px'
                    }}>
                        {/* 输入表单 */}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={command()}
                                    onInput={(e) => setCommand(e.currentTarget.value)}
                                    placeholder="输入自然语言指令，例如：点击登录按钮"
                                    disabled={isLoading() || isStreaming()}
                                    style={{
                                        flex: '1',
                                        padding: '12px 15px',
                                        border: '1px solid #ddd',
                                        'border-radius': '8px',
                                        'font-size': '14px'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading() || isStreaming() || !command().trim()}
                                    style={{
                                        padding: '12px 20px',
                                        background: isLoading() || isStreaming() ? '#6c757d' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        'border-radius': '8px',
                                        cursor: isLoading() || isStreaming() ? 'not-allowed' : 'pointer',
                                        'font-size': '14px',
                                        'font-weight': 'bold'
                                    }}
                                >
                                    {isLoading() ? '处理中...' : isStreaming() ? '流式传输中...' : '执行'}
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px', 'flex-wrap': 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={handleGetPageState}
                                    disabled={isLoading() || isStreaming()}
                                    style={{
                                        padding: '8px 15px',
                                        background: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        'border-radius': '6px',
                                        cursor: 'pointer',
                                        'font-size': '13px'
                                    }}
                                >
                                    获取页面状态
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearHistory}
                                    style={{
                                        padding: '8px 15px',
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        'border-radius': '6px',
                                        cursor: 'pointer',
                                        'font-size': '13px'
                                    }}
                                >
                                    清空历史
                                </button>
                            </div>
                        </form>

                        {/* 结果展示 */}
                        <div style={{
                            flex: '1',
                            border: '1px solid #eee',
                            'border-radius': '8px',
                            padding: '15px',
                            overflow: 'auto',
                            background: '#f8f9fa',
                            'min-height': '200px'
                        }}>
                            <div style={{ 'margin-bottom': '10px', 'font-weight': 'bold', color: '#495057' }}>
                                执行结果:
                            </div>
                            
                            {/* 流式结果展示 */}
                            {isStreaming() && (
                                <div style={{
                                    'white-space': 'pre-wrap',
                                    'word-break': 'break-word',
                                    'font-family': 'monospace',
                                    'font-size': '13px',
                                    color: '#212529',
                                    'line-height': '1.5'
                                }}>
                                    {streamingResult()}
                                    <span style={{
                                        display: 'inline-block',
                                        width: '8px',
                                        height: '16px',
                                        background: '#007bff',
                                        'margin-left': '2px',
                                        'vertical-align': 'middle',
                                        animation: 'blink 1s infinite'
                                    }}></span>
                                </div>
                            )}
                            
                            {/* 非流式结果展示 */}
                            {!isStreaming() && result() && (
                                <div style={{
                                    'white-space': 'pre-wrap',
                                    'word-break': 'break-word',
                                    'font-family': 'monospace',
                                    'font-size': '13px',
                                    color: '#212529',
                                    'line-height': '1.5'
                                }}>
                                    {result()}
                                </div>
                            )}
                            
                            {!isStreaming() && !result() && !streamingResult() && (
                                <div style={{ color: '#6c757d', 'font-style': 'italic', 'text-align': 'center', padding: '20px' }}>
                                    执行结果将显示在这里
                                </div>
                            )}
                        </div>

                        {/* 历史记录 */}
                        <div style={{
                            border: '1px solid #eee',
                            'border-radius': '8px',
                            padding: '15px',
                            overflow: 'auto',
                            background: '#f8f9fa',
                            'max-height': '200px'
                        }}>
                            <div style={{ 'margin-bottom': '10px', 'font-weight': 'bold', color: '#495057' }}>
                                历史记录 ({history().length}):
                            </div>
                            
                            {history().length === 0 ? (
                                <div style={{ color: '#6c757d', 'font-style': 'italic', 'text-align': 'center', padding: '10px' }}>
                                    暂无历史记录
                                </div>
                            ) : (
                                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
                                    <For each={history().slice().reverse()}>
                                        {(item) => (
                                            <div style={{
                                                border: '1px solid #dee2e6',
                                                'border-radius': '6px',
                                                padding: '10px',
                                                background: 'white'
                                            }}>
                                                <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '5px' }}>
                                                    <div style={{ 'font-weight': 'bold', color: '#007bff' }}>
                                                        {item.command}
                                                    </div>
                                                    <div style={{ 'font-size': '12px', color: '#6c757d' }}>
                                                        {item.timestamp.toLocaleTimeString()}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    'font-size': '12px',
                                                    color: '#495057',
                                                    'white-space': 'pre-wrap',
                                                    'word-break': 'break-word',
                                                    'max-height': '60px',
                                                    overflow: 'hidden',
                                                    'text-overflow': 'ellipsis'
                                                }}>
                                                    {item.result.length > 100 ? item.result.substring(0, 100) + '...' : item.result}
                                                </div>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 闪烁动画样式 */}
            <style>
                {`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                `}
            </style>
        </>
    );
}

export function initUI(feature: AIFeature): void {

    let container = document.getElementById('page-agent-ui-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'page-agent-ui-container';
        document.body.appendChild(container);
    }
    
    render(() => <UI feature={feature} />, container);
}

/**
 * 销毁 UI
 */
export function destroyUI(): void {
    const container = document.getElementById('page-agent-ui-container');
    
    if (container) {
        container.innerHTML = '';
        container.remove();
    }
}