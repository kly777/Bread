import { Component, createSignal, onMount, onCleanup } from 'solid-js'
import './ai.css'

interface AIWindowProps {
        onClose: () => void
        onSummarize: () => Promise<void>
        onHighlight: () => void
        result: string
        isLoading: boolean
        isError: boolean
}

const AIWindow: Component<AIWindowProps> = (props) => {
        const [isMinimized, setIsMinimized] = createSignal(false)
        const [position, setPosition] = createSignal({ x: 20, y: 100 })
        const [isDragging, setIsDragging] = createSignal(false)
        const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 })

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
                                        {/* 网页内容分析 */}
                                        <div class="bread-ai-section">
                                                <div class="bread-ai-section-title">
                                                        网页内容分析
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
                                                                : '总结当前页面'}
                                                </button>
                                        </div>

                                        {/* 重点标记工具 */}
                                        <div class="bread-ai-section">
                                                <div class="bread-ai-section-title">
                                                        重点标记工具
                                                </div>
                                                <div class="bread-ai-section-description">
                                                        选择页面上的文本或元素进行标记
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
                                                                分析结果
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
                                                                                        正在分析页面内容...
                                                                                </span>
                                                                        </div>
                                                                ) : (
                                                                        props.result
                                                                )}
                                                        </div>
                                                </div>
                                        )}
                                </div>
                        )}
                </div>
        )
}

export default AIWindow
