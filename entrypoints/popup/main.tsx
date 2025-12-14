import { render } from 'solid-js/web'
import './style.css'
import App from './App'

const appContainer = document.getElementById('app')
if (appContainer) {
        render(() => <App />, appContainer)
}
