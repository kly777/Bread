
type StorageKey = `local:${string}`;



export function getKeyWithDomainPop(key: string): StorageKey {
  let domain = "default";
  browser.runtime.sendMessage({ action: "getDomain" }, (response) => {
    domain = response.domain

  });
  return `local:${domain}:${key}`;
}

export function getKeyWithDomain(key: string): StorageKey {
  const domain = getCurrentDomain();
  console.log("当前域名Domain：", domain);
  return `local:${domain}:${key}`;
}
// 根据运行环境获取当前域名（示例：content script 或 popup）
function getCurrentDomain() {
  // 方式1：从当前页面URL提取（content script场景）
  if (typeof window !== "undefined") {
    return window.location.hostname;
  }

  // 方式2：通过浏览器API（扩展后台场景）
  // if (typeof chrome !== "undefined" && chrome.tabs) {
  //   let tab = await new Promise<chrome.tabs.Tab>((resolve) => {
  //     chrome.tabs.getCurrent((tab) => resolve(tab));
  //   });
  //   return new URL(tab.url!).hostname;
  // }

  return "default";
}
// async function getCurrentUrl() {
//   try {
//     const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
//     if (tabs && tabs.length > 0 && tabs[0].url) {
//       return formatDomain(tabs[0].url);
//     }
//     return null;
//   } catch (error) {
//     console.error('获取标签页失败:', error)
//     return null;
//   }
// }
// function formatDomain(hostname: string) {

//   const rexExp = /(https?:\/\/(.+?)\/)/ig
//   const matchResult = hostname.trim().match(rexExp);

//   // 返回完整域名或原始值
//   return matchResult ? matchResult[0].split(/\/+/)[1] : hostname;
// }