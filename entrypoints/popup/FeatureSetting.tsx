import { createSignal, onMount, createEffect } from 'solid-js';

interface FeatureSettingProps {
  settingName: string;
  type: 'string' | 'number' | 'boolean';
  featureName: string;
}

type FeatureSettingConfig = string | number | boolean;
type StorageKey = `local:${string}` | `session:${string}` | `sync:${string}` | `managed:${string}`;

export default function FeatureSetting(props: FeatureSettingProps) {
  const key: StorageKey = `local:${props.featureName + props.settingName}`;
  const [setting, setSetting] = createSignal<FeatureSettingConfig>();

  onMount(async () => {
    try {
      // 从storage读取持久化配置
      const storedConfig = (await browser.storage.local.get(key))[key] as FeatureSettingConfig | null;
      if (storedConfig !== undefined && storedConfig !== null) {
        setSetting(storedConfig);
      }
    } catch (error) {
      console.warn(`读取${key}存储配置失败`, error);
    }
  });

  // 监听 setting 变化并保存到 storage
  createEffect(() => {
    const value = setting();
    if (value !== undefined && value !== null) {
      browser.storage.local.set({ [key]: value }).catch((error) => {
        console.error(`保存${key}配置失败:`, error);
      });
    }
  });

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    let value: FeatureSettingConfig;
    
    if (props.type === 'boolean') {
      value = target.checked;
    } else if (props.type === 'number') {
      value = parseFloat(target.value);
      if (isNaN(value)) value = 0;
    } else {
      value = target.value;
    }
    
    setSetting(value);
  };

  return (
    <div class="feature-settings">
      <div class="setting-item">
        <label>{props.settingName}:</label>

        {/* 布尔值类型 */}
        {props.type === 'boolean' && (
          <input
            type="checkbox"
            checked={setting() as boolean}
            onChange={handleInputChange}
            id={`${props.featureName}-${props.settingName}-checkbox`}
          />
        )}

        {/* 数值类型 */}
        {props.type === 'number' && (
          <input
            type="number"
            value={setting() as number || 0}
            onChange={handleInputChange}
            id={`${props.featureName}-${props.settingName}-number`}
            class="numeric-input"
          />
        )}

        {/* 字符串类型 */}
        {props.type === 'string' && (
          <input
            type="text"
            value={setting() as string || ''}
            onChange={handleInputChange}
            id={`${props.featureName}-${props.settingName}-text`}
            class="text-input"
          />
        )}
      </div>
    </div>
  );
}