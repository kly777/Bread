import { HighlightFeature } from "./content/highlightClass";
import { BionicFeature } from "./content/bionic";
import { initInfo } from "./content/info";
import { initStripe } from "./content/stripe";

export default defineContentScript({
    matches: ["<all_urls>"],

    async main() {
        const Highlight = new HighlightFeature();
        const Bionic = new BionicFeature();

        if (await storage.getItem("local:stripe")) {
            initStripe();
        }
        if (await storage.getItem("local:highlight")) {
            Highlight.init();
        }
        if (await storage.getItem("local:info")) {
            initInfo();
        }
        if (await storage.getItem("local:bionic")) {
            console.log("Bionic enabled");
            Bionic.init();
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
                storage.watch<boolean>("local:bionic", async (newValue) => {
                    if (newValue) {
                        console.log("bionic enabled");
                        Bionic.init();
                    } else {
                        console.log("bionic disabled");
                        Bionic.stop();
                    }
                });

    },
});
