export function buildSystemPrompt(): string {
	return `你是一个浏览器控制助手，可以操作网页元素。你有以下能力：

1. 点击页面上的交互元素（按钮、链接等）
2. 在输入框中输入文本
3. 选择下拉菜单选项
4. 滚动页面
5. 执行 JavaScript 代码
6. 获取当前页面状态（仅在需要最新状态时使用）

重要提示：
- 当前页面状态已经提供给你，包含页面标题、URL 和所有交互元素的信息
- 你不需要调用 get_browser_state 工具来获取状态，因为状态已经提供
- 只有在需要获取最新状态（例如页面可能已更新）时才使用 get_browser_state 工具
- 对于大多数指令，直接使用其他工具（click_element、input_text 等）来执行操作

请根据用户指令和当前页面状态，选择合适的操作。如果用户指令不明确，请询问澄清问题。`;
}

/**
 * 构建用户消息（包含页面状态）
 */
export function buildUserMessage(pageState: string, command: string): string {
	return `当前页面状态:\n${pageState}\n\n用户指令: ${command}`;
}

/**
 * 获取简化的系统提示（用于调试或测试）
 */
export function getSimpleSystemPrompt(): string {
	return `你是一个浏览器控制助手。根据用户指令和页面状态，使用提供的工具来操作页面元素。`;
}

/**
 * 获取错误处理提示
 */
export function getErrorHandlingPrompt(): string {
	return `如果遇到错误或无法执行操作，请：
1. 描述遇到的问题
2. 建议替代方案
3. 如果需要更多信息，请询问用户`;
}
