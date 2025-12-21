import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import packageJson from '../package.json'
const isDev = process.env.NODE_ENV === 'development'

function generateManifest() {
        // 读取基础manifest
        const baseManifest = JSON.parse(readFileSync('manifest.json', 'utf-8'))

        // 根据浏览器调整
        const manifest = { ...baseManifest }
        manifest.version = packageJson.version
        manifest.summary = packageJson.summary

        // Firefox使用MV2
        manifest.manifest_version = 2

        // 开发模式添加标识
        if (isDev) {
                manifest.name = `[DEV] ${manifest.name}`
        }

        // 确保输出目录存在
        const distDir = 'dist'
        if (!existsSync(distDir)) {
                mkdirSync(distDir, { recursive: true })
        }

        // 写入manifest
        const manifestPath = join(distDir, 'manifest.json')
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        console.log(
                `Generated manifest for Firefox (MV${manifest.manifest_version}) at ${manifestPath}`
        )

        return manifestPath
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
        generateManifest()
}

export { generateManifest }
