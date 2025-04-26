import { intersectionObserverOptions } from "./options";

import { getTextNodes } from "../../kit/getNodes";
import { findNearestNonTextAncestor } from "../../kit/findNearestNonTextAncestor";

export const nonTextParentElements = new Set<Element>();

const continuedObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const element = entry.target;
            nonTextParentElements.add(findNearestNonTextAncestor(element));
        } else {
            const element = entry.target;
            nonTextParentElements.delete(findNearestNonTextAncestor(element));
        }
    });
}, intersectionObserverOptions);

export function initializeContinuedObserver() {
    getTextNodes().forEach((text) => {
        if (text.parentElement) {
            continuedObserver.observe(text.parentElement);
        }
    });
}

export function observeTextAncestor(text: Text) {
    const parent = text.parentElement;
    if (parent) {
        continuedObserver.observe(findNearestNonTextAncestor(parent));
    }
}
