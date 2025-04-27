import { highlightSelectedTextInNode } from "../feature/highlight/highlight";
import {
    highlightTextInNode,
    removeHighlights,
} from "../feature/highlight/highlightNode";
import { getSelectedText } from "../kit/getSelectedText";
import { manageMutationObserver } from "../observer/domMutationObserver";

import {
    nonTextParentElements,
    initializeContinuedObserver,
} from "../observer/intersectionObserver/stableIntersectionObserver";

export function openHighlight() {
    initializeContinuedObserver();
    document.addEventListener("mouseup", highlightFeature);
}

export function stopHighlight() {
    document.removeEventListener("mouseup", highlightFeature);
    removeHighlights();
}

function highlightFeature() {
    removeHighlights();
    const text = getSelectedText();
    if (!text) return;

    if (text.length <= 200) {
        manageMutationObserver(false);

        nonTextParentElements.forEach((element) => {
            highlightTextInNode(text, element);
        });
        manageMutationObserver(true);
    }
}
