import { initStripe } from "./feature/stripe/stripe";
import "./style.css";
import { initSettingManager } from "./settingManager";
import { openTranslate } from "./featureManager/translateManager";

export default defineContentScript({
    matches: ["<all_urls>"],

    async main() {
        console.log("started");
        openTranslate();
        if (await storage.getItem("local:stripe")) {
            initStripe();
        }
        initSettingManager();
    },
});
