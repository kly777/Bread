import { initStripe } from './feature/stripe/stripe'
import { initSettingManager } from './settingManager'




export async function initFunctions() {
        const result = await browser.storage.local.get('local:stripe')
        const stripeEnabled = result['local:stripe'] as boolean | undefined
        if (stripeEnabled) {
                initStripe()
        }
        initSettingManager()
}
