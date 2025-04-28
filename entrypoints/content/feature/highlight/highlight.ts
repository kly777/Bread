import { getSelectedText } from "../../kit/getSelectedText";
import { highlightTextInNode } from "./highlightNode";

export function highlightSelectedTextInNode(node: Node = document.body) {
    // removeHighlights();
    const text = getSelectedText();
    if (!text) return;
    if (text.length <= 200) {
        highlightTextInNode(text, node);
    }
}
