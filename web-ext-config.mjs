import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
        const envPath = join(__dirname, '.env.submit')
        try {
                const content = readFileSync(envPath, 'utf8')
                const env = {}
                content.split('\n').forEach((line) => {
                        const match = line.match(
                                /^\s*([\w\d_]+)\s*=\s*(.+?)\s*$/
                        )
                        if (match) {
                                env[match[1]] = match[2].replace(
                                        /^['"]|['"]$/g,
                                        ''
                                )
                        }
                })
                return env
        } catch (err) {
                console.warn('Could not load .env.submit:', err.message)
                return {}
        }
}

const env = loadEnv()
const apiKey = env.FIREFOX_JWT_ISSUER
const apiSecret = env.FIREFOX_JWT_SECRET

if (!apiKey || !apiSecret) {
        console.warn('Missing API key or secret in .env.submit')
}

export default {
        // Global options
        verbose: true,
        // Command-specific options
        build: {
                overwriteDest: true,
        },
        sign: {
                apiKey,
                apiSecret,
                channel: 'listed',
                amoMetadata: './amo-metadata.json',
        },
        run: {
                firefox: 'firefoxdeveloperedition',
                reload: true,
                watchFile: ['dist/**/*'],
        },
        // Source directory for web-ext run and build
        sourceDir: './dist',
        // Artifacts directory for signed XPIs
        artifactsDir: './dist-signed',
        // Ignored files
        ignoreFiles: [
                '**/*.map',
                '**/.git',
                '**/node_modules',
                '**/package-lock.json',
                '**/yarn.lock',
                '**/pnpm-lock.yaml',
                '**/tsconfig.json',
                '**/README.md',
                '**/LICENSE',
        ],
}