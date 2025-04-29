import {
    highlightTextInNode,
    removeHighlights,
} from "../feature/highlight/highlightNode";
import {
    getTextContainerElement,
} from "../kit/getTextContainer";
import { getSelectedText } from "../kit/getSelectedText";
import { manageMutationObserver } from "../observer/domMutationObserver";


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
        // ele.style.border="1px solid red"
    });

    manageMutationObserver(true);
}
