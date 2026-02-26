import { shell } from 'electron'
import http from 'node:http'
import crypto from 'node:crypto'

const NOTION_CLIENT_ID = '313d872b-594c-8104-bb76-0037ec478973'
const OAUTH_PROXY_URL = 'https://notion-whisper-widget.vercel.app'
const OAUTH_PORTS = [19872, 19873, 19874]
const OAUTH_AUTHORIZE_URL = 'https://api.notion.com/v1/oauth/authorize'

export interface OAuthTokens {
  access_token: string
  token_type: string
  workspace_id: string
  workspace_name: string
  workspace_icon: string | null
  bot_id: string
}

let isOAuthInProgress = false

export async function startOAuthFlow(): Promise<OAuthTokens> {
  if (isOAuthInProgress) {
    throw new Error('OAuth flow already in progress')
  }

  isOAuthInProgress = true

  try {
    return await new Promise<OAuthTokens>(async (resolve, reject) => {
      const state = crypto.randomBytes(16).toString('hex')
      let server: http.Server | null = null
      let resolvedPort: number | null = null

      // 등록된 포트 중 하나에 바인딩
      for (const port of OAUTH_PORTS) {
        try {
          const result = await tryStartServer(port, state, resolve, reject)
          server = result
          resolvedPort = port
          break
        } catch {
          continue
        }
      }

      if (!server || !resolvedPort) {
        reject(new Error('Could not start OAuth callback server'))
        return
      }

      // 5분 타임아웃
      const timeout = setTimeout(() => {
        server?.close()
        reject(new Error('OAuth flow timed out'))
      }, 5 * 60 * 1000)

      server.on('close', () => clearTimeout(timeout))

      // 브라우저에서 Notion 인증 페이지 열기
      const redirectUri = `http://localhost:${resolvedPort}/callback`
      const authUrl = new URL(OAUTH_AUTHORIZE_URL)
      authUrl.searchParams.set('client_id', NOTION_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('owner', 'user')
      authUrl.searchParams.set('state', state)

      shell.openExternal(authUrl.toString())
    })
  } finally {
    isOAuthInProgress = false
  }
}

function tryStartServer(
  port: number,
  expectedState: string,
  resolve: (tokens: OAuthTokens) => void,
  reject: (error: Error) => void,
): Promise<http.Server> {
  return new Promise((serverResolve, serverReject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost:${port}`)

      if (url.pathname !== '/callback') {
        res.writeHead(404)
        res.end('Not found')
        return
      }

      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const error = url.searchParams.get('error')

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<html><body style="font-family:system-ui;text-align:center;padding:60px"><h2>인증 실패</h2><p>이 창을 닫아도 됩니다.</p></body></html>')
        server.close()
        reject(new Error(`OAuth error: ${error}`))
        return
      }

      if (state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<html><body style="font-family:system-ui;text-align:center;padding:60px"><h2>유효하지 않은 요청</h2></body></html>')
        server.close()
        reject(new Error('OAuth state mismatch'))
        return
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<html><body style="font-family:system-ui;text-align:center;padding:60px"><h2>인증 코드 없음</h2></body></html>')
        server.close()
        reject(new Error('No authorization code received'))
        return
      }

      try {
        const redirectUri = `http://localhost:${port}/callback`
        const tokens = await exchangeCodeForTokens(code, redirectUri)

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(`<html><body style="font-family:system-ui;text-align:center;padding:60px">
          <h2>Notion 연결 완료!</h2>
          <p>워크스페이스: ${tokens.workspace_name}</p>
          <p>이 창을 닫고 Notion Whisper로 돌아가세요.</p>
        </body></html>`)

        server.close()
        resolve(tokens)
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<html><body style="font-family:system-ui;text-align:center;padding:60px"><h2>토큰 교환 실패</h2><p>다시 시도해 주세요.</p></body></html>')
        server.close()
        reject(err)
      }
    })

    server.listen(port, '127.0.0.1', () => serverResolve(server))
    server.on('error', () => serverReject(new Error(`Port ${port} in use`)))
  })
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
  const response = await fetch(`${OAUTH_PROXY_URL}/api/token-exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Token exchange failed: ${(err as any).error || response.statusText}`)
  }

  return response.json() as Promise<OAuthTokens>
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string }> {
  const response = await fetch(`${OAUTH_PROXY_URL}/api/token-refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Token refresh failed: ${(err as any).error || response.statusText}`)
  }

  return response.json() as Promise<{ access_token: string }>
}
