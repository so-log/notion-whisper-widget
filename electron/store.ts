import Store from 'electron-store'
import { safeStorage } from 'electron'

let store: Store | null = null

export function getStore(): Store {
  if (!store) {
    store = new Store({
      name: 'notion-whisper-config',
      defaults: {
        settings: {
          position: 'topLeft',
          pollingInterval: 60000,
          showWidget: true,
          launchAtStartup: false,
        },
      },
    })
  }
  return store
}

export interface StoredOAuthTokens {
  access_token: string
  workspace_id: string
  workspace_name: string
  workspace_icon: string | null
  bot_id: string
}

export function saveOAuthTokens(tokens: StoredOAuthTokens): void {
  const s = getStore()
  const json = JSON.stringify(tokens)
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(json)
    s.set('oauthTokensEncrypted', encrypted.toString('base64'))
    s.delete('oauthTokens')
  } else {
    s.set('oauthTokens', json)
  }
  // 레거시 키 정리
  s.delete('notionTokenEncrypted')
  s.delete('notionToken')
}

export function getOAuthTokens(): StoredOAuthTokens | null {
  const s = getStore()

  // OAuth 토큰 (암호화)
  const encrypted = s.get('oauthTokensEncrypted') as string | undefined
  if (encrypted && safeStorage.isEncryptionAvailable()) {
    try {
      const json = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
      return JSON.parse(json)
    } catch { return null }
  }

  // OAuth 토큰 (평문 폴백)
  const plain = s.get('oauthTokens') as string | undefined
  if (plain) {
    try { return JSON.parse(plain) } catch { return null }
  }

  // 레거시 Internal Integration 토큰 호환
  const legacyEncrypted = s.get('notionTokenEncrypted') as string | undefined
  if (legacyEncrypted && safeStorage.isEncryptionAvailable()) {
    const token = safeStorage.decryptString(Buffer.from(legacyEncrypted, 'base64'))
    return { access_token: token, workspace_id: '', workspace_name: '', workspace_icon: null, bot_id: '' }
  }
  const legacyPlain = s.get('notionToken') as string | undefined
  if (legacyPlain) {
    return { access_token: legacyPlain, workspace_id: '', workspace_name: '', workspace_icon: null, bot_id: '' }
  }

  return null
}

export function clearOAuthTokens(): void {
  const s = getStore()
  s.delete('oauthTokensEncrypted')
  s.delete('oauthTokens')
  s.delete('notionTokenEncrypted')
  s.delete('notionToken')
}
