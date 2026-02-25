import { execSync } from 'child_process'

// VS Code 통합 터미널이 설정하는 ELECTRON_RUN_AS_NODE 제거
// 이 변수가 있으면 Electron이 일반 Node.js로 실행됨
delete process.env.ELECTRON_RUN_AS_NODE

const isBuild = process.argv.includes('build')
const cmd = isBuild ? 'npx vite build' : 'npx vite'

try {
  execSync(cmd, { stdio: 'inherit' })
} catch (e) {
  process.exit(e.status || 1)
}
