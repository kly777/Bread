import "./style.css";
import { initFunctions } from './initFunctions';

export default defineContentScript({
    matches: ["<all_urls>"],

    async main() {
        await initFunctions();
    },
});
