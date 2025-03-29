import info from "../components/info.vue";
import { initHighlight } from "./content/highlight";
import { initInfo } from "./content/info";
import { ref, createApp, watch } from "vue";

export default defineContentScript({
    matches: ["<all_urls>"],

    main() {
        initHighlight();
        initInfo();
    },
});
