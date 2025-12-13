import { getKeyWithDomain } from './utils/storage/storage'
import { IFeature } from './feature/Feature'
import { BionicFeature } from './feature/bionic/BionicFeature'
import { HighlightFeature } from './feature/highlight/HighlightFeature'
import { TranslateFeature } from './feature/translate/TranslateFeature'
import { StripeFeature } from './feature/stripe/StripeFeature'
import { LinkTargetFeature } from './feature/linkTarget/LinkTargetFeature'

// 设置状态类型定义
interface SettingState {
        value: boolean
        isDefault: boolean
}

const setting: { [key: string]: SettingState } = {
        highlight: { value: false, isDefault: true },
        stripe: { value: false, isDefault: true },
        translate: { value: false, isDefault: true },
        bionic: { value: false, isDefault: true },
        linkTarget: { value: false, isDefault: true },
}

// 导出只读的 setting 副本
export function getSetting(): { [key: string]: boolean } {
        const result: { [key: string]: boolean } = {}
        Object.keys(setting).forEach((key) => {
                result[key] = setting[key].value
        })
        return result
}

// 导出设置状态（包含默认值信息）
export function getSettingState(): { [key: string]: SettingState } {
        return { ...setting }
}

// 创建功能实例
const featureInstances: { [key: string]: IFeature } = {
        bionic: new BionicFeature(),
        highlight: new HighlightFeature(),
        translate: new TranslateFeature(),
        stripe: new StripeFeature(),
        linkTarget: new LinkTargetFeature(),
}

// 通用初始化函数
async function initFeature(key: string) {
        const feature = featureInstances[key]
        if (!feature) return

        try {
                const domainKey = getKeyWithDomain(key) // 生成域名键
                const value = await storage.getItem<boolean>(domainKey)
                await switchFeature(
                        key,
                        value !== null ? value : feature.default
                )
        } catch (err) {
                console.error(`初始化${key}失败`, err)
        }
}

/**
 * 切换指定功能键的特性状态。
 * @param key - 功能键标识符
 * @param newValue - 新的布尔值或null，若为null则使用默认值
 * @param isDefault - 是否为默认值
 * @returns void
 */
async function switchFeature(
        key: string,
        newValue: boolean | null,
        isDefault: boolean = false
) {
        const feature = featureInstances[key]
        if (!feature) return

        // 处理默认值逻辑
        if (newValue === null) {
                newValue = feature.default
                isDefault = true
        }

        // 执行特性开关回调
        if (newValue) {
                await feature.on()
        } else {
                await feature.off()
        }

        // 更新设置状态
        setting[key] = {
                value: newValue,
                isDefault: isDefault,
        }
}

/**
 * 初始化设置管理器，负责同步配置并监听功能开关变化
 * @remarks
 * 该函数会执行以下操作：
 * 1. 同步全局设置
 * 2. 初始化所有功能模块
 * 3. 建立功能配置项的实时监听机制
 */
export function initSettingManager() {
        /**
         * 同步全局设置到本地存储
         */
        syncSettings()

        /**
         * 并行初始化所有功能模块
         * 使用 Promise.all 提高初始化效率
         */
        Object.keys(featureInstances).map((key) =>
                initFeature(key).catch((err) =>
                        console.error(`初始化${key}失败`, err)
                )
        )

        /**
         * 为每个功能项建立存储变更监听器
         * @param key - 功能配置项唯一标识
         * @returns void
         * @internal
         * 使用带域名前缀的存储键进行监听，变化时调用switchFeature处理
         */
        Object.keys(featureInstances).forEach((key) => {
                storage.watch<boolean>(
                        getKeyWithDomain(key),
                        async (newValue: boolean | null) => {
                                try {
                                        await switchFeature(key, newValue)
                                } catch (err) {
                                        console.error(`更新${key}失败`, err)
                                }
                        }
                )
        })

        initShortcuts()
}

function initShortcuts() {
        document.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.key === 'q') {
                        switchFeature('translate', !getSetting()['translate'])
                }
        })
}

/**
 * 从存储中同步功能配置设置到全局setting对象
 * 优先读取域名专属配置，降级使用全局配置，最终回退到默认值
 *
 * @returns {Promise<void>} 无返回值，但会修改全局setting对象
 */
async function syncSettings(): Promise<void> {
        const keys = Object.keys(featureInstances)
        for (const key of keys) {
                const feature = featureInstances[key]
                const domainKey = getKeyWithDomain(key)

                let value = await storage.getItem<boolean>(domainKey)
                let isDefault = false

                if (value === null) {
                        value = await storage.getItem<boolean>(`local:${key}`)
                        if (value === null) {
                                value = feature.default
                                isDefault = true
                        }
                }

                setting[key] = {
                        value: value,
                        isDefault: isDefault,
                }
        }
}
