import { Component, createSignal, onMount, onCleanup } from 'solid-js'
import './ai.css'

interface AIWindowProps {
        onClose: () => void
        onSummarize: () => Promise<void>
        onHighlight: () => void
        result: string
        isLoading: boolean
        isError: boolean
        onSendMessage?: (message: string) => Promise<string>
        onGetPageContent?: () => string
        initialChatMessages?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
}

const AIWindow: Component<AIWindowProps> = (props) => {
        const [isMinimized, setIsMinimized] = createSignal(false)
        const [position, setPosition] = createSignal({ x: 20, y: 100 })
        const [isDragging, setIsDragging] = createSignal(false)
        const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 })
        const [activeTab, setActiveTab] = createSignal<'analysis' | 'chat'>('analysis')
        const [chatMessages, setChatMessages] = createSignal<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([])
        const [chatInput, setChatInput] = createSignal('')
        const [isSending, setIsSending] = createSignal(false)

        let windowRef: HTMLDivElement | undefined
        let dragHandleRef: HTMLDivElement | undefined

        // 处理拖拽开始
        const handleDragStart = (e: MouseEvent) => {
                if (!windowRef) return

                setIsDragging(true)
                const rect = windowRef.getBoundingClientRect()
                setDragOffset({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                })

                e.preventDefault()
        }

        // 处理拖拽移动
        const handleDragMove = (e: MouseEvent) => {
                if (!isDragging() || !windowRef) return

                const newX = e.clientX - dragOffset().x
                const newY = e.clientY - dragOffset().y

                // 限制在窗口范围内
                const maxX = window.innerWidth - windowRef.offsetWidth
                const maxY = window.innerHeight - windowRef.offsetHeight

                setPosition({
                        x: Math.max(0, Math.min(newX, maxX)),
                        y: Math.max(0, Math.min(newY, maxY)),
                })
        }

        // 处理拖拽结束
        const handleDragEnd = () => {
                setIsDragging(false)
        }

        // 设置拖拽事件监听
        onMount(() => {
                if (dragHandleRef) {
                        dragHandleRef.addEventListener(
                                'mousedown',
                                handleDragStart
                        )
                }

                document.addEventListener('mousemove', handleDragMove)
                document.addEventListener('mouseup', handleDragEnd)

                // 初始化聊天消息
                if (props.initialChatMessages) {
                        setChatMessages(props.initialChatMessages)
                }

                return () => {
                        if (dragHandleRef) {
                                dragHandleRef.removeEventListener(
                                        'mousedown',
                                        handleDragStart
                                )
                        }
                        document.removeEventListener(
                                'mousemove',
                                handleDragMove
                        )
                        document.removeEventListener('mouseup', handleDragEnd)
                }
        })

        // 清理
        onCleanup(() => {
                if (dragHandleRef) {
                        dragHandleRef.removeEventListener(
                                'mousedown',
                                handleDragStart
                        )
                }
                document.removeEventListener('mousemove', handleDragMove)
                document.removeEventListener('mouseup', handleDragEnd)
        })

        // 处理发送消息
        const handleSendMessage = async () => {
                const message = chatInput().trim()
                if (!message) return

                setIsSending(true)

                // 添加用户消息
                const userMessage = {
                        role: 'user' as const,
                        content: message,
                        timestamp: new Date()
                }
                setChatMessages(prev => [...prev, userMessage])
                setChatInput('')

                try {
                        // 如果有发送消息回调，调用它
                        if (props.onSendMessage) {
                                const aiResponse = await props.onSendMessage(message)

                                // 添加AI回复
                                const assistantMessage = {
                                        role: 'assistant' as const,
                                        content: aiResponse,
                                        timestamp: new Date()
                                }
                                setChatMessages(prev => [...prev, assistantMessage])
                        } else {
                                // 模拟回复
                                const assistantMessage = {
                                        role: 'assistant' as const,
                                        content: '这是模拟回复。请配置AI服务以获得真实响应。',
                                        timestamp: new Date()
                                }
                                setChatMessages(prev => [...prev, assistantMessage])
                        }
                } catch (error) {
                        console.error('发送消息失败:', error)
                        const errorMessage = {
                                role: 'assistant' as const,
                                content: `抱歉，发送消息时出错: ${error instanceof Error ? error.message : '未知错误'}`,
                                timestamp: new Date()
                        }
                        setChatMessages(prev => [...prev, errorMessage])
                } finally {
                        setIsSending(false)
                }
        }

        return (
                <div
                        ref={windowRef}
                        class="bread-ai-window"
                        classList={{ dragging: isDragging() }}
                        style={{
                                position: 'fixed',
                                left: `${position().x}px`,
                                top: `${position().y}px`,
                                'z-index': '999999',
                        }}
                >
                        {/* 标题栏 */}
                        <div ref={dragHandleRef} class="bread-ai-titlebar">
                                <div class="bread-ai-title">AI助手</div>
                                <div class="bread-ai-controls">
                                        <button
                                                class="bread-ai-control-btn"
                                                onClick={() =>
                                                        setIsMinimized(
                                                                !isMinimized()
                                                        )
                                                }
                                                title={
                                                        isMinimized()
                                                                ? '展开'
                                                                : '最小化'
                                                }
                                        >
                                                {isMinimized() ? '+' : '−'}
                                        </button>
                                        <button
                                                class="bread-ai-control-btn"
                                                onClick={props.onClose}
                                                title="关闭"
                                        >
                                                ×
                                        </button>
                                </div>
                        </div>

                        {/* 内容区域 */}
                        {!isMinimized() && (
                                <div class="bread-ai-content">
                                        {/* 标签页切换 */}
                                        <div class="bread-ai-tabs">
                                                <button
                                                        class="bread-ai-tab"
                                                        classList={{ active: activeTab() === 'analysis' }}
                                                        onClick={() => setActiveTab('analysis')}
                                                >
                                                        网页分析
                                                </button>
                                                <button
                                                        class="bread-ai-tab"
                                                        classList={{ active: activeTab() === 'chat' }}
                                                        onClick={() => setActiveTab('chat')}
                                                >
                                                        对话聊天
                                                </button>
                                        </div>

                                        {/* 网页内容分析标签页 */}
                                        {activeTab() === 'analysis' && (
                                                <>
                                                        {/* 网页内容分析 */}
                                                        <div class="bread-ai-section">
                                                                <div class="bread-ai-section-title">
                                                                        页面AI分析
                                                                </div>
                                                                <div class="bread-ai-section-description">
                                                                        使用AI分析当前页面内容，生成总结和关键信息
                                                                </div>
                                                                <button
                                                                        class="bread-ai-btn bread-ai-btn-primary"
                                                                        onClick={
                                                                                props.onSummarize
                                                                        }
                                                                        disabled={
                                                                                props.isLoading
                                                                        }
                                                                >
                                                                        {props.isLoading
                                                                                ? '分析中...'
                                                                                : 'AI分析页面'}
                                                                </button>
                                                        </div>

                                                        {/* AI标记工具 */}
                                                        <div class="bread-ai-section">
                                                                <div class="bread-ai-section-title">
                                                                        AI标记工具
                                                                </div>
                                                                <div class="bread-ai-section-description">
                                                                        标记内容供AI参考，帮助AI更好地理解页面
                                                                </div>
                                                                <button
                                                                        class="bread-ai-btn bread-ai-btn-success"
                                                                        onClick={
                                                                                props.onHighlight
                                                                        }
                                                                >
                                                                        标记选中内容
                                                                </button>
                                                        </div>

                                                        {/* 分析结果 */}
                                                        {(props.result || props.isLoading) && (
                                                                <div class="bread-ai-section">
                                                                        <div class="bread-ai-section-title">
                                                                                AI分析结果
                                                                        </div>
                                                                        <div
                                                                                class="bread-ai-result"
                                                                                classList={{
                                                                                        'bread-ai-result-error':
                                                                                                props.isError,
                                                                                        'bread-ai-result-loading':
                                                                                                props.isLoading,
                                                                                }}
                                                                        >
                                                                                {props.isLoading ? (
                                                                                        <div class="bread-ai-loading">
                                                                                                <div class="bread-ai-spinner"></div>
                                                                                                <span>
                                                                                                        AI正在分析页面内容...
                                                                                                </span>
                                                                                        </div>
                                                                                ) : (
                                                                                        props.result
                                                                                )}
                                                                        </div>
                                                                </div>
                                                        )}
                                                </>
                                        )}

                                        {/* 对话聊天标签页 */}
                                        {activeTab() === 'chat' && (
                                                <div class="bread-ai-chat-container">
                                                        {/* 聊天消息列表 */}
                                                        <div class="bread-ai-chat-messages">
                                                                {chatMessages().length === 0 ? (
                                                                        <div class="bread-ai-chat-empty">
                                                                                开始与AI助手对话，或者点击"插入网页内容"按钮来基于当前页面进行讨论。
                                                                        </div>
                                                                ) : (
                                                                        chatMessages().map((msg) => (
                                                                                <div
                                                                                        class="bread-ai-chat-message"
                                                                                        classList={{
                                                                                                'bread-ai-chat-message-user': msg.role === 'user',
                                                                                                'bread-ai-chat-message-assistant': msg.role === 'assistant',
                                                                                        }}
                                                                                >
                                                                                        <div class="bread-ai-chat-message-role">
                                                                                                {msg.role === 'user' ? '你' : 'AI助手'}
                                                                                        </div>
                                                                                        <div class="bread-ai-chat-message-content">
                                                                                                {msg.content}
                                                                                        </div>
                                                                                        <div class="bread-ai-chat-message-time">
                                                                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                        </div>
                                                                                </div>
                                                                        ))
                                                                )}
                                                        </div>

                                                        {/* 聊天输入区域 */}
                                                        <div class="bread-ai-chat-input-container">
                                                                <div class="bread-ai-chat-input-actions">
                                                                        <button
                                                                                class="bread-ai-chat-action-btn"
                                                                                title="插入网页内容"
                                                                                onClick={() => {
                                                                                        if (props.onGetPageContent) {
                                                                                                const pageContent = props.onGetPageContent()
                                                                                                setChatInput(prev => prev + '\n' + pageContent)
                                                                                        } else {
                                                                                                setChatInput(prev => prev + '\n[页面内容加载失败，请刷新页面后重试]')
                                                                                        }
                                                                                }}
                                                                        >
                                                                                📄 插入当前页面内容
                                                                        </button>
                                                                        <button
                                                                                class="bread-ai-chat-action-btn"
                                                                                title="清除聊天记录"
                                                                                onClick={() => setChatMessages([])}
                                                                                disabled={chatMessages().length === 0}
                                                                        >
                                                                                🗑️ 清除聊天
                                                                        </button>
                                                                </div>
                                                                <div class="bread-ai-chat-input-wrapper">
                                                                        <textarea
                                                                                class="bread-ai-chat-input"
                                                                                placeholder="输入消息... (按 Ctrl+Enter 发送)"
                                                                                value={chatInput()}
                                                                                onInput={(e) => setChatInput(e.currentTarget.value)}
                                                                                onKeyDown={(e) => {
                                                                                        if (e.ctrlKey && e.key === 'Enter' && chatInput().trim()) {
                                                                                                e.preventDefault()
                                                                                                handleSendMessage()
                                                                                        }
                                                                                }}
                                                                                disabled={isSending()}
                                                                                rows={3}
                                                                        />
                                                                        <button
                                                                                class="bread-ai-chat-send-btn"
                                                                                onClick={handleSendMessage}
                                                                                disabled={!chatInput().trim() || isSending()}
                                                                        >
                                                                                {isSending() ? '发送中...' : '发送'}
                                                                        </button>
                                                                </div>
                                                        </div>
                                                </div>
                                        )}
                                </div>
                        )}
                </div>
        )
}

export default AIWindow
