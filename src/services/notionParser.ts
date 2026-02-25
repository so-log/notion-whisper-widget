import type { NotionItem } from '../types/notion'
import type { WidgetItem } from '../types/widget'

export function notionItemsToWidgetItems(
  todos: NotionItem[],
  habits: NotionItem[]
): WidgetItem[] {
  const todoItems: WidgetItem[] = todos.map((item) => ({
    id: item.id,
    text: item.title,
    done: item.done,
    source: 'todo' as const,
    priority: item.priority,
  }))

  const habitItems: WidgetItem[] = habits.map((item) => ({
    id: item.id,
    text: item.title + (item.emoji ? ` ${item.emoji}` : ''),
    done: item.done,
    source: 'habit' as const,
  }))

  // 할일 먼저 (우선순위 순), 그다음 습관
  const sorted = [
    ...todoItems.sort((a, b) => (a.priority || 99) - (b.priority || 99)),
    ...habitItems,
  ]

  return sorted.filter((item) => !item.done)
}
