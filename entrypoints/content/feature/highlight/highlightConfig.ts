/**
 * 高亮词配置接口
 * 定义单个高亮词的完整配置信息
 */
export interface HighlightWord {
        text: string // 要匹配的文本内容
        enabled: boolean // 是否启用此高亮词
        colorIndex: number // 颜色索引，对应颜色方案中的颜色
        caseSensitive: boolean // 是否区分大小写
        regex: boolean // 是否使用正则表达式匹配
}

/**
 * 高亮功能全局配置接口
 * 控制高亮功能的整体行为和设置
 */
export interface HighlightConfig {
        words: HighlightWord[] // 高亮词列表
        autoExtract: boolean // 是否自动从搜索引擎提取关键词
        colorScheme: number // 颜色方案索引，对应STYLE_COLORS数组
        skipShortWords: boolean // 是否跳过短词（长度小于3的单词）
        sortByLength: boolean // 是否按词长排序高亮词
        showIndicator: boolean // 是否显示高亮指示器
}

/**
 * 预定义高亮颜色方案
 * 提供多组美观的颜色方案，每组包含10种颜色
 */
export const STYLE_COLORS = [
        [
                '#FFFF80',
                '#99ccff',
                '#ff99cc',
                '#66cc66',
                '#cc99ff',
                '#ffcc66',
                '#66aaaa',
                '#dd9966',
                '#aaaaaa',
                '#dd6699',
        ], // 方案0：明亮色系
        [
                '#FFFFa0',
                '#bbeeff',
                '#ffbbcc',
                '#88ee88',
                '#ccbbff',
                '#ffee88',
                '#88cccc',
                '#ffbb88',
                '#cccccc',
                '#ffaabb',
        ], // 方案1：柔和色系
        [
                '#D6E19C',
                '#A2BFE1',
                '#DC95BF',
                '#1FC6B2',
                '#928AD3',
                '#E4C994',
                '#94CCC3',
                '#D5B87C',
                '#B2D1D3',
                '#DD8DB0',
        ], // 方案2：自然色系
        [
                '#ff7575',
                '#ff9175',
                '#ffca75',
                '#ffff75',
                '#75ff75',
                '#75fff1',
                '#75c1ff',
                '#757aff',
                '#d675ff',
                '#ff75cc',
        ], // 方案3：鲜艳色系
        [
                '#EBD9CB',
                '#D8B0B0',
                '#ACD4D6',
                '#C3BAB1',
                '#E7ADAC',
                '#EBC1A8',
                '#A6BAAF',
                '#B98A82',
                '#e8d1cb',
                '#DECECE',
        ], // 方案4：复古色系
        [
                '#FFF36D',
                '#8DE971',
                '#FFCD8A',
                '#FFACB6',
                '#F3C9E4',
                '#FF9DE5',
                '#6DD5C3',
                '#B29EE7',
                '#A6DDEA',
                '#50C2E1',
        ], // 方案5：现代色系
]

/**
 * 预定义边框颜色方案
 * 与STYLE_COLORS对应的边框颜色，用于高亮框的边框
 */
export const BORDER_COLORS = [
        [
                '#aaaa20',
                '#4477aa',
                '#aa4477',
                '#117711',
                '#7744aa',
                '#aa7711',
                '#115555',
                '#884411',
                '#555555',
                '#881144',
        ], // 方案0对应的边框色
        [
                '#aaaa40',
                '#6699aa',
                '#aa6699',
                '#339933',
                '#9966aa',
                '#aa9933',
                '#337777',
                '#aa6633',
                '#777777',
                '#aa3366',
        ], // 方案1对应的边框色
        [
                '#aeb780',
                '#869eb9',
                '#9e6c89',
                '#158679',
                '#5f5988',
                '#8b7b59',
                '#5e837c',
                '#8a7750',
                '#728789',
                '#955f77',
        ], // 方案2对应的边框色
        [
                '#be5858',
                '#b86a56',
                '#b89254',
                '#b8b855',
                '#52b652',
                '#54b6ac',
                '#4f85b2',
                '#4f53b3',
                '#9450b2',
                '#ad4e8a',
        ], // 方案3对应的边框色
        [
                '#ac9f95',
                '#947878',
                '#748e8f',
                '#7f7973',
                '#956e6e',
                '#977a6a',
                '#6a766f',
                '#6d524d',
                '#948682',
                '#928787',
        ], // 方案4对应的边框色
        [
                '#bbb250',
                '#62a24f',
                '#b69160',
                '#b57980',
                '#ad8ea2',
                '#ae679b',
                '#489285',
                '#7b6da2',
                '#6f959e',
                '#348196',
        ], // 方案5对应的边框色
]

/**
 * 默认高亮配置
 * 高亮功能的初始默认设置
 */
export const DEFAULT_CONFIG: HighlightConfig = {
        words: [], // 默认高亮词列表为空
        autoExtract: true, // 默认启用自动提取
        colorScheme: 0, // 默认使用第一个颜色方案
        skipShortWords: true, // 默认跳过短词
        sortByLength: true, // 默认按词长排序
        showIndicator: true, // 默认显示指示器
}

/**
 * 创建高亮词对象
 * @param text 要匹配的文本
 * @param enabled 是否启用，默认为true
 * @returns 完整的高亮词配置对象
 */
export function createHighlightWord(
        text: string,
        enabled: boolean = true
): HighlightWord {
        return {
                text,
                enabled,
                colorIndex: 0, // 默认使用第一个颜色
                caseSensitive: false, // 默认不区分大小写
                regex: false, // 默认不使用正则表达式
        }
}

/**
 * 获取高亮样式CSS字符串
 * @param colorScheme 颜色方案索引，默认为0
 * @returns 包含所有高亮颜色的CSS样式字符串
 */
export function getHighlightStyle(colorScheme: number = 0): string {
        const colors = STYLE_COLORS[colorScheme] || STYLE_COLORS[0]
        const borderColors = BORDER_COLORS[colorScheme] || BORDER_COLORS[0]

        let styles = ''

        // 为每种颜色生成对应的CSS类
        colors.forEach((color, index) => {
                styles += `
            .bread-highlight-color-${index} {
                box-sizing: border-box !important;
                background-color: ${color} !important;
                color: black !important;
                padding: 0 1px !important;
                border-radius: 2px !important;
                border: 1px solid ${borderColors[index]} !important;
            }
        `
        })

        return styles
}
