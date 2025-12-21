import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import packageJson from '../package.json'
const browser = process.env.BROWSER || 'firefox'
const isDev = process.env.NODE_ENV === 'development'

function generateManifest() {
        // 读取基础manifest
        const baseManifest = JSON.parse(readFileSync('manifest.json', 'utf-8'))

        // 根据浏览器调整
        const manifest = { ...baseManifest }
        manifest.version = packageJson.version
        manifest.summary = packageJson.summary

        if (browser === 'chrome') {
                // Chrome使用MV3
                manifest.manifest_version = 3
                manifest.background = {
                        service_worker: 'background.js',
                }
                manifest.action = manifest.browser_action
                delete manifest.browser_action

                // 调整permissions格式
                manifest.host_permissions = manifest.permissions.filter(
                        (p) => p.startsWith('http') || p === '<all_urls>'
                )
                manifest.permissions = manifest.permissions.filter(
                        (p) => !p.startsWith('http') && p !== '<all_urls>'
                )

                // 移除Firefox特定设置
                delete manifest.browser_specific_settings
        } else {
                // Firefox使用MV2
                manifest.manifest_version = 2
        }

        // 开发模式添加标识
        if (isDev) {
                manifest.name = `[DEV] ${manifest.name}`
        }

        // 确保输出目录存在
        const distDir = join('dist', browser)
        if (!existsSync(distDir)) {
                mkdirSync(distDir, { recursive: true })
        }

        // 写入manifest
        const manifestPath = join(distDir, 'manifest.json')
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        console.log(
                `Generated manifest for ${browser} (MV${manifest.manifest_version}) at ${manifestPath}`
        )

        return manifestPath
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
        generateManifest()
}

export { generateManifest }
