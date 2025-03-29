import { initHighlight } from "./content/highlight";
import { initInfo } from "./content/info";
import { initStripe } from "./content/stripe";

export default defineContentScript({
    matches: ["<all_urls>"],

    async main() {
        initStripe();
        initInfo();
        console.log("Content script loaded!");
        console.log("highlight", await storage.getItem("local:highlight"));
        storage.watch<boolean>("local:highlight", async (newValue) => {
            if (newValue) {
                console.log("Highlight enabled");
                initHighlight();
            } else {
                console.log("Highlight disabled");
            }
        });

        if (await storage.getItem("local:highlight")) {
            initHighlight();
        }
    },
});
