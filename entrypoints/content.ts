import { HighlightFeature } from "./content/highlightClass";
import { BionicFeature } from "./content/bionic";
import { initInfo } from "./content/info";
import { initStripe } from "./content/stripe";
import observer from "./content/watcher";

export default defineContentScript({
    matches: ["<all_urls>"],

    async main() {
        if (await storage.getItem("local:stripe")) {
            initStripe();
        }
        if (await storage.getItem("local:info")) {
            initInfo();
        }

        observer.init();
    },
});
