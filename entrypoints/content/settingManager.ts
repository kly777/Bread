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
  off: () => void | Promise<void>;
}

let setting: { [key: string]: boolean } = {
  highlight: false,
  stripe: false,
  translate: false,
  bionic: false,
};
// 导出只读的 setting 副本
export function getSetting(): { [key: string]: boolean } {
  return { ...setting };
}

const features: { [key: string]: FeatureConfig } = {
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
  const config = features[key];
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

/**
 * 切换指定功能键的特性状态。
 * @param key - 功能键标识符，用于查找对应的配置
 * @param newValue - 新的布尔值或null，若为null则使用默认值
 * @returns void
 */
async function switchFeature(key: string, newValue: boolean | null) {
  const config = features[key];
  if (!config) return;

  // 处理默认值逻辑
  if (newValue === null) {
    newValue = config.default;
  }

  // 执行特性开关回调
  if (newValue) {
    await config.on();
  } else {
    await config.off();
  }

  // 持久化存储当前状态
  setting[key] = newValue;
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
   * @internal
   * 此方法会从远程服务获取最新设置并持久化存储
   */
  syncSettings();
  /**
   * 并行初始化所有功能模块
   * 使用 Promise.all 提高初始化效率
   */
  Object.keys(features).map((key) =>
    initFeature(key).catch((err) => console.error(`初始化${key}失败`, err))
  );

  /**
   * 为每个功能项建立存储变更监听器
   * @param key - 功能配置项唯一标识
   * @returns void
   * @internal
   * 使用带域名前缀的存储键进行监听，变化时调用switchFeature处理
   */
  Object.keys(features).forEach((key) => {
    storage.watch<boolean>(
      getKeyWithDomain(key),
      async (newValue: boolean | null) => {
        try {
          await switchFeature(key, newValue);
        } catch (err) {
          console.error(`更新${key}失败`, err);
        }
      }
    );
  });

  initShortcuts();
}

function initShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "q") {
      switchFeature("translate", !getSetting()["translate"]);
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
  const keys = Object.keys(features);
  for (const key of keys) {
    const config = features[key];
    const domainKey = getKeyWithDomain(key);

    let value = await storage.getItem<boolean>(domainKey);
    if (value === null) {
      value = await storage.getItem<boolean>(`local:${key}`);
    }

    setting[key] = value !== null ? value : config.default;
  }
}