import type { NotionDatabase, NotionItem } from '../types/notion'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

export async function searchDatabases(token: string): Promise<NotionDatabase[]> {
  const res = await fetch(`${NOTION_API_BASE}/search`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      filter: { value: 'database', property: 'object' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
    }),
  })

  if (!res.ok) {
    throw new Error(`Notion API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data.results.map((db: any) => ({
    id: db.id,
    title: db.title?.[0]?.plain_text || 'Untitled',
    icon: db.icon?.emoji || undefined,
  }))
}

export async function getDatabaseProperties(
  token: string,
  databaseId: string
): Promise<Record<string, { id: string; name: string; type: string }>> {
  const res = await fetch(`${NOTION_API_BASE}/databases/${databaseId}`, {
    headers: headers(token),
  })

  if (!res.ok) {
    throw new Error(`Notion API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const properties: Record<string, { id: string; name: string; type: string }> = {}

  for (const [name, prop] of Object.entries(data.properties as Record<string, any>)) {
    properties[name] = { id: prop.id, name, type: prop.type }
  }

  return properties
}

export async function queryDatabase(
  token: string,
  databaseId: string,
  filter?: any,
  sorts?: any[]
): Promise<any[]> {
  const body: any = {}
  if (filter) body.filter = filter
  if (sorts) body.sorts = sorts

  const res = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Notion API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data.results
}

export async function fetchTodos(
  token: string,
  databaseId: string,
  propertyMapping: { title: string; status: string; date?: string; priority?: string }
): Promise<NotionItem[]> {
  const today = new Date().toISOString().split('T')[0]

  const filterConditions: any[] = [
    {
      property: propertyMapping.status,
      checkbox: { equals: false },
    },
  ]

  if (propertyMapping.date) {
    filterConditions.push({
      property: propertyMapping.date,
      date: { equals: today },
    })
  }

  const filter =
    filterConditions.length > 1
      ? { and: filterConditions }
      : filterConditions[0]

  const sorts = propertyMapping.priority
    ? [{ property: propertyMapping.priority, direction: 'ascending' as const }]
    : undefined

  const results = await queryDatabase(token, databaseId, filter, sorts)
  return results.map((page: any) => parseNotionPage(page, propertyMapping))
}

export async function fetchHabits(
  token: string,
  databaseId: string,
  propertyMapping: { title: string; status: string }
): Promise<NotionItem[]> {
  const filter = {
    property: propertyMapping.status,
    checkbox: { equals: false },
  }

  const results = await queryDatabase(token, databaseId, filter)
  return results.map((page: any) => parseNotionPage(page, propertyMapping))
}

function parseNotionPage(
  page: any,
  mapping: { title: string; status: string; date?: string; priority?: string }
): NotionItem {
  const props = page.properties
  const titleProp = props[mapping.title]
  const statusProp = props[mapping.status]

  let title = ''
  if (titleProp?.title) {
    title = titleProp.title.map((t: any) => t.plain_text).join('')
  } else if (titleProp?.rich_text) {
    title = titleProp.rich_text.map((t: any) => t.plain_text).join('')
  }

  let done = false
  if (statusProp?.checkbox !== undefined) {
    done = statusProp.checkbox
  } else if (statusProp?.status) {
    done = statusProp.status.name === 'Done' || statusProp.status.name === '완료'
  }

  let priority: number | undefined
  if (mapping.priority && props[mapping.priority]?.select) {
    const priorityMap: Record<string, number> = {
      '높음': 1, 'High': 1, '🔴': 1,
      '중간': 2, 'Medium': 2, '🟡': 2,
      '낮음': 3, 'Low': 3, '🟢': 3,
    }
    priority = priorityMap[props[mapping.priority].select.name] || 2
  }

  return {
    id: page.id,
    title,
    done,
    date: mapping.date ? props[mapping.date]?.date?.start : undefined,
    priority,
  }
}
