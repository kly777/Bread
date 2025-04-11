import { highlightNode, removeHighlights } from "./highlightNodeV3";

function handleMouseUp() {
    highlightNode();
}

export function startHighlight() {
    document.addEventListener("mouseup", handleMouseUp);
}

export function endHighlight() {
    document.removeEventListener("mouseup", handleMouseUp);
    removeHighlights();
}
