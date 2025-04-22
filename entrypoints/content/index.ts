
import { initStripe } from "./stripe/stripe";
import observer from "./watcher";
import "./style.css";

export default defineContentScript({
    matches: ["<all_urls>"],

    async main() {
        if (await storage.getItem("local:stripe")) {
            initStripe();
        }


        observer.init();

    },
});
