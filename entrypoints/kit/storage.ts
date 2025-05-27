type StorageKey = `local:${string}`;

export function getKeyWithDomainPop(key: string): StorageKey {
    let domain = "default";
    browser.runtime.sendMessage({ action: "getDomain" }, (response) => {
        domain = response.domain;
    });
    return generateStorageKey(domain, key);
}

export function getKeyWithDomain(key: string): StorageKey {
    const domain = getCurrentDomain();
    console.log("当前域名Domain：", domain);
    return generateStorageKey(domain, key);
}

function getCurrentDomain() {
    // 从当前页面URL提取（content script场景）
    if (typeof window !== "undefined") {
        return window.location.hostname;
    }
    return "default";
}

function generateStorageKey(domain: string, key: string): StorageKey {
    return `local:${domain}:${key}`;
}
