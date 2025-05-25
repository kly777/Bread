import { initializeTranslateObserver,stopTranslatorObserver } from "../observer/intersectionObserver/translateObserver";

type Translator = "MS" | "G";
export let translator: Translator = "MS";
// TODO: 实现切换翻译引擎
export async function openTranslate() {
    initializeTranslateObserver();
}

export function stopTranslate() {
    stopTranslatorObserver();
}
