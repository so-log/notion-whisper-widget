import { useState } from 'react'

interface NotionConnectProps {
  onConnected: () => void
}

export function NotionConnect({ onConnected }: NotionConnectProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect() {
    setLoading(true)
    setError('')

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.startOAuth()
        if (result.success) {
          onConnected()
        } else {
          setError(result.error || '연결 실패')
        }
      }
    } catch (err: any) {
      setError('연결에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#333' }}>
          Notion 연결
        </h3>
        <p style={descStyle}>
          아래 버튼을 클릭하면 브라우저에서 Notion 로그인 페이지가 열립니다.{'\n'}
          연결할 페이지와 DB를 선택한 뒤 허용하면 자동으로 연결됩니다.
        </p>

        {error && <p style={{ color: '#e74c3c', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}

        <button
          onClick={handleConnect}
          disabled={loading}
          style={{
            ...btnStyle,
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? '연결 중... (브라우저를 확인하세요)' : 'Notion에 연결하기'}
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
