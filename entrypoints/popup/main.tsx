import { render } from 'solid-js/web'
import './style.css'
import App from './App'
import { domainSettingStorage } from '../common/storage'
let domain: string = 'default'
await browser.runtime
        .sendMessage({ action: 'getDomain' })
        .then((response: { domain?: string }) => {
          console.log('response:', response)
                domain = response.domain || 'default'
        })

export const settingStorage = new domainSettingStorage(domain)

const appContainer = document.getElementById('app')
if (appContainer) {
        render(() => <App />, appContainer)
}
