import { useState, useEffect } from 'react'
import type { NotionDatabase } from '../../types/notion'

interface DatabaseSelectProps {
  token: string
  onSelected: (todoDbId: string, todoDbName: string, habitDbId: string, habitDbName: string) => void
  onBack: () => void
}

export function DatabaseSelect({ token, onSelected, onBack }: DatabaseSelectProps) {
  const [databases, setDatabases] = useState<NotionDatabase[]>([])
  const [todoDbId, setTodoDbId] = useState('')
  const [habitDbId, setHabitDbId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDatabases()
  }, [token])

  async function loadDatabases() {
    try {
      setLoading(true)
      if (window.electronAPI) {
        const dbs = await window.electronAPI.searchDatabases(token)
        setDatabases(dbs)
      }
    } catch (err: any) {
      setError('DB 목록을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    if (!todoDbId) {
      setError('할일 DB를 선택해주세요')
      return
    }

    const todoDb = databases.find((db) => db.id === todoDbId)
    const habitDb = databases.find((db) => db.id === habitDbId)

    onSelected(
      todoDbId,
      todoDb?.title || '',
      habitDbId,
      habitDb?.title || ''
    )
  }

  if (loading) {
    return <p style={{ color: '#999', fontSize: 14 }}>DB 목록 불러오는 중...</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={cardStyle}>
        <h3 style={headerStyle}>할일 DB 선택 <span style={requiredStyle}>*필수</span></h3>
        <select
          value={todoDbId}
          onChange={(e) => setTodoDbId(e.target.value)}
          style={selectStyle}
        >
          <option value="">-- 선택 --</option>
          {databases.map((db) => (
            <option key={db.id} value={db.id}>
              {db.icon ? `${db.icon} ` : ''}{db.title}
            </option>
          ))}
        </select>
      </div>

      <div style={cardStyle}>
        <h3 style={headerStyle}>습관 DB 선택 <span style={optionalStyle}>선택사항</span></h3>
        <select
          value={habitDbId}
          onChange={(e) => setHabitDbId(e.target.value)}
          style={selectStyle}
        >
          <option value="">-- 선택 안 함 --</option>
          {databases.map((db) => (
            <option key={db.id} value={db.id}>
              {db.icon ? `${db.icon} ` : ''}{db.title}
            </option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: '#e74c3c', fontSize: 13 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onBack} style={backBtnStyle}>뒤로</button>
        <button onClick={handleNext} style={nextBtnStyle}>다음</button>
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
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const requiredStyle: React.CSSProperties = { fontSize: 11, color: '#e74c3c', fontWeight: 400 }
const optionalStyle: React.CSSProperties = { fontSize: 11, color: '#999', fontWeight: 400 }

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: 14,
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
