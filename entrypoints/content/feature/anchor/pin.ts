import anchorLay from "./anchorLayout.vue";

import { getAnchorsInfo } from "./anchor";
import { manageMutationObserver } from "../../observer/domMutationObserver";
export function pin() {

  const target = document.querySelector('body')
  if (target) {
    const container = document.createElement('div')
    manageMutationObserver(false)
    target.appendChild(container)
    createApp(anchorLay,
      { textToAnchor: getAnchorsInfo() }

    ).mount(container)
    manageMutationObserver(true)
  }
  console.log("挂载完成")
}