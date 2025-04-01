import { highlightFeature } from "./highlightNode";
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
                        highlightFeature.highlightTextNodes(node);
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
        storage.getItem<boolean>("local:highlight").then((newValue) => {
            this.updateHighlight(newValue);
        });

        storage.watch<boolean>("local:highlight", async (newValue) => {
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

    private updateHighlight(newValue: boolean | null) {
        this.observer.disconnect();
        if (newValue === null) {
            console.log("highlight is null");
            storage.setItem("local:highlight", true);
            this.highlight = true;
            bionicTextNodes();
        } else {
            this.highlight = newValue;
            if (newValue) {
                highlightFeature.highlightTextNodes();
            } else {
                highlightFeature.stop();
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
    public change(fn: Function) {
        this.observer.disconnect();
        fn();
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
}
const observer = new Observer();

export default observer;
