import {
    highlightTextInNode,
    removeHighlights,
} from "../feature/highlight/highlightNode";
import { GetTextNodesOptions } from "../kit/getTextNodes";
import {
    getTextContainerElement,
    getTextContainerWalker,
} from "../kit/getTextContainer";
import { getSelectedText } from "../kit/getSelectedText";
import { manageMutationObserver } from "../observer/domMutationObserver";

import {
    nonTextParentElements,
    initializeContinuedObserver,
} from "../observer/intersectionObserver/stableIntersectionObserver";

export function openHighlight() {
    // initializeContinuedObserver();

    document.addEventListener("mouseup", highlightFeature);
}

export function stopHighlight() {
    document.removeEventListener("mouseup", highlightFeature);
    removeHighlights();
}

function highlightFeature() {
    console.log("highlightFeature");
    manageMutationObserver(false);
    removeHighlights();
    const text = getSelectedText();
    if (text.trim() === "") return;

    // if (text.length <= 200) {
    //     nonTextParentElements.forEach((element) => {
    //         highlightTextInNode(text, element);
    //     });
    // }
    const elements = getTextContainerElement();
    elements.forEach((ele) => {
        console.log("hhh", ele);
        highlightTextInNode(text, ele);
    });

    manageMutationObserver(true);
}
