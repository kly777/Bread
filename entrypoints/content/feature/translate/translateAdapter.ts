import { TranslateFeature, Translator } from './TranslateFeature'

// 创建全局实例（单例）
const translateFeature = new TranslateFeature()

// 当前翻译器变量，与 translateFeature 同步
let currentTranslator: Translator = 'MS'

// 初始化翻译器设置（异步）
translateFeature
        .init()
        .then(() => {
                currentTranslator = translateFeature.getTranslator()
        })
        .catch(() => {})

// 重新导出类型和函数
export type { Translator }
export const translator: Translator = currentTranslator // 导出变量，但注意这是静态的；使用 getTranslator() 获取最新值

// 设置翻译器
export async function setTranslator(newTranslator: Translator) {
        await translateFeature.setTranslator(newTranslator)
        currentTranslator = newTranslator
}

// 获取当前翻译器
export function getTranslator(): Translator {
        return translateFeature.getTranslator()
}

// 以下函数为了兼容性保留，但实际调用会委托给 translateFeature
export async function openTranslate() {
        await translateFeature.on()
}

export function stopTranslate() {
        translateFeature.off()
}
