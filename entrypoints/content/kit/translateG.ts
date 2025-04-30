// 项目中使用的常量
const URL_GOOGLE_TRAN = "https://translate.googleapis.com/translate_a/single";

// 生成谷歌翻译请求
const genGoogle = ({
    text,
    from,
    to,
    url = URL_GOOGLE_TRAN,
}: {
    text: string;
    from: string;
    to: string;
    url?: string;
}) => {
    const params = {
        client: "gtx",
        dt: "t",
        dj: "1",
        ie: "UTF-8",
        sl: from,
        tl: to,
        q: text,
    };
    const input = `${url}?${new URLSearchParams(params).toString()}`;
    const init = {
        // GET请求不需要Content-Type头
    };

    return { input, init };
};

// 发送HTTP请求
const fetchTranslation = async (url: string, init: RequestInit) => {
    const response = await fetch(url, init);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    try {
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to parse JSON from response:", error);
        throw new Error("Failed to fetch translation, invalid JSON response.");
    }
};

// 翻译函数
export const translateContent = async (
    text: string,
    from: string="en",
    to: string
) => {
    const { input, init } = genGoogle({ text, from, to });
    const data = await fetchTranslation(input, init);
    // 解析翻译结果
    const translatedText = data.sentences?.[0]?.trans || "";
    return translatedText;
};
