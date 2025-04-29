// translate.ts
interface MicrosoftAuthToken {
    value: string;
    expirationTimestamp: number;
}

interface TranslationRequest {
    content: string;
    sourceLang?: string;
    targetLang?: string;
}

const MICROSOFT_AUTH_ENDPOINT = "https://edge.microsoft.com/translate/auth";
const MICROSOFT_TRANSLATE_API_URL =
    "https://api-edge.cognitive.microsofttranslator.com/translate";

/**
 * 解码JWT令牌并提取过期时间戳
 *
 * 该函数尝试解析JWT令牌的有效载荷部分(payload)，提取并返回其中包含的过期时间戳(exp)。
 * 若解码失败，则返回当前时间戳以确保令牌立即被视为过期状态
 *
 * @param token - JWT格式的认证令牌字符串，应由三部分组成（头部.载荷.签名）
 * @returns 成功时返回从令牌解析出的UNIX时间戳（秒级），失败时返回当前时间的毫秒级时间戳
 *          注意：返回值的单位可能不一致，使用时需注意时间单位转换
 */
const decodeAuthTokenExpiration = (token: string): number => {
    try {
        // JWT令牌解析流程：
        // 1. 分割令牌为三部分（header.payload.signature）
        // 2. 对Base64编码的payload部分进行解码
        // 3. 将解码后的JSON字符串解析为对象
        // 4. 提取payload中的exp字段（JWT标准过期时间字段）
        return JSON.parse(atob(token.split(".")[1])).exp;
    } catch (error) {
        // 错误处理策略：记录异常后返回当前时间，强制令牌立即过期
        // 确保在令牌解析失败时安全地触发令牌刷新机制
        console.error("Token decoding failed:", error);
        return Date.now(); // 返回当前时间保证立即刷新
    }
};

/**
 * 获取微软认证令牌
 *
 * @returns Promise<MicrosoftAuthToken> 包含令牌值和过期时间戳的对象
 * @throws Error 当认证请求失败时抛出错误，包含响应状态文本
 */
const acquireAuthToken = async (): Promise<MicrosoftAuthToken> => {
    // 发起认证请求到微软认证端点
    const response = await fetch(MICROSOFT_AUTH_ENDPOINT);

    // 验证响应状态，非成功状态抛出异常
    if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
    }

    // 解析响应文本为令牌值
    const tokenValue = await response.text();

    // 构建并返回令牌对象，包含令牌值和解码后的过期时间戳
    return {
        value: tokenValue,
        expirationTimestamp: decodeAuthTokenExpiration(tokenValue),
    };
};

let cachedAuthToken: string | null = null;

/**
 * 刷新身份验证令牌并返回新令牌及过期时间
 *
 * 如果存在有效的缓存令牌且未临近过期，则直接返回缓存令牌；
 * 否则通过acquireAuthToken方法获取新令牌并更新缓存。
 *
 * @returns [string, number] 二元组
 *          - string: 有效的身份验证令牌
 *          - number: 令牌过期时间戳（单位：秒）
 */
const refreshAuthToken = async (): Promise<[string, number]> => {
    /**
     * 检查缓存令牌有效性：
     * 1. 解析JWT令牌中的过期时间字段
     * 2. 判断当前时间加上1秒缓冲期是否超过过期时间
     *    （将Unix时间戳从秒转换为毫秒进行比较）
     */
    if (cachedAuthToken) {
        const expiration = decodeAuthTokenExpiration(cachedAuthToken);
        if (expiration * 1000 > Date.now() + 1000) {
            return [cachedAuthToken, expiration];
        }
    }

    /**
     * 触发实际令牌获取操作：
     * 1. 调用acquireAuthToken异步获取新令牌
     * 2. 将新令牌保存到缓存中
     * 返回获取的令牌及其原始过期时间戳
     */
    const { value, expirationTimestamp } = await acquireAuthToken();
    cachedAuthToken = value;
    return [value, expirationTimestamp];
};

/**
 * 构建微软翻译API请求配置和URL
 * @param request 翻译请求参数对象
 * @returns 包含完整API地址和请求配置的元组数组
 */
const buildTranslationRequest = async (
    request: TranslationRequest
): Promise<[string, RequestInit]> => {
    // 获取刷新后的身份验证令牌
    const [authToken] = await refreshAuthToken();

    /**
     * 创建查询参数：
     * - from: 源语言（默认自动检测）
     * - to: 目标语言（默认简体中文）
     * - api-version: 使用V3.0版本API
     */
    const queryParameters = new URLSearchParams({
        from: request.sourceLang || "auto",
        to: request.targetLang || "zh-CN",
        "api-version": "3.0",
    });

    /**
     * 返回构造完成的请求信息：
     * 1. 完整API地址（包含查询参数）
     * 2. 请求配置对象（包含认证头、POST方法和JSON格式请求体）
     */
    return [
        `${MICROSOFT_TRANSLATE_API_URL}?${queryParameters}`,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            method: "POST",
            body: JSON.stringify([{ Text: request.content }]),
        },
    ];
};

/**
 * 执行翻译请求的异步函数
 * @param endpoint - 翻译服务API的URL端点
 * @param config - 请求配置对象，包含方法、头部等信息
 * @returns 返回包含翻译结果的Promise字符串
 */
const executeTranslation = async (
    endpoint: string,
    config: RequestInit
): Promise<string> => {
    /**
     * 发起网络请求并等待响应
     * 验证响应状态码是否表示成功（2xx范围）
     * 如果响应状态异常，抛出包含状态码的错误
     */
    const response = await fetch(endpoint, config);
    if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
    }

    /**
     * 解析响应体JSON数据
     * 假定返回数据结构为数组包裹翻译对象的嵌套结构
     * 提取第一个翻译结果中的文本字段作为返回值
     */
    const result = await response.json();
    return result[0].translations[0].text;
};

/**
 * 异步翻译内容函数
 * @param text 需要翻译的文本内容
 * @param sourceLang 源语言代码，默认为英文('en')
 * @param targetLang 目标语言代码，默认为简体中文('zh-CN')
 * @returns 返回翻译后的目标语言文本，若翻译失败则返回原始文本
 */
export const translateContent = async (
    text: string,
    sourceLang = "en",
    targetLang = "zh-CN"
): Promise<string> => {
    /**
     * 核心翻译流程：
     * 1. 构建翻译请求配置对象
     * 2. 执行实际翻译操作并返回结果
     */
    try {
        const [apiEndpoint, requestConfig] = await buildTranslationRequest({
            content: text,
            sourceLang,
            targetLang,
        });
        return await executeTranslation(apiEndpoint, requestConfig);
    } catch (error) {
        /**
         * 异常处理机制：
         * - 记录详细的错误日志信息
         * - 发生任何异常时安全降级返回原始文本
         */
        console.error("Translation workflow error:", error);
        return text; // Fallback to original text
    }
};
