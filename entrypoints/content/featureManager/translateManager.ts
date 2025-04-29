import { initializeTranslateObserver } from "../observer/intersectionObserver/translateObserver";

export async function openTranslate() {
    initializeTranslateObserver();
}

export function stopTranslate() {
    document
        .querySelectorAll<HTMLElement>(".translation-result")
        .forEach((tr) => {
            tr.remove();
        });
}
