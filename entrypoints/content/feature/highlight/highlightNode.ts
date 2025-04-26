// highlightNode.ts
import { getTextWalker, GetTextNodesOptions } from "../../kit/getNodes";
interface TextNodeEntry {
    node: Text;
    start: number;
    end: number;
}

/**
 * 获取指定根节点下所有符合条件的文本节点
 *
 * @param root - 遍历的起始根节点，默认为document.body
 * @param options - 配置选项对象
 * @param options.excludeHidden - 是否排除隐藏元素（默认true）
 * @param options.minContentLength - 文本内容的最小长度要求（默认1）
 * @returns 符合过滤条件的文本节点数组
 *
 * 功能说明：
 * 1. 自动排除预定义的非内容型标签（input/textarea等）
 * 2. 可选过滤隐藏元素（通过CSS计算样式判断）
 * 3. 过滤空白内容及满足最小长度要求的文本
 */
function getTexts(
    root: Node = document.body,
    options: GetTextNodesOptions = {}
): { texts: TextNodeEntry[]; mergedText: string } {
    // 创建TreeWalker进行节点遍历，配置复合过滤条件
    const walker = getTextWalker(root, options);

    const texts: TextNodeEntry[] = [];
    let offset = 0;
    let mergedTextBuilder = "";

    // 遍历收集所有符合条件的文本节点
    while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        // console.log('捕获节点:', JSON.stringify(node.textContent));
        const text = node.textContent || "";
        mergedTextBuilder += text.toLowerCase();
        texts.push({
            node,
            start: offset,
            end: offset + text.length,
        });
        offset += text.length;
    }

    return {
        texts,
        mergedText: mergedTextBuilder,
    };
}

/**
 * 高亮显示文档中与选中文本匹配的文本节点（排除当前选中文本本身）
 *
 * @param root - 需要遍历的DOM根节点，默认为document.body。函数会在此节点的子树中查找匹配
 * @returns void 本函数不返回任何值
 */
export function highlightTextInNode(text: string, root: Node = document.body) {
    // console.log("highlightNode");
    // removeHighlights();
    // const text = getSelectedText();

    // 仅当存在有效选中文本时执行高亮
    if (text !== "") {
        // 获取所有文本节点及其合并后的完整文本内容
        let { texts, mergedText } = getTexts(root);

        // 调试信息：输出文本节点结构及合并后的完整文本
        console.table(
            texts.map((t) => ({
                ...t,
                text: t.node.textContent,
            }))
        );
        console.info(mergedText);

        // 存在有效文本时执行匹配逻辑
        if (texts.length > 0 && text !== "") {
            // 在合并文本中查找所有匹配位置
            const matches = findMatches(mergedText, text);

            // 过滤掉当前选中文本对应的匹配项（避免高亮自己）
            const filteredMatches = matches.filter(
                (m) => !isInSelection(m, texts, window.getSelection())
            );

            // 调试信息：输出所有匹配项详情
            console.table(
                matches.map((m) => ({
                    ...m,
                    text: mergedText.substring(m.start, m.end),
                }))
            );

            // 对过滤后的匹配项应用高亮
            highlightMatches(texts, filteredMatches);
        } else {
            return;
        }
    }
}

export function removeHighlights() {
    // 查找所有高亮元素
    document
        .querySelectorAll<HTMLSpanElement>(".bread-highlight")
        .forEach((span) => {
            // 创建新的文本节点替代高亮元素
            const text = document.createTextNode(span.textContent || "");
            span.parentNode?.replaceChild(text, span);
        });
}

/**
 * 判断匹配项是否在当前选中的文本范围内
 *
 * @param match - 需要检查的匹配范围
 * @param texts - 文本节点位置信息数组
 * @param selection - 当前文档选区对象
 * @returns 如果匹配项在选区内返回true，否则false
 */
function isInSelection(
    match: MatchRange,
    texts: TextNodeEntry[],
    selection: Selection | null
): boolean {
    if (!selection || selection.rangeCount === 0) return false;

    // 获取第一个选区范围（通常只有一个）
    const range = selection.getRangeAt(0);
    const { startContainer, startOffset, endContainer, endOffset } = range;

    // 查找选区起始节点对应的全局偏移
    const findGlobalOffset = (node: Node, offset: number): number => {
        const entry = texts.find((t) => t.node === node);
        return entry ? entry.start + offset : -1;
    };

    // 计算选区全局范围
    const selStart = findGlobalOffset(startContainer, startOffset);
    const selEnd = findGlobalOffset(endContainer, endOffset);

    // 有效性检查
    if (selStart === -1 || selEnd === -1) return false;

    // 判断匹配范围是否与选区范围重叠
    return (
        (match.start >= selStart && match.end <= selEnd) || // 完全包含
        (match.start < selEnd && match.end > selStart) // 部分重叠
    );
}

interface MatchRange {
    start: number;
    end: number;
}

/**
 * 在目标文本中查找指定子文本的所有匹配范围
 *
 * @param mergedText 被搜索的主文本内容
 * @param selectedText 需要查找的子文本内容
 * @returns 返回包含所有匹配位置信息的数组，每个元素包含匹配的起始(start)和结束(end)索引
 */
