import { removeBionicEffects } from './bionicNode'
import { manageMutationObserver } from '../../observer/domMutationObserver'
import {
        parentToTextNodesMap,
        initializeSingleUseObserver,
        bionicTextObserver,
        observeElementNode,
} from '../../observer/intersectionObserver/bionicObserver'
import { Feature } from '../Feature'
import { registerNewElementsHook } from '../../observer/observerHooks'

/**
 * 仿生阅读功能
 */
export class BionicFeature extends Feature {
        readonly name = 'bionic'
        readonly default = false

        private isActive = false

        async init() {
                // 注册新元素钩子
                registerNewElementsHook((elements) => {
                        if (this.isActive) {
                                elements.forEach((element) => {
                                        observeElementNode(element)
                                })
                        }
                })

                // 特殊处理：bionic的DOM加载逻辑已移除自动调用this.on()
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
