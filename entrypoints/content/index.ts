import { initStripe } from "./stripe/stripe";
import "./style.css";
import { initSettingManager } from "./settingManager";

export default defineContentScript({
    matches: ["<all_urls>"],

    async main() {
        if (await storage.getItem("local:stripe")) {
            initStripe();
        }
        initSettingManager();
    },
});
