import './style.css'
import { initFunctions } from './initFunctions'
import { pin } from './feature/anchor/pin'

// 移除wxt的defineContentScript，改为直接执行
console.log('-'.repeat(20))
console.log('content script loaded')

// 初始化函数
initFunctions()
        .then(() => {
                pin()
        })
        .catch((error) => {
                console.error('Failed to initialize content script:', error)
        })
