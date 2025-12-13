import { removeBionicEffects } from './bionicNode'
import { manageMutationObserver } from '../../observer/domMutationObserver'
import {
    parentToTextNodesMap,
    initializeSingleUseObserver,
    bionicTextObserver,
} from '../../observer/intersectionObserver/bionicObserver'
import { Feature } from '../Feature'

/**
 * 仿生阅读功能
 */
export class BionicFeature extends Feature {
    readonly name = 'bionic'
    readonly default = false

    private isActive = false

    async init() {
        // 特殊处理：bionic的DOM加载逻辑
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.on()
                console.log('DOM 就绪时执行')
            })
        } else {
            window.requestIdleCallback(() => {
                this.on()
                console.log('延迟到窗口加载完成')
            })
        }
    }

    async on() {
        if (this.isActive) return
        initializeSingleUseObserver()
        manageMutationObserver(true)
        this.isActive = true
    }

    async off() {
        if (!this.isActive) return
        manageMutationObserver(false)
        bionicTextObserver.disconnect()
        parentToTextNodesMap.clear()
        removeBionicEffects()
        this.isActive = false
    }
}