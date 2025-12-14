import { createAnchorLayout } from './anchorLayout'
import './anchor.css'
// import { getAnchorsInfo } from './anchor'
import { manageMutationObserver } from '../../observer/domMutationObserver'


export function initAnchorApp() {
        const target = document.querySelector('body')
        if (target) {
                const container = document.createElement('div')
                container.classList.add('anchor-container', 'no-translate')
                manageMutationObserver(false)
                target.appendChild(container)
                // 创建原生 anchor 组件
                const anchorElement = createAnchorLayout()
                container.appendChild(anchorElement)
                manageMutationObserver(true)
                console.log('挂载完成')
        }
}
