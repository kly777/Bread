/**
 * 安全获取当前域名的增强函数
 * @description 支持以下场景：
 * 1. 内容脚本（content script）直接获取页面域名
 * 2. 弹出层/后台脚本通过 tabs API 获取活动标签页域名
 * 3. 降级处理无法获取域名的场景
 */
export async function getCurrentDomainEnhanced(): Promise<string> {
  // 场景1：内容脚本环境直接获取
  if (typeof window !== "undefined" && window.location) {
    return window.location.hostname;
  }

  // 场景2：扩展上下文使用 tabs API
  try {
    // 检查 API 可用性
    if (typeof chrome === "undefined" || !chrome.tabs?.query) {
      throw new Error('浏览器API不可用');
    }

    // 获取活动标签页
    const tabs = await chrome.tabs.query({ 
      active: true,
      currentWindow: true,
      status: 'complete'
    });

    // 强化空值校验
    if (!tabs || tabs.length === 0 || !tabs[0].url) {
      return 'default';
    }

    // 提取并格式化域名
    const url = new URL(tabs[0].url);
    return formatDomain(url.hostname);
  } catch (error) {
    console.error('域名获取失败:', error);
    // 场景3：降级处理
    return 'default';
  }
}

/**
 * 优化后的域名格式化函数
 * @param hostname - 原始主机名
 * @returns 标准化域名（如 "example.com"）
 */
function formatDomain(hostname: string): string {
  // 移除端口号和路径
  const cleanHost = hostname.replace(/:[\d]+$/, '');
  // 处理带www前缀的情况
  return cleanHost.replace(/^www\./i, '');
}