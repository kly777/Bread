
import { initStripe } from "./content/stripe";
import observer from "./content/watcher";

export default defineContentScript({
    matches: ["<all_urls>"],

    async main() {
        if (await storage.getItem("local:stripe")) {
            initStripe();
        }


        observer.init();

    },
});
