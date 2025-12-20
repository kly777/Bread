class settingStorage {
        async get(key: string) {
                return await browser.storage.local.get('setting:' + key)
        }

        async set(key: string, value: any) {
                key = 'setting:' + key
                await browser.storage.local.set({ [key]: value })
        }

        async remove(key: string) {
                await browser.storage.local.remove('setting:' + key)
        }

        listen(
                callback: (
                        changes: {
                                [key: string]: browser.storage.StorageChange
                        },
                        areaName: string
                ) => void
        ) {
                browser.storage.onChanged.addListener(callback)
        }
}

export class domainSettingStorage {
        private domain: string
        private storage: settingStorage
        constructor(domain: string) {
                this.domain = domain
                this.storage = new settingStorage()
        }
        async get() {
                const result = await this.storage.get(this.domain);
                const fullKey = 'setting:' + this.domain;
                return (result[fullKey] || {}) as Record<string, string>;
        }
        async set(value: Record<string, string>) {
                await this.storage.set(this.domain, value)
        }
        async remove() {
                await this.storage.remove(this.domain)
        }
        listen(
                callback: (
                        changes: {
                                [key: string]: browser.storage.StorageChange
                        },
                        areaName: string
                ) => void
        ) {
                this.storage.listen(callback)
        }
        getDomain(): string {
                return this.domain
        }
}

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
        async remove() {}
        listen(
                callback: (
                        changes: {
                                [key: string]: browser.storage.StorageChange
                        },
                        areaName: string
                ) => void
        ) {
                browser.storage.onChanged.addListener(callback)
        }
}
