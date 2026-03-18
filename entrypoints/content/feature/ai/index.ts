/**
 *  AI 控制浏览器功能
 */

// 导出主要功能类
export { AIFeature } from './AIFeature';

// 导出 AI 服务相关
export { AIServiceRefactored, createDefaultAIService } from './AIService';
export { ConfigLoader } from './configLoader';
export { ToolExecutor } from './toolExecutor';

// 导出工具和提示
export { buildToolDefinitions } from './toolDefinitions';
export { buildSystemPrompt, buildUserMessage } from './systemPrompt';

// 导出 PageController 相关类型和类
export { PageController as PageControllerWrapper } from './PageController';
export type { PageControllerConfig, BrowserState, ActionResult } from './PageController';

// 导出 UI 组件
export { UI , initUI, destroyUI } from './UI';

// 导出工具函数
export { getPageInfo, getInteractiveElements, isElementVisible, formatInteractiveElements } from './utils/domTools';
export type { PageInfo } from './utils/domTools';

// 导出类型定义
export type {
    AIConfig,
    AIMessage,
    AIFunctionTool,
    AIResponse,
    AIStreamChunk,
    AIProvider,
    ConfigLoader as ConfigLoaderType
} from './types';

import { AIFeature } from './AIFeature';
export default AIFeature;