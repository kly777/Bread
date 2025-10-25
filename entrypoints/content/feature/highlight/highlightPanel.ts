import { HighlightManager } from './highlightManager'
import { HighlightWord, STYLE_COLORS } from './highlightConfig'

export class HighlightPanel {
    private manager: HighlightManager
    private container: HTMLElement
    private isVisible: boolean = false
    private wordList: HTMLElement

    constructor(manager: HighlightManager) {
        this.manager = manager
        this.container = this.createContainer()
        this.wordList = this.createWordList()
        this.setupEventListeners()
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div')
        container.id = 'bread-highlight-panel'
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
        `

        const header = this.createHeader()
        const content = this.createContent()

        container.appendChild(header)
        container.appendChild(content)
        document.body.appendChild(container)

        return container
    }

    private createHeader(): HTMLElement {
        const header = document.createElement('div')
        header.style.cssText = `
            padding: 12px;
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
        `

        const title = document.createElement('span')
        title.textContent = '关键词高亮'
        title.style.fontWeight = 'bold'

        const closeBtn = document.createElement('button')
        closeBtn.textContent = '×'
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            line-height: 1;
        `
        closeBtn.addEventListener('click', () => this.hide())

        header.appendChild(title)
        header.appendChild(closeBtn)

        // 添加拖动功能
        this.makeDraggable(header, this.container)

        return header
    }

    private createContent(): HTMLElement {
        const content = document.createElement('div')
        content.style.padding = '12px'

        // 添加关键词输入框
        const inputContainer = document.createElement('div')
        inputContainer.style.cssText = `
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        `

        const input = document.createElement('input')
        input.type = 'text'
        input.placeholder = '输入关键词...'
        input.style.cssText = `
            flex: 1;
            padding: 6px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        `

        const addBtn = document.createElement('button')
        addBtn.textContent = '添加'
        addBtn.style.cssText = `
            padding: 6px 12px;
            background: #007acc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addKeyword(input.value.trim())
                input.value = ''
            }
        })

        addBtn.addEventListener('click', () => {
            this.addKeyword(input.value.trim())
            input.value = ''
        })

        inputContainer.appendChild(input)
        inputContainer.appendChild(addBtn)

        // 关键词列表
        this.wordList = document.createElement('div')
        this.wordList.id = 'bread-highlight-wordlist'
        this.wordList.style.cssText = `
            max-height: 200px;
            overflow-y: auto;
        `

        content.appendChild(inputContainer)
        content.appendChild(this.wordList)

        // 控制按钮
        const controls = this.createControls()
        content.appendChild(controls)

        this.updateWordList()

        return content
    }

    private createWordList(): HTMLElement {
        const wordList = document.createElement('div')
        wordList.id = 'bread-highlight-wordlist'
        wordList.style.cssText = `
            max-height: 200px;
            overflow-y: auto;
        `
        return wordList
    }

    private updateWordList() {
        this.wordList.innerHTML = ''
        const words = this.manager.getWords()

        if (words.length === 0) {
            const emptyMsg = document.createElement('div')
            emptyMsg.textContent = '暂无关键词'
            emptyMsg.style.cssText = `
                text-align: center;
                color: #666;
                padding: 20px;
                font-style: italic;
            `
            this.wordList.appendChild(emptyMsg)
            return
        }

        words.forEach((word) => {
            const wordItem = this.createWordItem(word)
            this.wordList.appendChild(wordItem)
        })
    }

    private createWordItem(word: HighlightWord): HTMLElement {
        const item = document.createElement('div')
        item.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px;
            margin-bottom: 4px;
            border-radius: 4px;
            background: #f9f9f9;
        `

        const colorBox = document.createElement('div')
        colorBox.style.cssText = `
            width: 16px;
            height: 16px;
            border-radius: 3px;
            background: ${STYLE_COLORS[0][word.colorIndex]};
            border: 1px solid #ccc;
        `

        const wordText = document.createElement('span')
        wordText.textContent = word.text
        wordText.style.flex = '1'
        wordText.style.textDecoration = word.enabled ? 'none' : 'line-through'
        wordText.style.opacity = word.enabled ? '1' : '0.6'

        const countSpan = document.createElement('span')
        const stats = this.manager.getWordStats(word.text)
        countSpan.textContent = `(${stats.count})`
        countSpan.style.cssText = `
            font-size: 12px;
            color: #666;
            min-width: 30px;
            text-align: right;
        `

        const toggleBtn = document.createElement('button')
        toggleBtn.textContent = word.enabled ? '关' : '开'
        toggleBtn.style.cssText = `
            padding: 2px 6px;
            font-size: 12px;
            border: 1px solid #ddd;
            background: ${word.enabled ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 3px;
            cursor: pointer;
        `

        const removeBtn = document.createElement('button')
        removeBtn.textContent = '删'
        removeBtn.style.cssText = `
            padding: 2px 6px;
            font-size: 12px;
            border: 1px solid #ddd;
            background: #ff5722;
            color: white;
            border-radius: 3px;
            cursor: pointer;
        `

        toggleBtn.addEventListener('click', () => {
            this.manager.toggleWord(word.text)
            this.updateWordList()
        })

        removeBtn.addEventListener('click', () => {
            this.manager.removeWord(word.text)
            this.updateWordList()
        })

        // 添加导航按钮
        const navContainer = document.createElement('div')
        navContainer.style.cssText = `
            display: flex;
            gap: 2px;
        `

        const prevBtn = document.createElement('button')
        prevBtn.textContent = '←'
        prevBtn.title = '上一个'
        prevBtn.style.cssText = `
            padding: 2px 4px;
            font-size: 10px;
            border: 1px solid #ddd;
            background: #2196F3;
            color: white;
            border-radius: 2px;
            cursor: pointer;
        `

        const nextBtn = document.createElement('button')
        nextBtn.textContent = '→'
        nextBtn.title = '下一个'
        nextBtn.style.cssText = `
            padding: 2px 4px;
            font-size: 10px;
            border: 1px solid #ddd;
            background: #2196F3;
            color: white;
            border-radius: 2px;
            cursor: pointer;
        `

        prevBtn.addEventListener('click', () => {
            this.manager.navigateToWord(word.text, 'prev')
        })

        nextBtn.addEventListener('click', () => {
            this.manager.navigateToWord(word.text, 'next')
        })

        navContainer.appendChild(prevBtn)
        navContainer.appendChild(nextBtn)

        item.appendChild(colorBox)
        item.appendChild(wordText)
        item.appendChild(countSpan)
        item.appendChild(toggleBtn)
        item.appendChild(navContainer)
        item.appendChild(removeBtn)

        return item
    }

