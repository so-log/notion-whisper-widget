import { useState, useEffect, useCallback } from 'react'
import type { WidgetItem, WidgetStatus } from '../types/widget'

interface UseNotionDataReturn {
  items: WidgetItem[]
  status: WidgetStatus
  error: Error | null
  refresh: () => void
}

export function useNotionData(intervalMs: number = 60000): UseNotionDataReturn {
  const [items, setItems] = useState<WidgetItem[]>([])
  const [status, setStatus] = useState<WidgetStatus>('loading')
  const [error, setError] = useState<Error | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      if (!window.electronAPI) {
        // 브라우저에서 개발 시 목데이터 사용
        return
      }
      const data = await window.electronAPI.fetchNotionItems()
      setItems(
        data.map((item) => ({
          ...item,
          text: item.text || (item as any).title || '',
        }))
      )
      setError(null)

      if (data.length === 0) {
        setStatus('empty')
      } else if (data.every((item) => item.done)) {
        setStatus('allDone')
      } else {
        setStatus('ready')
      }
    } catch (err) {
      setError(err as Error)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchItems()
    const interval = setInterval(fetchItems, intervalMs)
    return () => clearInterval(interval)
  }, [fetchItems, intervalMs])

  // 트레이 '새로고침' 메뉴에서 트리거
  useEffect(() => {
    if (!window.electronAPI?.onRefresh) return
    const cleanup = window.electronAPI.onRefresh(() => {
      fetchItems()
    })
    return cleanup
  }, [fetchItems])

  return { items, status, error, refresh: fetchItems }
}
