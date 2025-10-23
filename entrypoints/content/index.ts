import './style.css'
import { initFunctions } from './initFunctions'
import { pin } from './feature/anchor/pin'

export default defineContentScript({
        matches: ['<all_urls>'],

        async main() {
                await initFunctions()
                pin()
        },
})
