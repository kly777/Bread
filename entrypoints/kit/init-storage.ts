/**
 * 初始化全局storage对象
 * 在content script和popup中导入此文件以初始化storage
 */

import { storage } from './global-storage'

// 将storage对象挂载到全局作用域
if (typeof window !== 'undefined') {
        ;(window as any).storage = storage
}

// 导出storage对象
export { storage }
