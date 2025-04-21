/**
 * 获取当前选中的文本
 *
 * 此函数的目的是从给定的Selection对象中提取选中的文本并返回
 * 如果没有选中的文本或者selection对象为空，则返回空字符串
 *
 * @returns 返回选中的文本，如果无文本被选中则返回空字符串
 */
export function getSelectedText(): string {
  // 获取当前用户选中的内容
  const selection = window.getSelection();
  // 检查是否有选中的文本，如果没有则直接返回
  if (!selection) return "";
  return selection.toString().trim().toLowerCase() || "";
}