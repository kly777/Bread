// Unicode字符集定义
const UNICODE_RANGES = {
    // 汉字字符集（已包含你原有定义）
    CHINESE: [
        "\u4e00-\u9fa5", // 基本汉字
        "\u3400-\u4dbf", // 扩展A区
        "\u{20000}-\u{2a6df}", // 扩展B区
        "\u{2a700}-\u{2b73f}", // 扩展C区
        "\u{2b740}-\u{2b81f}", // 扩展D区
        "\u{2b820}-\u{2ceaf}", // 扩展E区
        "\u{2ceb0}-\u{2ebe0}", // 扩展F区
        "\u{2ebf0}-\u{2ee5d}", // 扩展G区
        "\u{30000}-\u{3134a}", // 扩展H区
        "\u{f900}-\u{faff}", // 兼容汉字
        "\u{2f800}-\u{2fa1f}", // 兼容补充
    ].join(""),

    // 标点符号集
    PUNCTUATION: [
        "\u0021-\u002f", // ASCII标点1
        "\u003a-\u0040", // ASCII标点2
        "\u005b-\u0060", // ASCII标点3
        "\u007b-\u007e", // ASCII标点4
        "\u3000-\u303f", // CJK标点
        "\uff01-\uffee", // 全角标点
    ].join(""),

    // 数字及符号
    NUMERIC: "0-9\\-",
};
