import { initStripe } from "./feature/stripe/stripe";
import { openBionic, stopBionic } from "./featureManager/bionicManager";
import {
    openHighlight,
    stopHighlight,
} from "./featureManager/highlightManager";
import {
    openTranslate,
    stopTranslate,
} from "./featureManager/translateManager";

export let setting = {
    highlight: true,
    stripe: true,
    translate: true,
    bionic: true,
};

export function initSettingManager() {
    storage
        .getItem<boolean>("local:bionic")
        .then((newValue: boolean | null) => {
            if (newValue) {
                initBionic();
            }
        });

    storage.watch<boolean>("local:bionic", async (newValue: boolean | null) => {
        updateBionic(newValue);
    });

    storage
        .getItem<boolean>("local:highlight")
        .then((newValue: boolean | null) => {
            if (newValue) {
                updateHighlight(newValue);
            }
        });

    storage.watch<boolean>(
        "local:highlight",
        async (newValue: boolean | null) => {
            updateHighlight(newValue);
        }
    );

    storage
        .getItem<boolean>("local:stripe")
        .then((newValue: boolean | null) => {
            if (newValue) {
                initStripe();
            }
        });

    storage.watch<boolean>("local:stripe", async (newValue: boolean | null) => {
        console.log("未实现");
    });

    storage
        .getItem<boolean>("local:translate")
        .then((newValue: boolean | null) => {
            if (newValue) {
                openTranslate();
            }
        });

    storage.watch<boolean>(
        "local:translate",
        async (newValue: boolean | null) => {
            updateTranslate(newValue);
        }
    );
}

let bionic = true;
let highlight = true;

function updateBionic(newValue: boolean | null) {
    if (newValue === null) {
        storage.setItem<boolean>("local:bionic", bionic);
        newValue = bionic;
    }
    if (newValue) {
        openBionic();
    } else {
        stopBionic();
    }
}

function initBionic() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            openBionic();
            console.log("DOM 就绪时执行");
        });
    } else {
        window.requestIdleCallback(() => {
            openBionic();
            console.log("延迟到窗口加载完成");
        });
    }
}

function updateHighlight(newValue: boolean | null) {
    if (newValue === null) {
        storage.setItem<boolean>("local:highlight", highlight);
        newValue = highlight;
    }
    if (newValue) {
        openHighlight();
    } else {
        stopHighlight();
    }
}
let translate = true;

function updateTranslate(newValue: boolean | null) {
    if (newValue === null) {
        storage.setItem<boolean>("local:translate", translate);
        newValue = translate;
    }
    if (newValue) {
        openTranslate();
    } else {
        stopTranslate();
    }
}
