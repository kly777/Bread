import { getAnchorsInfo } from './anchor'
export function markAnchor() {
        const anchorsInfo = getAnchorsInfo()
        anchorsInfo.forEach((anchor) => {
                if (anchor.isExternal) {
                }
        })
}
