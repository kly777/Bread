import { initStripe } from "./feature/stripe/stripe";
import { openBionic, stopBionic } from "./featureManager/bionicManager";
import {
  openHighlight,
  stopHighlight,
} from "./featureManager/highlightManager";
import {
  openTranslate,
  stopTranslate,
} from "./featureManager/translateManager";

export let setting: { [key: string]: boolean } = {
  highlight: true,
  stripe: true,
  translate: true,
  bionic: true,
};

// 状态配置：定义各功能的键名、默认值、启用/停用函数
type StorageKey = `local:${string}`;

interface FeatureConfig {
  key: StorageKey;
  defaultValue: boolean;
  on: () => void | Promise<void>;
  off: () => void;
}

const featureConfigs: { [key: string]: FeatureConfig } = {
  bionic: {
    key: "local:bionic",
    defaultValue: true,
    on: openBionic,
    off: stopBionic,
  },
  highlight: {
    key: "local:highlight",
    defaultValue: true,
    on: openHighlight,
    off: stopHighlight,
  },
  translate: {
    key: "local:translate",
    defaultValue: true,
    on: openTranslate,
    off: stopTranslate,

  },
  stripe: {
    key: "local:stripe",
    defaultValue: false,
    on: initStripe,
    off: () => { }, // stripe无明确关闭函数，留空
  },
};

// 状态存储（模块内部私有）
const state: { [key: string]: boolean } = {};

// 通用初始化函数
async function initFeature(key: string) {
  const config = featureConfigs[key];
  if (config) {
    try {
      const value = await storage.getItem<boolean>(config.key);
      updateFeature(key, value !== null ? value : config.defaultValue);
    } catch (err) {
      console.error(`初始化${key}失败`, err);
    }
  }
}

// 通用状态更新函数
function updateFeature(key: string, newValue: boolean | null) {
  const config = featureConfigs[key];
  if (!config) return;

  if (newValue === null) {
    storage.setItem<boolean>(config.key, config.defaultValue);
    newValue = config.defaultValue;
  }

  if (newValue) {
    config.on();
  } else {
    config.off();
  }

  state[key] = newValue;
  setting[key] = newValue; // 同步setting对象
}

// 初始化所有功能
export function initSettingManager() {
  // 同步setting对象
  syncSettings();

  Object.keys(featureConfigs).forEach((key) => {
    // 初始化
    initFeature(key).catch((err) => console.error(`初始化${key}失败`, err));

    // 监听存储变化
    storage.watch<boolean>(
      featureConfigs[key].key,
      async (newValue: boolean | null) => {
        try {
          updateFeature(key, newValue);
        } catch (err) {
          console.error(`更新${key}失败`, err);
        }
      }
    );
  });

  // 初始化bionic的特殊逻辑
  storage
    .getItem<boolean>("local:bionic")
    .then((newValue: any) => {
      if (newValue) {
        initBionic();
      }
    })
    .catch((err: any) => console.error("初始化bionic失败", err));

  storage.watch<boolean>("local:bionic", async (newValue: boolean | null) => {
    try {
      updateFeature("bionic", newValue);
    } catch (err) {
      console.error("更新bionic失败", err);
    }
  });
}

// 特殊处理：bionic的DOM加载逻辑
function initBionic() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      openBionic();
      console.log("DOM 就绪时执行");
    });
  } else {
    window.requestIdleCallback(() => {
      openBionic();
      console.log("延迟到窗口加载完成");
    });
  }
}

// 同步setting对象
function syncSettings() {
  for (const key in featureConfigs) {
    if (Object.prototype.hasOwnProperty.call(featureConfigs, key)) {
      const config = featureConfigs[key];
      storage
        .getItem<boolean>(config.key)
        .then((value: boolean | null) => {
          if (value !== null) {
            setting[key] = value;
          }
        })
        .catch((err: any) => console.error(`同步${key}设置失败`, err));
    }
  }
}
