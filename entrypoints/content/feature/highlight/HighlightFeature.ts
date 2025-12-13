import { getHighlightManager } from './highlightManager'
import { initializeHighlightSystem } from './highlightInit'
import { Feature } from '../Feature'
import { isSearchEnginePage } from '../../utils/page/info'

/**
 * 高亮功能
 */
export class HighlightFeature extends Feature {
        readonly name = 'highlight'
        get default(): boolean {
                return isSearchEnginePage()
        }

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
