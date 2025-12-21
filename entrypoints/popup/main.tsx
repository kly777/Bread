import { render } from 'solid-js/web'
import './style.css'
import App from './App'
import { initDomain } from './domain'

// 初始化域名
await initDomain()

const appContainer = document.getElementById('app')
if (appContainer) {
        render(() => <App />, appContainer)
}
