import { render } from 'solid-js/web'
import './style.css'
import App from './App'
let tmp_domain: string = 'default'
await browser.runtime
        .sendMessage({ action: 'getDomain' })
        .then((response: { domain?: string }) => {
                console.log('response:', response)
                tmp_domain = response.domain || 'default'
        })

export const domain = tmp_domain
const appContainer = document.getElementById('app')
if (appContainer) {
        render(() => <App />, appContainer)
}
