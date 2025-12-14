import { initAnchorApp } from './pin'

export function pin() {
        if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initAnchorApp)
        } else {
                // 如果已经加载完成，直接执行
                initAnchorApp()
        }
}
