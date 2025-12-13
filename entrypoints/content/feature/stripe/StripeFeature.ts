import { initStripe } from './stripe'
import { Feature } from '../Feature'

/**
 * 条纹背景功能
 */
export class StripeFeature extends Feature {
    readonly name = 'stripe'
    readonly default = false

    async on() {
        initStripe()
    }

    async off() {
        // stripe无明确关闭函数，留空
    }
}