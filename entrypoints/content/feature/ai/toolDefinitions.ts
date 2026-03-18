import type { AIFunctionTool } from "./types";

/**
 * 工具列表
 */
export function buildToolDefinitions(): AIFunctionTool[] {
	return [
		{
			type: "function",
			function: {
				name: "click_element",
				description: "点击页面上的交互元素",
				parameters: {
					type: "object",
					properties: {
						index: {
							type: "number",
							description: "要点击的元素的索引（从 0 开始）",
						},
					},
					required: ["index"],
					additionalProperties: false,
				},
			},
		},
		{
			type: "function",
			function: {
				name: "input_text",
				description: "在输入框中输入文本",
				parameters: {
					type: "object",
					properties: {
						index: {
							type: "number",
							description: "输入框元素的索引（从 0 开始）",
						},
						text: {
							type: "string",
							description: "要输入的文本内容",
						},
					},
					required: ["index", "text"],
					additionalProperties: false,
				},
			},
		},
		{
			type: "function",
			function: {
				name: "select_option",
				description: "选择下拉菜单选项",
				parameters: {
					type: "object",
					properties: {
						index: {
							type: "number",
							description: "下拉菜单元素的索引（从 0 开始）",
						},
						value: {
							type: "string",
							description: "要选择的选项值",
						},
					},
					required: ["index", "value"],
					additionalProperties: false,
				},
			},
		},
		{
			type: "function",
			function: {
				name: "scroll",
				description: "滚动页面",
				parameters: {
					type: "object",
					properties: {
						direction: {
							type: "string",
							enum: ["up", "down", "left", "right"],
							description: "滚动方向",
						},
						amount: {
							type: "number",
							description: "滚动距离（像素）",
							default: 100,
						},
					},
					required: ["direction"],
					additionalProperties: false,
				},
			},
		},
		{
			type: "function",
			function: {
				name: "execute_javascript",
				description: "执行 JavaScript 代码",
				parameters: {
					type: "object",
					properties: {
						code: {
							type: "string",
							description: "要执行的 JavaScript 代码",
						},
					},
					required: ["code"],
					additionalProperties: false,
				},
			},
		},
		{
			type: "function",
			function: {
				name: "get_browser_state",
				description: "获取当前浏览器页面状态（仅在需要最新状态时使用）",
				parameters: {
					type: "object",
					properties: {},
					required: [],
					additionalProperties: false,
				},
			},
		},
	];
}

/**
 * 获取特定工具的定义
 */
export function getToolDefinition(name: string): AIFunctionTool | undefined {
	const tools = buildToolDefinitions();
	return tools.find((tool) => tool.function.name === name);
}

/**
 * 检查工具是否存在
 */
export function hasTool(name: string): boolean {
	return getToolDefinition(name) !== undefined;
}

/**
 * 获取所有工具名称
 */
export function getAllToolNames(): string[] {
	return buildToolDefinitions().map((tool) => tool.function.name);
}
