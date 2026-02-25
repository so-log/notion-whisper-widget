import type { CSSProperties } from 'react'

interface MessageBubbleProps {
  text: string
  isFirst: boolean
  isVisible: boolean
  delay?: number
}

const bubbleBase: CSSProperties = {
  maxWidth: 280,
  background: 'linear-gradient(180deg, #E9E9EB 0%, #E1E1E4 100%)',
  padding: '10px 14px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
}

const textStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.4,
  fontWeight: 400,
  color: '#000',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', sans-serif",
  letterSpacing: '-0.2px',
}

export function MessageBubble({ text, isFirst, isVisible, delay = 0 }: MessageBubbleProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.92)',
        transition: `all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
      }}
    >
      <div
        style={{
          ...bubbleBase,
          borderRadius: isFirst ? '18px 18px 18px 4px' : '4px 18px 18px 4px',
        }}
      >
        <span style={textStyle}>{text}</span>
      </div>
    </div>
  )
}
