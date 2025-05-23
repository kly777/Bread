import { removeBionicEffects } from "../feature/bionic/bionicNode";

import { manageMutationObserver } from "../observer/domMutationObserver";
import {
    parentToTextNodesMap,
    initializeSingleUseObserver,
    bionicTextObserver,
} from "../observer/intersectionObserver/singleUseObserver";
export function openBionic() {
    initializeSingleUseObserver();
    manageMutationObserver(true);
}

export function stopBionic() {
    manageMutationObserver(false);
    bionicTextObserver.disconnect();
    parentToTextNodesMap.clear();
    removeBionicEffects();
}