function findMatches(mergedText: string, selectedText: string): MatchRange[] {
    const matches: MatchRange[] = [];

    // 检查搜索文本有效性：当搜索文本为空时提前返回
    if (!selectedText || selectedText.length === 0) {
        console.warn("Invalid search text");
        return matches;
    }

    let index = 0;

    // 循环查找所有匹配项
    while ((index = mergedText.indexOf(selectedText, index)) !== -1) {
        // 记录匹配范围（左闭右开区间）
        matches.push({
            start: index,
            end: index + selectedText.length,
        });
        index += selectedText.length; // 跳过已匹配区域继续搜索
    }

    return matches;
}

/**
 * 在文本节点中高亮显示指定的匹配范围
 *
 * @param texts 文本节点条目数组，包含需要处理的文本节点及其位置信息
 * @param matches 需要高亮的匹配范围数组，包含原始文档中的绝对位置信息
 * @returns void
 */
function highlightMatches(texts: TextNodeEntry[], matches: MatchRange[]): void {
    console.log(`开始处理 ${matches.length} 处匹配项`);

    // 预处理：将匹配项按起始位置排序
    const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

    texts.forEach((entry) => {
        const node = entry.node;
        const nodeContent = node.textContent || "";
        const entryStart = entry.start;
        const entryEnd = entry.end;
        const nodeLength = nodeContent.length;

        // 找出所有与当前文本节点相关的匹配范围
        const relevantMatches = sortedMatches.filter(
            (match) => match.start < entryEnd && match.end > entryStart
        );

        // 转换为相对于当前节点的局部范围
        const localRanges = relevantMatches.map((match) => ({
            start: Math.max(0, match.start - entryStart),
            end: Math.min(nodeLength, match.end - entryStart),
        }));

        // 合并重叠/相邻的范围
        const mergedRanges = mergeRanges(localRanges);

        if (mergedRanges.length === 0) return;

        console.group(`处理节点 (长度:${nodeContent.length})`);
        console.log("原始内容:", nodeContent);

        // 按起始位置降序处理，避免分割影响索引
        mergedRanges
            .sort((a, b) => b.start - a.start)
            .forEach((range) => {
                const { start, end } = range;
                console.log(
                    `高亮范围: [${start}-${end}] "${nodeContent.slice(
                        start,
                        end
                    )}"`
                );

                // 分割
                const pre = node.splitText(start);
                const highlighted = pre.splitText(end - start);
                const span = createMarkElement();

                span.appendChild(pre.cloneNode(true));
                node.parentNode?.replaceChild(span, pre);

                if (highlighted.textContent) {
                    span.after(highlighted);
                }
            });

        console.log("处理后内容:", node.textContent);
        console.groupEnd();
    });

    console.log(
        "最终高亮元素数:",
        document.querySelectorAll(".highlight").length
    );
}

/**
 * 合并重叠或相邻的范围区间，返回新的有序范围数组
 *
 * 实现原理：
 * 1. 先对范围按起始位置排序
 * 2. 依次合并相邻的重叠范围
 *
 * @param ranges - 需要合并的范围数组，每个范围应包含 start 和 end 属性
 *                 (示例: [{start:1,end:3}, {start:2,end:5}])
 * @returns 合并后的新范围数组，按起始位置升序排列且无重叠
 *          (示例输入返回: [{start:1,end:5}])
 */
function mergeRanges(ranges: MatchRange[]): MatchRange[] {
    // 处理空输入特殊情况
    if (ranges.length === 0) return [];

    // 创建排序副本以保持原始数据不变，按起始位置升序排列
    const sorted = [...ranges].sort((a, b) => a.start - b.start);
    const merged = [sorted[0]];

    // 遍历处理每个范围，合并重叠/相邻的区间
    for (let i = 1; i < sorted.length; i++) {
        const last = merged[merged.length - 1];
        const current = sorted[i];

        // 当当前区间与最后合并区间重叠时，扩展合并区间的结束位置
        if (current.start <= last.end) {
            last.end = Math.max(last.end, current.end);
        } else {
            // 非重叠区间直接添加到结果集
            merged.push(current);
        }
    }

    return merged;
}

/**
 * 创建一个带有高亮样式的span元素
 *
 * 该函数用于创建一个新的span元素，并为其设置特定的样式和类名
 * 以便在页面中高亮显示文本
 *
 * @param textContent - span元素的文本内容
 * @returns 返回一个带有高亮样式的span元素
 */
function createMarkElement(): HTMLElement {
    //return document.createElement("span");
    const span = document.createElement("mark");
    span.className = "bread-highlight";
    // // span.textContent = textContent;
    // // span.style.border = "2px solid rgb(255, 153, 0)";
    // span.style.boxSizing = "border-box";
    // span.style.backgroundColor = "rgba(255, 153, 0, 0.5)";
    // span.style.display = "inline";
    // span.style.lineHeight = "inherit"; // 继承行高
    // span.style.verticalAlign = "baseline";

    return span;
}
