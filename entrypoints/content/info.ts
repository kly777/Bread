import info from "../../components/info.vue";

export function initInfo() {
    const container = document.createElement("div");
    container.id = "bread";
    container.className = "bread-container";
    container.style.zIndex = "1000000";
    container.style.top = "10px";
    container.style.left = "10px";
    container.style.position = "fixed";

    document.body.appendChild(container);

    const app = createApp(info);
    app.mount("#bread", true);
}
