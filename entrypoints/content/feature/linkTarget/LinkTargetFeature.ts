import {
        initLinkTargetManager,
        setLinkTargetEnabled,
        applyStyleToLink,
} from './linkTarget'
import { Feature } from '../Feature'
import {
        registerNewElementsHook,
        registerAttributeChangesHook,
} from '../../observer/observerHooks'

/**
 * 链接目标样式功能
 */

export class LinkTargetFeature extends Feature {
        readonly name = 'linkTarget'
        readonly default = true

        private cleanupFunction: (() => void) | null = null

        async init() {
                // 注册新元素钩子
                registerNewElementsHook((elements) => {
                        this.processLinkTargetElements(elements)
                })

                // 注册属性变化钩子
                registerAttributeChangesHook((mutations) => {
                        mutations.forEach((mutation) => {
                                if (
                                        mutation.type === 'attributes' &&
                                        mutation.attributeName === 'target' &&
                                        mutation.target instanceof
                                                HTMLAnchorElement
                                ) {
                                        applyStyleToLink(mutation.target)
                                }
                        })
                })

                // 检查功能是否启用
                const enabled = await this.isLinkTargetFeatureEnabled()
                if (enabled) {
                        this.cleanupFunction = initLinkTargetManager()
                }
        }

        async on() {
                // 保存设置
                await this.setLinkTargetFeatureEnabled(true)
                // 启用功能
                setLinkTargetEnabled(true)
                // 如果还没有初始化，则初始化
                if (!this.cleanupFunction) {
                        this.cleanupFunction = initLinkTargetManager()
                }
        }

        async off() {
                // 保存设置
                await this.setLinkTargetFeatureEnabled(false)
                // 禁用功能
                setLinkTargetEnabled(false)
                // 执行清理
                if (this.cleanupFunction) {
                        this.cleanupFunction()
                        this.cleanupFunction = null
                }
        }

        // 处理新增元素中的链接目标样式
        private processLinkTargetElements(elements: Element[]) {
                for (const element of elements) {
                        // 检查元素本身是否为链接
                        if (element instanceof HTMLAnchorElement) {
                                applyStyleToLink(element)
                        }

                        // 检查元素内的所有链接
                        const links = element.querySelectorAll('a')
                        for (const link of links) {
                                if (link instanceof HTMLAnchorElement) {
                                        applyStyleToLink(link)
                                }
                        }
                }
        }

        // 以下是从 linkTargetManager.ts 迁移的函数
        private async isLinkTargetFeatureEnabled(): Promise<boolean> {
                try {
                        const result =
                                await browser.storage.local.get(
                                        'local:linkTarget'
                                )
                        const enabled = result['local:linkTarget'] as
                                | boolean
                                | undefined
                        return enabled !== undefined ? enabled : false // 默认禁用
                } catch (error) {
                        console.warn(
                                'Failed to read link target setting:',
                                error
                        )
                        return false
                }
        }

        private async setLinkTargetFeatureEnabled(
                enabled: boolean
        ): Promise<void> {
                try {
                        await browser.storage.local.set({
                                'local:linkTarget': enabled,
                        })
                } catch (error) {
                        console.error(
                                'Failed to save link target setting:',
                                error
                        )
                }
        }
}
