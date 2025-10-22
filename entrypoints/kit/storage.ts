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

    return generateStorageKey(domain, key);
}

let currentDomain: string | null = null;
function getCurrentDomain() {
    if (currentDomain) {
        return currentDomain;
    }
    // 从当前页面URL提取（content script场景）
    if (typeof window !== "undefined") {
        currentDomain = window.location.hostname;
        console.log('域名为', currentDomain);
        return currentDomain;
    }
    return "default";
}

function generateStorageKey(domain: string, key: string): StorageKey {
    return `local:${domain}:${key}`;
}
