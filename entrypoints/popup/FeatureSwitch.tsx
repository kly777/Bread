import { Component, createSignal, onMount, createEffect, For } from 'solid-js'
import FeatureSetting from './FeatureSetting'

type SettingState = 'default' | 'enabled' | 'disabled'
type SettingType = 'string' | 'number' | 'boolean'

interface FeatureSwitchProps {
        featureName: string
        settings?: Record<string, SettingType>
}

const FeatureSwitch: Component<FeatureSwitchProps> = (props) => {
        const [settingState, setSettingState] =
                createSignal<SettingState>('default')
        const [domain, setDomain] = createSignal('default')

        onMount(async () => {
                // 获取域名
                await new Promise<void>((resolve) => {
                        browser.runtime.sendMessage(
                                { action: 'getDomain' },
                                (response: { domain?: string }) => {
                                        setDomain(response.domain || 'default')
                                        resolve()
                                }
                        )
                })

                // 加载设置
                try {
                        const key = getKeyWithDomain(props.featureName)
                        const storedConfig =
                                await browser.storage.local.get(key)
                        const value = storedConfig[key]

                        if (value !== undefined && value !== null) {
                                setSettingState(value ? 'enabled' : 'disabled')
                        } else {
                                setSettingState('default')
                        }
                } catch (error) {
                        console.warn(
                                `读取${props.featureName}存储配置失败`,
                                error
                        )
                }
        })

        const getKeyWithDomain = (key: string) => {
                const d = domain()
                if (d === 'default') {
                        return `local:${key}`
                }
                return `local:${d}:${key}`
        }

        createEffect(() => {
                const state = settingState()
                const key = getKeyWithDomain(props.featureName)

                if (state === 'default') {
                        browser.storage.local.remove(key).catch((error) => {
                                console.error(`删除${key}配置失败`, error)
                        })
                } else {
                        const value = state === 'enabled'
                        browser.storage.local
                                .set({ [key]: value })
                                .catch((error) => {
                                        console.error(
                                                `保存${key}配置失败`,
                                                error
                                        )
                                })
                }
        })

        const handleRadioChange = (value: SettingState) => {
                setSettingState(value)
        }

        return (
                <div class="feature-switch">
                        <div class="feature-header">
                                <span class="feature-name">
                                        {props.featureName}
                                </span>
                                <div class="setting-options">
                                        <label class="option-item">
                                                <input
                                                        type="radio"
                                                        name={`${props.featureName}-setting`}
                                                        value="default"
                                                        checked={
                                                                settingState() ===
                                                                'default'
                                                        }
                                                        onChange={() =>
                                                                handleRadioChange(
                                                                        'default'
                                                                )
                                                        }
                                                />
                                                <span>默认</span>
                                        </label>
                                        <label class="option-item">
                                                <input
                                                        type="radio"
                                                        name={`${props.featureName}-setting`}
                                                        value="enabled"
                                                        checked={
                                                                settingState() ===
                                                                'enabled'
                                                        }
                                                        onChange={() =>
                                                                handleRadioChange(
                                                                        'enabled'
                                                                )
                                                        }
                                                />
                                                <span>开启</span>
                                        </label>
                                        <label class="option-item">
                                                <input
                                                        type="radio"
                                                        name={`${props.featureName}-setting`}
                                                        value="disabled"
                                                        checked={
                                                                settingState() ===
                                                                'disabled'
                                                        }
                                                        onChange={() =>
                                                                handleRadioChange(
                                                                        'disabled'
                                                                )
                                                        }
                                                />
                                                <span>关闭</span>
                                        </label>
                                </div>
                        </div>

                        {props.settings && (
                                <For each={Object.entries(props.settings)}>
                                        {([settingName, type]) => (
                                                <div class="setting-item">
                                                        <FeatureSetting
                                                                settingName={
                                                                        settingName
                                                                }
                                                                type={type}
                                                                featureName={
                                                                        props.featureName
                                                                }
                                                        />
                                                </div>
                                        )}
                                </For>
                        )}
                </div>
        )
}

export default FeatureSwitch
