import { removeBionicEffects } from "../feature/bionic/bionicNode";

import { manageMutationObserver } from "../observer/domMutationObserver";
import {
    parentToTextNodesMap,
    initializeSingleUseObserver,
    singleUseObserver,
} from "../observer/intersectionObserver/singleUseObserver";

export function stopBionic() {
    manageMutationObserver(false);
    singleUseObserver.disconnect();
    parentToTextNodesMap.clear();
    removeBionicEffects();
}

export function openBionic() {
    initializeSingleUseObserver();
    manageMutationObserver(true);
}
