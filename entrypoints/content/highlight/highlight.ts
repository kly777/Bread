import { getSelectedText } from "../kit/getSelectedText";
import { highlightTextInNode, removeHighlights } from "./highlightNode";


export function highlightSelectedTextInNode(node: Node = document.body) {
  removeHighlights()
  const text = getSelectedText()
  if (!text) return
  if (text.length <= 20) {
    highlightTextInNode(text, node)
  }

}