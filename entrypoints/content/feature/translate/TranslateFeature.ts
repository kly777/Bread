import {
    initializeTranslateObserver,
    stopTranslatorObserver,
} from '../../observer/intersectionObserver/translateObserver'
import { Feature } from '../Feature'

export type Translator = 'MS' | 'G'

/**
 * 翻译功能
 */
export class TranslateFeature extends Feature {
    readonly name = 'translate'
    readonly default = false // 实际默认值由 settingManager 根据 isEnglishPage 决定

    private translator: Translator = 'MS'
    private isActive = false

    async init() {
        await this.initTranslator()
    }

    async on() {
        if (this.isActive) return
        await this.initTranslator()
        initializeTranslateObserver()
        this.isActive = true
    }

    async off() {
        if (!this.isActive) return
        stopTranslatorObserver()
        this.isActive = false
    }

    // 以下是从 translateManager.ts 迁移的函数
    private async initTranslator() {
        try {
            const storedTranslator = await storage.getItem<Translator>(
                'local:translator'
            )
            if (storedTranslator === 'MS' || storedTranslator === 'G') {
                this.translator = storedTranslator
            }
        } catch (error) {
            console.warn('Failed to load translator setting:', error)
        }
    }

    async setTranslator(newTranslator: Translator) {
        this.translator = newTranslator
        try {
            await storage.setItem('local:translator', newTranslator)
        } catch (error) {
            console.warn('Failed to save translator setting:', error)
        }
    }

    getTranslator(): Translator {
        return this.translator
    }
}