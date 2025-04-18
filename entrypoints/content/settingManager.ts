export class SettingsManager {
    highlight: boolean = false;
    bionic: boolean = false;

    constructor() {
        this.init();
    }

    private async init() {
        this.highlight =
            (await storage.getItem<boolean>("local:highlight")) ?? false;
        this.bionic = (await storage.getItem<boolean>("local:bionic")) ?? true;

        storage.watch<boolean>("local:highlight", async (newValue: boolean | null) => {
            this.updateHighlight(newValue);
        });

        storage.watch<boolean>("local:bionic", async (newValue: boolean | null) => {
            this.updateBionic(newValue);
        });
    }

    private updateHighlight(newValue: boolean | null) {
        if (newValue !== null) {
            this.highlight = newValue;
            console.log("highlight", this.highlight);
        }
    }

    private updateBionic(newValue: boolean | null) {
        if (newValue === null) {
            console.log("bionic is null");
            storage.setItem("local:bionic", true);
            this.bionic = true;
        } else {
            this.bionic = newValue;
            console.log("bionic", this.bionic);
        }
    }

    getHighlight(): boolean {
        return this.highlight;
    }

    getBionic(): boolean {
        return this.bionic;
    }
}

export const settingsManager = new SettingsManager();
