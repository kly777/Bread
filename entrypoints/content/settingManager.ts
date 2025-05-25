import { getKeyWithDomain } from "../kit/storage";
import { initStripe } from "./feature/stripe/stripe";
import { initBionic, openBionic, stopBionic } from "./featureManager/bionicManager";
import {
  openHighlight,
  stopHighlight,
} from "./featureManager/highlightManager";
import {
  openTranslate,
  stopTranslate,
} from "./featureManager/translateManager";



// 状态配置：定义各功能的键名、默认值、启用/停用函数
interface FeatureConfig {
  default: boolean;
  init?: () => void | Promise<void>; // 可选的初始化函数
  on: () => void | Promise<void>;
  off: () => void;
}

export let setting: { [key: string]: boolean } = {
  highlight: false,
  stripe: false,
  translate: false,
  bionic: false,
};

const featureConfigs: { [key: string]: FeatureConfig } = {
  bionic: {
    default: false,
    init: initBionic, // 特殊处理：bionic的初始化
    on: openBionic,
    off: stopBionic,
  },
  highlight: {
    default: false,
    on: openHighlight,
    off: stopHighlight,
  },
  translate: {
    default: false,
    on: openTranslate,
    off: stopTranslate,
  },
  stripe: {
    default: false,
    on: initStripe,
    off: () => { }, // stripe无明确关闭函数，留空
  },
};

// 通用初始化函数
async function initFeature(key: string) {
  const config = featureConfigs[key];
  if (config) {
    try {
      const domainKey = getKeyWithDomain(key); // 生成域名键
      const value = await storage.getItem<boolean>(domainKey);
      switchFeature(key, value !== null ? value : config.default);
    } catch (err) {
      console.error(`初始化${key}失败`, err);
    }
  }
}

function switchFeature(key: string, newValue: boolean | null) {
  const config = featureConfigs[key];
  if (!config) return;
  if (newValue === null) {
    newValue = config.default;
  }
  if (newValue) {
    config.on();
  } else {
    config.off();
  }
  setting[key] = newValue;
}

// 初始化所有功能
export function initSettingManager() {
  // 同步setting
  syncSettings();

  Object.keys(featureConfigs).forEach((key) => {
    // 初始化
    initFeature(key).catch((err) => console.error(`初始化${key}失败`, err));

    // 监听存储变化
    storage.watch<boolean>(
      getKeyWithDomain(key),
      async (newValue: boolean | null) => {
        try {
          switchFeature(key, newValue);
        } catch (err) {
          console.error(`更新${key}失败`, err);
        }
      }
    );
  });
}



// 从storage同步setting
async function syncSettings() {
  for (const key in featureConfigs) {
    const config = featureConfigs[key];
    const domainKey = getKeyWithDomain(key);

    // 优先读取网站专属配置
    let value = await storage.getItem<boolean>(domainKey);
    if (value === null) {
      // 降级读取全局配置
      value = await storage.getItem<boolean>(`local:${key}`);
    }

    setting[key] = value !== null ? value : config.default;
  }
}