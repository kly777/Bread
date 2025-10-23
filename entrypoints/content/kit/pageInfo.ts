let lang: string | null = null;
export function pageLang(): string {
        if (lang !== null) {
                return lang
        }
        lang = document.documentElement.lang || 'en'
        console.log('lang:', lang)
        return lang
}

