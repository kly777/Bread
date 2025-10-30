/**
 * 链接目标样式功能管理器
 * 
 * 集成到Bread扩展的设置系统中
 */

import { initLinkTargetManager, setLinkTargetEnabled } from '../feature/linkTarget/linkTargetManager'

let cleanupFunction: (() => void) | null = null

/**
 * 初始化链接目标样式功能
 */
export async function initLinkTarget(): Promise<void> {
  try {
    // 检查功能是否启用
    const enabled = await isLinkTargetFeatureEnabled()
    
    if (enabled) {
      cleanupFunction = initLinkTargetManager()
    }
  } catch (error) {
    console.error('Failed to initialize link target feature:', error)
  }
}

/**
 * 启用链接目标样式功能
 */
export async function openLinkTarget(): Promise<void> {
  try {
    // 保存设置
    await setLinkTargetFeatureEnabled(true)
    
    // 启用功能
    setLinkTargetEnabled(true)
    
    // 如果还没有初始化，则初始化
    if (!cleanupFunction) {
      cleanupFunction = initLinkTargetManager()
    }
  } catch (error) {
    console.error('Failed to enable link target feature:', error)
  }
}

/**
 * 禁用链接目标样式功能
 */
export async function stopLinkTarget(): Promise<void> {
  try {
    // 保存设置
    await setLinkTargetFeatureEnabled(false)
    
    // 禁用功能
    setLinkTargetEnabled(false)
    
    // 执行清理
    if (cleanupFunction) {
      cleanupFunction()
      cleanupFunction = null
    }
  } catch (error) {
    console.error('Failed to disable link target feature:', error)
  }
}

/**
 * 检查链接目标样式功能是否启用
 */
async function isLinkTargetFeatureEnabled(): Promise<boolean> {
  try {
    // 从存储中获取设置
    const enabled = await storage.getItem<boolean>('local:linkTarget')
    return enabled !== null ? enabled : false // 默认禁用
  } catch (error) {
    console.warn('Failed to read link target setting:', error)
    return false
  }
}

/**
 * 设置链接目标样式功能启用状态
 */
async function setLinkTargetFeatureEnabled(enabled: boolean): Promise<void> {
  try {
    await storage.setItem('local:linkTarget', enabled)
  } catch (error) {
    console.error('Failed to save link target setting:', error)
  }
}

/**
 * 获取链接目标样式功能的当前状态
 */
export async function getLinkTargetStatus(): Promise<boolean> {
  return await isLinkTargetFeatureEnabled()
}

/**
 * 切换链接目标样式功能状态
 */
export async function toggleLinkTarget(): Promise<boolean> {
  const currentStatus = await getLinkTargetStatus()
  const newStatus = !currentStatus
  
  if (newStatus) {
    await openLinkTarget()
  } else {
    await stopLinkTarget()
  }
  
  return newStatus
}

/**
 * 清理链接目标样式功能
 */
export function cleanupLinkTarget(): void {
  if (cleanupFunction) {
    cleanupFunction()
    cleanupFunction = null
  }
}