    private createControls(): HTMLElement {
        const controls = document.createElement('div')
        controls.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #eee;
        `

        const refreshBtn = document.createElement('button')
        refreshBtn.textContent = '刷新'
        refreshBtn.style.cssText = `
            padding: 6px 12px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            flex: 1;
        `

        const clearBtn = document.createElement('button')
        clearBtn.textContent = '清除'
        clearBtn.style.cssText = `
            padding: 6px 12px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            flex: 1;
        `

        refreshBtn.addEventListener('click', () => {
            this.manager.highlightAll()
            this.updateWordList()
        })

        clearBtn.addEventListener('click', () => {
            this.manager.stop()
            this.updateWordList()
        })

        controls.appendChild(refreshBtn)
        controls.appendChild(clearBtn)

        return controls
    }

    private addKeyword(text: string) {
        if (!text) return

        this.manager.addWords([{
            text,
            enabled: true,
            colorIndex: 0,
            caseSensitive: false,
            regex: false
        }])

        this.updateWordList()
    }

    private makeDraggable(handle: HTMLElement, element: HTMLElement) {
        let isDragging = false
        let startX: number, startY: number
        let startLeft: number, startTop: number

        handle.addEventListener('mousedown', (e) => {
            isDragging = true
            startX = e.clientX
            startY = e.clientY

            const rect = element.getBoundingClientRect()
            startLeft = rect.left
            startTop = rect.top

            e.preventDefault()
        })

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return

            const deltaX = e.clientX - startX
            const deltaY = e.clientY - startY

            element.style.left = (startLeft + deltaX) + 'px'
            element.style.top = (startTop + deltaY) + 'px'
            element.style.right = 'auto'
        })

        document.addEventListener('mouseup', () => {
            isDragging = false
        })
    }

    private setupEventListeners() {
        // 监听管理器变化
        // 这里可以添加对管理器状态变化的监听
    }

    show() {
        this.container.style.display = 'block'
        this.isVisible = true
        this.updateWordList()
    }

    hide() {
        this.container.style.display = 'none'
        this.isVisible = false
    }

    toggle() {
        if (this.isVisible) {
            this.hide()
        } else {
            this.show()
        }
    }

    destroy() {
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container)
        }
    }
}