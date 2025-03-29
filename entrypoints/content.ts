import { initHighlight } from "./content/highlight";
import { initInfo } from "./content/info";
import { initStripe } from "./content/stripe";

export default defineContentScript({
    matches: ["<all_urls>"],

    main() {
        initStripe();
        initHighlight();
        initInfo();
    },
});
