/// <reference types="../../types/global.d.ts" />

/**
 * 初始化全局storage对象
 * 在content script和popup中导入此文件以初始化storage
 */

import { storage } from './global-storage'

// 将storage对象挂载到全局作用域，使用breadStorage避免与标准Storage API冲突
if (typeof window !== 'undefined') {
        window.breadStorage = storage
}

// 导出storage对象
export { storage }
