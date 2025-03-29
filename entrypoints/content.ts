import { HighlightFeature } from "./content/highlightClass";
import { initInfo } from "./content/info";
import { initStripe } from "./content/stripe";

export default defineContentScript({
    matches: ["<all_urls>"],

    async main() {
        const Highlight = new HighlightFeature();

        if (await storage.getItem("local:stripe")) {
            initStripe();
        }
        if (await storage.getItem("local:highlight")) {
            Highlight.init();
        }
        if (await storage.getItem("local:info")) {
            initInfo();
        }

        storage.watch<boolean>("local:highlight", async (newValue) => {
            if (newValue) {
                console.log("Highlight enabled");
                Highlight.init();
            } else {
                console.log("Highlight disabled");
                Highlight.stop();
            }
        });
    },
});
