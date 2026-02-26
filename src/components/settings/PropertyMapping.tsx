import { useState, useEffect } from 'react'

interface PropertyMappingProps {
  todoDatabaseId: string
  habitDatabaseId: string
  onComplete: (
    todoMapping: { title: string; status: string; date?: string; priority?: string },
    habitMapping: { title: string; status: string }
  ) => void
  onBack: () => void
}

interface PropertyInfo {
  id: string
  name: string
  type: string
}

export function PropertyMapping({
  todoDatabaseId,
  habitDatabaseId,
  onComplete,
  onBack,
}: PropertyMappingProps) {
  const [todoProps, setTodoProps] = useState<Record<string, PropertyInfo>>({})
  const [habitProps, setHabitProps] = useState<Record<string, PropertyInfo>>({})
  const [todoMapping, setTodoMapping] = useState({ title: '', status: '', date: '', priority: '' })
  const [habitMapping, setHabitMapping] = useState({ title: '', status: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProperties()
  }, [])

  async function loadProperties() {
    try {
      setLoading(true)
      if (!window.electronAPI) return

      const todoPropData = await window.electronAPI.getDatabaseProperties(todoDatabaseId)
      setTodoProps(todoPropData)
      autoMapProperties(todoPropData, 'todo')

      if (habitDatabaseId) {
        const habitPropData = await window.electronAPI.getDatabaseProperties(habitDatabaseId)
        setHabitProps(habitPropData)
        autoMapProperties(habitPropData, 'habit')
      }
    } catch (err) {
      console.error('Failed to load properties:', err)
    } finally {
      setLoading(false)
    }
  }

  function autoMapProperties(props: Record<string, PropertyInfo>, type: 'todo' | 'habit') {
    const entries = Object.values(props)

    // 자동 매핑: 타입 기반으로 추정
    const titleProp = entries.find((p) => p.type === 'title')
    const statusProp = entries.find(
      (p) => p.type === 'checkbox' || p.type === 'status'
    )
    const dateProp = entries.find((p) => p.type === 'date')
    const priorityProp = entries.find((p) => p.type === 'select')

    if (type === 'todo') {
      setTodoMapping({
        title: titleProp?.name || '',
        status: statusProp?.name || '',
        date: dateProp?.name || '',
        priority: priorityProp?.name || '',
      })
    } else {
      setHabitMapping({
        title: titleProp?.name || '',
        status: statusProp?.name || '',
      })
    }
  }

  function handleComplete() {
    const todoResult = {
      title: todoMapping.title,
      status: todoMapping.status,
      ...(todoMapping.date ? { date: todoMapping.date } : {}),
      ...(todoMapping.priority ? { priority: todoMapping.priority } : {}),
    }

    const habitResult = {
      title: habitMapping.title || '',
      status: habitMapping.status || '',
    }

    onComplete(todoResult, habitResult)
  }

  if (loading) {
    return <p style={{ color: '#999', fontSize: 14 }}>프로퍼티 분석 중...</p>
  }

  const propNames = (props: Record<string, PropertyInfo>) => Object.values(props)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={cardStyle}>
        <h3 style={headerStyle}>할일 DB 프로퍼티 매핑</h3>
        <PropertyRow
          label="제목 (Title)"
          required
          value={todoMapping.title}
          options={propNames(todoProps)}
          onChange={(v) => setTodoMapping((prev) => ({ ...prev, title: v }))}
        />
        <PropertyRow
          label="완료 여부 (Status)"
          required
          value={todoMapping.status}
          options={propNames(todoProps)}
          onChange={(v) => setTodoMapping((prev) => ({ ...prev, status: v }))}
        />
        <PropertyRow
          label="날짜 (Date)"
          value={todoMapping.date}
          options={propNames(todoProps)}
          onChange={(v) => setTodoMapping((prev) => ({ ...prev, date: v }))}
        />
        <PropertyRow
          label="우선순위 (Priority)"
          value={todoMapping.priority}
          options={propNames(todoProps)}
          onChange={(v) => setTodoMapping((prev) => ({ ...prev, priority: v }))}
        />
      </div>

      {habitDatabaseId && (
        <div style={cardStyle}>
          <h3 style={headerStyle}>습관 DB 프로퍼티 매핑</h3>
          <PropertyRow
            label="제목 (Title)"
            required
            value={habitMapping.title}
            options={propNames(habitProps)}
            onChange={(v) => setHabitMapping((prev) => ({ ...prev, title: v }))}
          />
          <PropertyRow
            label="완료 여부 (Status)"
            required
            value={habitMapping.status}
            options={propNames(habitProps)}
            onChange={(v) => setHabitMapping((prev) => ({ ...prev, status: v }))}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onBack} style={backBtnStyle}>뒤로</button>
        <button onClick={handleComplete} style={nextBtnStyle}>완료</button>
      </div>
    </div>
  )
}

function PropertyRow({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string
  value: string
  options: PropertyInfo[]
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
        {label} {required && <span style={{ color: '#e74c3c' }}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle}
      >
        <option value="">{required ? '-- 선택 --' : '-- 사용 안 함 --'}</option>
        {options.map((prop) => (
          <option key={prop.name} value={prop.name}>
            {prop.name} ({prop.type})
          </option>
        ))}
      </select>
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
  margin: '0 0 12px',
  color: '#333',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #ddd',
  fontSize: 13,
  background: '#fff',
}

const backBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  borderRadius: 8,
  border: '1px solid #ddd',
  background: '#fff',
  color: '#666',
  fontSize: 14,
  cursor: 'pointer',
}

const nextBtnStyle: React.CSSProperties = {
  flex: 2,
  padding: '10px',
  borderRadius: 8,
  border: 'none',
  background: '#333',
  color: '#fff',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}
