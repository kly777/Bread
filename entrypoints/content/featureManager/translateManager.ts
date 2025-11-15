import {
        initializeTranslateObserver,
        stopTranslatorObserver,
} from '../observer/intersectionObserver/translateObserver'

export type Translator = 'MS' | 'G'
export let translator: Translator = 'MS'

// 翻译器存储键
const TRANSLATOR_STORAGE_KEY = 'translator'

// 初始化翻译器设置
async function initTranslator() {
        try {
                const storedTranslator = await storage.getItem<Translator>(
                        `local:${TRANSLATOR_STORAGE_KEY}`
                )
                if (storedTranslator === 'MS' || storedTranslator === 'G') {
                        translator = storedTranslator
                }
        } catch (error) {
                console.warn('Failed to load translator setting:', error)
        }
}

// 设置翻译器
export async function setTranslator(newTranslator: Translator) {
        translator = newTranslator
        try {
                await storage.setItem(
                        `local:${TRANSLATOR_STORAGE_KEY}`,
                        newTranslator
                )
        } catch (error) {
                console.warn('Failed to save translator setting:', error)
        }
}

// 获取当前翻译器
export function getTranslator(): Translator {
        return translator
}

export async function openTranslate() {
        await initTranslator()
        initializeTranslateObserver()
}

export function stopTranslate() {
        stopTranslatorObserver()
}
