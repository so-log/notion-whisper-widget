import { useState, useEffect } from 'react'
import { BubbleGroup } from '../components/widget/BubbleGroup'
import { useNotionData } from '../hooks/useNotionData'
import { useSettings } from '../hooks/useSettings'
import type { WidgetItem, WidgetStatus, WidgetPosition } from '../types/widget'

const MOCK_ITEMS: WidgetItem[] = [
  { id: '1', text: '비행기 예약하기 ✈️', done: false, source: 'todo' },
  { id: '2', text: '물 마시기 💧', done: false, source: 'habit' },
  { id: '3', text: 'API 문서 정리', done: false, source: 'todo' },
  { id: '4', text: '운동 30분 🏃', done: false, source: 'habit' },
]

const positionStyles: Record<WidgetPosition, React.CSSProperties> = {
  bottomLeft: { bottom: 80, left: 24 },
  topLeft: { top: 40, left: 24 },
  center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
}

export function WidgetView() {
  const { settings } = useSettings()
  const hasNotionConfig = !!settings.todoDatabaseId || !!settings.habitDatabaseId

  // Notion 연동이 설정된 경우 실제 데이터 사용
  const notionData = useNotionData(settings.pollingInterval)

  // 연동 미설정 시 목데이터로 표시
  const [mockStatus, setMockStatus] = useState<WidgetStatus>('loading')

  useEffect(() => {
    if (!hasNotionConfig) {
      const timer = setTimeout(() => setMockStatus('ready'), 1500)
      return () => clearTimeout(timer)
    }
  }, [hasNotionConfig])

  const items = hasNotionConfig ? notionData.items : MOCK_ITEMS
  const status = hasNotionConfig ? notionData.status : mockStatus

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'transparent',
      }}
    >
      <div
        style={{
          position: 'absolute',
          maxWidth: 300,
          ...positionStyles[settings.position],
        }}
      >
        <BubbleGroup items={items} status={status} />
      </div>
    </div>
  )
}
