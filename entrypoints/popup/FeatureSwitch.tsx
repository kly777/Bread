import { Component, createSignal, onMount, createEffect, For } from 'solid-js'
import FeatureSetting from './FeatureSetting'
import { featureSettingStorage } from '../common/storage'
import { settingStorage } from './main'

type SettingState = 'default' | 'enabled' | 'disabled'
type SettingType = 'string' | 'number' | 'boolean'

interface FeatureSwitchProps {
        featureName: string
        settings?: Record<string, SettingType>
}

const FeatureSwitch: Component<FeatureSwitchProps> = (props) => {
        const [settingState, setSettingState] =
                createSignal<SettingState>('default')

        // 获取 domain 并创建 featureSettingStorage 实例
        const getFeatureStorage = () => {
                const domain = settingStorage.getDomain()
                return new featureSettingStorage(props.featureName, domain)
        }

        onMount(async () => {
                // 加载设置
                try {
                        const featureStorage = getFeatureStorage()
                        const value = await featureStorage.get()

                        if (value === 'enabled' || value === 'disabled') {
                                setSettingState(value)
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

        const handleRadioChange = async (value: SettingState) => {
          console.log('handleRadioChange', value)
                setSettingState(value)
                try {
                        const featureStorage = getFeatureStorage()
                        await featureStorage.set(value)
                } catch (error) {
                        console.warn(
                                `写入${props.featureName}存储配置失败`,
                                error
                        )
                }
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
