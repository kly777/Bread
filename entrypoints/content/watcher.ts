import { highlightNode, removeHighlights } from "./highlight/highlightNodeV3";
import { stopBionic, bionicTextNodes } from "./bionicNode";

class Observer {
    observer: MutationObserver;
    highlight: boolean = false;
    bionic: boolean = false;
    constructor() {
        this.observer = new MutationObserver((mutations) => {
            console.log("I observed some changes");
            this.observer.disconnect();
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (this.highlight) {
                        console.log("highlight", this.highlight);
                        highlightNode(node);
                    }
                    if (this.bionic) {
                        bionicTextNodes(node);
                    }
                });
            });
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        });
    }
    init() {
        // 高亮功能监听
        storage.getItem<boolean>("local:highlight").then((newValue) => {
            this.updateHighlight(newValue);
        });

        storage.watch<boolean>("local:highlight", (newValue) => {
            this.updateHighlight(newValue);
        });
        storage.getItem<boolean>("local:bionic").then((newValue) => {
            this.updateBionic(newValue);
        });

        storage.watch<boolean>("local:bionic", async (newValue) => {
            this.updateBionic(newValue);
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    private switchHighlight(highlight: boolean) {
        this.observer.disconnect();
        highlightNode();
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    private async updateHighlight(newValue: boolean | null) {
        this.observer.disconnect();
        this.highlight = newValue ?? false; // 默认关闭

        // 状态变化时立即更新页面
        if (this.highlight) {
            document.addEventListener("mouseup", this.boundSwitchHandler);
        } else {
            document.removeEventListener("mouseup", this.boundSwitchHandler);
            removeHighlights();
        }

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
    private boundSwitchHandler = (e: MouseEvent) => {
        if (this.highlight) {
            this.switchHighlight(false);
        }
    };

    private updateBionic(newValue: boolean | null) {
        this.observer.disconnect();
        if (newValue === null) {
            console.log("bionic is null");
            storage.setItem("local:bionic", true);
            this.bionic = true;
            bionicTextNodes();
        } else {
            this.bionic = newValue;
            if (newValue) {
                console.log("bionic enabled");
                stopBionic();
                bionicTextNodes();
            } else {
                stopBionic();
            }
        }
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    stop() {
        this.observer.disconnect();
    }
}
const observer = new Observer();

export default observer;
