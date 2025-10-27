import './style.css'
import { initFunctions } from './initFunctions'
import { pin } from './feature/anchor/pin'
export default defineContentScript({
        matches: ['<all_urls>'],

        async main() {
                console.log('-'.repeat(20))
                console.log('content script loaded')

                await initFunctions()
                pin()
        },
})
