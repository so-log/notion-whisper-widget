import type { CSSProperties } from 'react'

interface UnreadLabelProps {
  count: number
  isVisible: boolean
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

export function UnreadLabel({ count, isVisible }: UnreadLabelProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: 6,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease 0.05s',
      }}
    >
      <span style={labelStyle}>읽지 않음 · {count}개</span>
    </div>
  )
}
