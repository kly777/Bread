import { highlightSelectedTextInNode } from "../feature/highlight/highlight";
import { removeHighlights } from "../feature/highlight/highlightNode";
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
    nonTextParentElements.forEach((element) => {
        highlightWithoutObserver(element);
    });
}
function highlightWithoutObserver(element: Element) {
    manageMutationObserver(false);
    highlightSelectedTextInNode(element);
    manageMutationObserver(true);
}
