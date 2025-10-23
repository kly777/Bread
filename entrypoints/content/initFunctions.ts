import { initStripe } from './feature/stripe/stripe'
import { initSettingManager } from './settingManager'

export async function initFunctions() {
        const stripeEnabled = await storage.getItem('local:stripe')
        if (stripeEnabled) {
                initStripe()
        }
        initSettingManager()
}
