import "./style.css";

import { initFunctions } from "./initFunctions";
import { pin } from "./feature/anchor/init";

function initializeContentScript() {
	console.log("-".repeat(20));
	console.log("content script loaded");

	initFunctions()
		.then(() => {
			pin();
		})
		.catch((error) => {
			console.error("Failed to initialize content script:", error);
		});
}

// 确保在 DOM 加载完成后执行
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initializeContentScript);
} else {
	initializeContentScript();
}
