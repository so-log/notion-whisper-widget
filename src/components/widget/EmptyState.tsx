import type { CSSProperties } from 'react'

interface EmptyStateProps {
  type: 'allDone' | 'empty' | 'error'
}

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'rgba(255,255,255,0.55)',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  textShadow: '0 1px 4px rgba(0,0,0,0.4)',
  letterSpacing: '-0.1px',
}

const bubbleStyle: CSSProperties = {
  maxWidth: 280,
  background: 'linear-gradient(180deg, #E9E9EB 0%, #E1E1E4 100%)',
  borderRadius: '18px 18px 18px 4px',
  padding: '10px 14px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  fontSize: 16,
  lineHeight: 1.4,
  fontWeight: 400,
  color: '#000',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', sans-serif",
  letterSpacing: '-0.2px',
}

const configs = {
  allDone: { label: '다 읽음 ✨', bubble: '오늘 할일 모두 완료! 🎉' },
  empty: { label: '새 메시지 없음', bubble: null },
  error: { label: '연결 끊김 🔌', bubble: '노션 연결을 확인해주세요' },
}

export function EmptyState({ type }: EmptyStateProps) {
  const config = configs[type]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={labelStyle}>{config.label}</span>
      {config.bubble && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={bubbleStyle}>{config.bubble}</div>
        </div>
      )}
    </div>
  )
}
