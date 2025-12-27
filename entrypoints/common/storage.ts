type SettingState = 'default' | 'enabled' | 'disabled'
export class featureSettingStorage {
        private feature: string
        private domain: string
        constructor(feature: string, domain: string) {
                this.feature = feature
                this.domain = domain
        }
        async get(): Promise<SettingState | undefined> {
                const key = 'settings:' + this.domain
                const result = (await browser.storage.local.get(key)) as Record<
                        string,
                        Record<string, SettingState>
                >
                const domainSettings = result[key]
                if (!domainSettings) {
                        return undefined
                }
                return domainSettings[this.feature]
        }
        async set(value: SettingState) {
                const key = 'settings:' + this.domain
                const settingsRecord = (await browser.storage.local.get(
                        key
                )) as Record<string, Record<string, SettingState> | undefined>
                const settings = settingsRecord[key]
                if (!settings) {
                        await browser.storage.local.set({
                                [key]: {
                                        [this.feature]: value,
                                },
                        })
                } else {
                        settings[this.feature] = value
                        await browser.storage.local.set({
                                [key]: settings,
                        })
                }
        }
}
