/**
 * 功能接口，用于统一管理各个功能
 */
export interface IFeature {
    /** 功能名称 */
    readonly name: string;
    /** 默认启用状态 */
    readonly default: boolean;
    /** 初始化功能（可选） */
    init?(): void | Promise<void>;
    /** 启用功能 */
    on(): void | Promise<void>;
    /** 禁用功能 */
    off(): void | Promise<void>;
}

/**
 * 抽象基类，提供默认实现
 */
export abstract class Feature implements IFeature {
    abstract readonly name: string;
    abstract readonly default: boolean;

    init?(): void | Promise<void> {
        // 默认无操作
    }

    abstract on(): void | Promise<void>;
    abstract off(): void | Promise<void>;
}