import { useState, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { UnreadLabel } from './UnreadLabel'
import { TypingIndicator } from './TypingIndicator'
import { EmptyState } from './EmptyState'
import type { WidgetItem, WidgetStatus } from '../../types/widget'

interface BubbleGroupProps {
  items: WidgetItem[]
  status: WidgetStatus
}

export function BubbleGroup({ items, status }: BubbleGroupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (status === 'ready') {
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    }
    setIsVisible(false)
  }, [status])

  if (status === 'loading') {
    return <TypingIndicator />
  }

  if (status === 'error') {
    return <EmptyState type="error" />
  }

  const unreadItems = items.filter((item) => !item.done)

  if (unreadItems.length === 0) {
    return <EmptyState type={status === 'allDone' ? 'allDone' : 'empty'} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <UnreadLabel count={unreadItems.length} isVisible={isVisible} />
      {unreadItems.map((item, i) => (
        <MessageBubble
          key={item.id}
          text={item.text}
          isFirst={i === 0}
          isVisible={isVisible}
          delay={0.08 + i * 0.08}
        />
      ))}
    </div>
  )
}
