import { getHighlightManager } from './highlightManager'
import { initializeHighlightSystem } from './highlightInit'
import { Feature } from '../Feature'

/**
 * 高亮功能
 */
export class HighlightFeature extends Feature {
    readonly name = 'highlight'
    readonly default = false // 实际默认值由 settingManager 根据 isSearchEnginePage 决定

    private manager = getHighlightManager()

    async init() {
        // 初始化高亮系统
        initializeHighlightSystem()
    }

    async on() {
        if (this.manager.isEnabled()) return
        await this.manager.autoExtractAndHighlight()

        this.manager.start()
    }

    async off() {
        if (!this.manager.isEnabled()) return
        this.manager.stop()
    }
}