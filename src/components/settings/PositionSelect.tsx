import type { WidgetPosition } from '../../types/widget'

interface PositionSelectProps {
  position: WidgetPosition
  interval: number
  onChange: (position: WidgetPosition, interval: number) => void
}

const positions: { value: WidgetPosition; label: string }[] = [
  { value: 'bottomLeft', label: '↙ 좌하단' },
  { value: 'topLeft', label: '↖ 좌상단' },
  { value: 'center', label: '⊙ 중앙' },
]

const intervals = [
  { value: 30000, label: '30초' },
  { value: 60000, label: '1분' },
  { value: 300000, label: '5분' },
  { value: 900000, label: '15분' },
]

export function PositionSelect({ position, interval, onChange }: PositionSelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={cardStyle}>
        <h3 style={headerStyle}>위젯 위치</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {positions.map((p) => (
            <button
              key={p.value}
              onClick={() => onChange(p.value, interval)}
              style={{
                ...chipStyle,
                background: position === p.value ? '#333' : '#fff',
                color: position === p.value ? '#fff' : '#666',
                border: position === p.value ? '1px solid #333' : '1px solid #ddd',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={headerStyle}>갱신 주기</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {intervals.map((i) => (
            <button
              key={i.value}
              onClick={() => onChange(position, i.value)}
              style={{
                ...chipStyle,
                background: interval === i.value ? '#333' : '#fff',
                color: interval === i.value ? '#fff' : '#666',
                border: interval === i.value ? '1px solid #333' : '1px solid #ddd',
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: 12,
  border: '1px solid #e5e5e5',
  background: '#fafafa',
}

const headerStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  margin: '0 0 10px',
  color: '#333',
}

const chipStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 20,
  fontSize: 13,
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'all 0.15s ease',
}
