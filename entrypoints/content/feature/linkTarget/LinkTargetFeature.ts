import { initLinkTargetManager, setLinkTargetEnabled } from './linkTarget'
import { Feature } from '../Feature'

/**
 * 链接目标样式功能
 */
export class LinkTargetFeature extends Feature {
        readonly name = 'linkTarget'
        readonly default = true

        private cleanupFunction: (() => void) | null = null

        async init() {
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

        // 以下是从 linkTargetManager.ts 迁移的函数
        private async isLinkTargetFeatureEnabled(): Promise<boolean> {
                try {
                        const enabled =
                                await storage.getItem<boolean>(
                                        'local:linkTarget'
                                )
                        return enabled !== null ? enabled : false // 默认禁用
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
                        await storage.setItem('local:linkTarget', enabled)
                } catch (error) {
                        console.error(
                                'Failed to save link target setting:',
                                error
                        )
                }
        }

        async getLinkTargetStatus(): Promise<boolean> {
                return await this.isLinkTargetFeatureEnabled()
        }

        async toggleLinkTarget(): Promise<boolean> {
                const currentStatus = await this.getLinkTargetStatus()
                const newStatus = !currentStatus
                if (newStatus) {
                        await this.on()
                } else {
                        await this.off()
                }
                return newStatus
        }

        cleanup() {
                if (this.cleanupFunction) {
                        this.cleanupFunction()
                        this.cleanupFunction = null
                }
        }
}
