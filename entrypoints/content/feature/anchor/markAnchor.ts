import { getAnchorsInfo } from './anchor'
export function markAnchor() {
        const anchorsInfo = getAnchorsInfo()
        anchorsInfo.forEach((anchor) => {
                if (anchor.isExternal) {
                        // TODO: 处理外部链接标记逻辑
                }
        })
}
