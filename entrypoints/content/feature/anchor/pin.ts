// import anchorLay from './anchorLayout.vue'
import './anchor.css'
// import { getAnchorsInfo } from './anchor'
import { manageMutationObserver } from '../../observer/domMutationObserver'
export function pin() {
        if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initAnchorApp)
        } else {
                // 如果已经加载完成，直接执行
                initAnchorApp()
        }
}

function initAnchorApp() {
        const target = document.querySelector('body')
        if (target) {
                const container = document.createElement('div')
                container.classList.add('anchor-container', 'no-translate')
                manageMutationObserver(false)
                target.appendChild(container)
                // createApp(anchorLay, {
                //         textToAnchor: getAnchorsInfo(),
                // }).mount(container)
                manageMutationObserver(true)
                console.log('挂载完成')
        }
}
