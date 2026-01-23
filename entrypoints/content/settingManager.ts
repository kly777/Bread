import { IFeature } from './feature/Feature'
import { BionicFeature } from './feature/bionic/BionicFeature'
import { HighlightFeature } from './feature/highlight/HighlightFeature'
import { TranslateFeature } from './feature/translate/TranslateFeature'
import { StripeFeature } from './feature/stripe/StripeFeature'
import { LinkTargetFeature } from './feature/linkTarget/LinkTargetFeature'
// import { AIFeature } from './feature/ai/AIFeature'

interface SettingState {
        value: boolean
        // isDefault: 是否使用 value 作为默认值，如果为false，使用 feature 的 default 作为默认值
        isDefault: boolean
}

const setting: Record<string, SettingState> = {
        highlight: { value: false, isDefault: false },
        stripe: { value: false, isDefault: true },
        translate: { value: false, isDefault: false },
        bionic: { value: false, isDefault: true },
        linkTarget: { value: false, isDefault: true },
        // ai: { value: false, isDefault: true },
}

// 创建功能实例
const featureInstances: Record<string, IFeature> = {
        bionic: new BionicFeature(),
        highlight: new HighlightFeature(),
        translate: new TranslateFeature(),
        stripe: new StripeFeature(),
        linkTarget: new LinkTargetFeature(),
        // ai: new AIFeature(),
}

// 跟踪功能初始化状态
const initializedFeatures = new Set<string>()

// 只读的 setting 副本
export function getSetting(): Record<string, boolean> {
        const result: Record<string, boolean> = {}
        Object.keys(setting).forEach((key) => {
                result[key] = setting[key].value
        })
        return result
}

// 导出设置状态
export function getSettingState(): Record<string, SettingState> {
        return { ...setting }
}

/**
 * 获取当前域名
 * @returns 当前域名
 */
function getCurrentDomain(): string {
        if (typeof window !== 'undefined') {
                return window.location.hostname
        }
        return 'default'
}

/**
 * 切换指定功能状态
 * @param key - 功能键标识符
 * @param newValue - 新的布尔值，true为开启，false为关闭
 * @param isDefault - 是否为默认值
 */
async function switchFeature(
        key: string,
        newValue: boolean,
        isDefault = false
) {
        const feature = featureInstances[key]
        if (!feature) return

        // 如果之前是关闭状态，现在要开启，且未初始化过，则先调用init
        if (newValue && !initializedFeatures.has(key) && feature.init) {
                try {
                        await feature.init()
                        initializedFeatures.add(key)
                } catch (err) {
                        console.error(`初始化${key}失败`, err)
                        return
                }
        }

        // 执行特性开关回调
        try {
                if (newValue) {
                        await feature.on()
                } else {
                        await feature.off()
                }
        } catch (err) {
                console.error(`切换${key}状态失败`, err)
                return
        }

        setting[key] = {
                value: newValue,
                isDefault: isDefault,
        }
}

/**
 * 从存储中加载初始设置并应用到功能
 */
async function loadInitialSettings(): Promise<void> {
        const domain = getCurrentDomain()
        console.log('domain:', domain)
        const storageKey = `settings:${domain}`

        try {
                const result = await browser.storage.local.get(storageKey)
                console.log('result:', result)
                const domainSettings = result[storageKey] as
                        | Record<string, string>
                        | undefined
                console.log('domainSettings:', domainSettings)

                for (const [key, feature] of Object.entries(featureInstances)) {
                        let value: boolean
                        let isDefault = false

                        if (domainSettings && domainSettings[key]) {
                                const storedValue = domainSettings[key]
                                if (storedValue === 'enabled') {
                                        value = true
                                } else if (storedValue === 'disabled') {
                                        value = false
                                } else {
                                        // 'default' 或其他无效值
                                        value = setting[key].isDefault
                                                ? setting[key].value
                                                : feature.default
                                        isDefault = true
                                }
                        } else {
                                // 无存储设置，使用当前setting中的isDefault值
                                value = setting[key].isDefault
                                        ? setting[key].value
                                        : feature.default
                                isDefault = true
                        }

                        await switchFeature(key, value, isDefault)
                }
        } catch (err) {
                console.error('加载初始设置失败', err)
        }
}

function handleStorageChange(
        changes: Record<string, browser.storage.StorageChange>,
        areaName: string
) {
        if (areaName !== 'local') return

        const domain = getCurrentDomain()
        const settingsKey = `settings:${domain}`
        const change = changes[settingsKey]

        if (!change || !change.newValue) return

        const newSettings = change.newValue as Record<string, string>

        for (const [key, storedValue] of Object.entries(newSettings)) {
                const feature = featureInstances[key]
                if (!feature) continue

                let newValue: boolean
                let isDefault = false

                if (storedValue === 'enabled') {
                        newValue = true
                } else if (storedValue === 'disabled') {
                        newValue = false
                } else {
                        // 'default' 或其他无效值
                        newValue = setting[key].isDefault
                                ? setting[key].value
                                : feature.default
                        isDefault = true
                }

                // 只有值发生变化时才切换
                if (newValue !== setting[key].value) {
                        switchFeature(key, newValue, isDefault).catch((err) =>
                                console.error(`处理${key}存储变化失败`, err)
                        )
                }
        }
}

export function initSettingManager() {
        // 加载初始设置
        loadInitialSettings()
                .then(() => {
                        console.log('设置管理器初始化完成', setting)
                })
                .catch((err) => {
                        console.error('设置管理器初始化失败', err)
                })

        // 监听存储变化
        browser.storage.onChanged.addListener(handleStorageChange)

        // 初始化快捷键
        initShortcuts()
}

function initShortcuts() {
        document.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.key === 'q') {
                        const currentSetting = getSetting()
                        const newValue = !currentSetting['translate']
                        switchFeature('translate', newValue).catch((err) =>
                                console.error('切换翻译功能失败', err)
                        )
                }
        })
}
