import { useState } from 'react'

interface NotionConnectProps {
  onConnected: (token: string) => void
}

export function NotionConnect({ onConnected }: NotionConnectProps) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect() {
    if (!token.trim()) {
      setError('토큰을 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (window.electronAPI) {
        // 토큰 유효성 검증 (DB 목록 조회 시도)
        await window.electronAPI.searchDatabases(token.trim())
        await window.electronAPI.saveToken(token.trim())
      }
      onConnected(token.trim())
    } catch (err: any) {
      setError('연결 실패: 토큰을 확인해주세요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#333' }}>
          Notion Integration 연결
        </h3>
        <p style={descStyle}>
          1. <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener" style={linkStyle}>
            notion.so/my-integrations
          </a> 접속{'\n'}
          2. "New integration" 생성 (Read content만 체크){'\n'}
          3. 생성된 토큰을 아래에 붙여넣기{'\n'}
          4. 연결할 DB에서 ··· → Connections → 생성한 integration 추가
        </p>

        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ntn_xxxxxxxxxxxx..."
          style={inputStyle}
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
        />

        {error && <p style={{ color: '#e74c3c', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}

        <button
          onClick={handleConnect}
          disabled={loading || !token.trim()}
          style={{
            ...btnStyle,
            opacity: loading || !token.trim() ? 0.5 : 1,
          }}
        >
          {loading ? '연결 중...' : '연결하기'}
        </button>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: 12,
  border: '1px solid #e5e5e5',
  background: '#fafafa',
}

const descStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#666',
  lineHeight: 1.8,
  margin: '0 0 16px',
  whiteSpace: 'pre-line',
}

const linkStyle: React.CSSProperties = {
  color: '#0066cc',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: 14,
  fontFamily: 'monospace',
  boxSizing: 'border-box',
  outline: 'none',
}

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  marginTop: 12,
  borderRadius: 8,
  border: 'none',
  background: '#333',
  color: '#fff',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}
