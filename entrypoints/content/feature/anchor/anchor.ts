function findAnchor(): NodeListOf<HTMLAnchorElement> {
        return document.querySelectorAll('a')
}

type anchorInfo = { title: string; link: string; isExternal: boolean }
function getInfo(anchorElement: HTMLAnchorElement): anchorInfo {
        const rawText = anchorElement.textContent
        // 移除零宽空格并trim
        const text = rawText?.replace(/\u200B/g, '').trim() || ''

        const link = anchorElement.href
        const target = anchorElement.getAttribute('target')?.toLowerCase() || ''

        return {
                title: text,
                link: link,
                isExternal: target === '_blank',
        }
}

export function getAnchorsInfo() {
        const anchorElement = findAnchor()
        let anchorInfos: anchorInfo[] = []
        anchorElement.forEach((anchorElement) => {
                const info = getInfo(anchorElement)
                if (info.link != '' && info.title != '') {
                        anchorInfos.push(info)
                }
        })
        return anchorInfos
}
