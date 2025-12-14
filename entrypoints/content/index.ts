import './style.css'
// 导入所有功能CSS文件
import './feature/anchor/anchor.css'
import './feature/downloadLink/downloadLink.css'
import './feature/linkTarget/linkTarget.css'
import './feature/translate/translate.css'

import { initFunctions } from './initFunctions'
import { pin } from './feature/anchor/init'

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
