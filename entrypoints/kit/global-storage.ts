/**
 * 全局storage对象，替代wxt的storage
 * 在需要的地方导入此文件以使用storage对象
 */

import * as storageImpl from './storage'

// 导出与wxt storage兼容的接口
export const storage = {
  getItem: storageImpl.getItem,
  setItem: storageImpl.setItem,
  setItems: storageImpl.setItems,
  removeItem: storageImpl.removeItem,
  watch: storageImpl.watch,
  clear: storageImpl.clear,
  getAll: storageImpl.getAll,
}

// 全局声明（如果需要）
declare global {
  // 注意：这不会真正创建全局变量，只是类型声明
  // 实际使用需要导入storage对象
}