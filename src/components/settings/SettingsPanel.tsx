import { useState, useEffect } from 'react'
import { NotionConnect } from './NotionConnect'
import { DatabaseSelect } from './DatabaseSelect'
import { PropertyMapping } from './PropertyMapping'
import { PositionSelect } from './PositionSelect'
import type { WidgetPosition } from '../../types/widget'

type Step = 'connect' | 'selectDb' | 'mapProps' | 'settings'

interface SettingsState {
  connected: boolean
  workspaceName: string
  todoDatabaseId: string
  todoDatabaseName: string
  habitDatabaseId: string
  habitDatabaseName: string
  todoPropertyMapping: { title: string; status: string; date?: string; priority?: string }
  habitPropertyMapping: { title: string; status: string }
  position: WidgetPosition
  pollingInterval: number
}

const initialState: SettingsState = {
  connected: false,
  workspaceName: '',
  todoDatabaseId: '',
  todoDatabaseName: '',
  habitDatabaseId: '',
  habitDatabaseName: '',
  todoPropertyMapping: { title: '', status: '' },
  habitPropertyMapping: { title: '', status: '' },
  position: 'topLeft',
  pollingInterval: 60000,
}

export function SettingsPanel() {
  const [step, setStep] = useState<Step>('connect')
  const [state, setState] = useState<SettingsState>(initialState)
  const [isOnboarding, setIsOnboarding] = useState(true)

  useEffect(() => {
    loadExistingSettings()

    if (window.electronAPI) {
      const unsub = window.electronAPI.onAuthStatusChanged((status) => {
        setState((prev) => ({
          ...prev,
          connected: status.connected,
          workspaceName: status.workspace_name || '',
        }))
        if (!status.connected) {
          setStep('connect')
          setIsOnboarding(true)
        }
      })
      return unsub
    }
  }, [])

  async function loadExistingSettings() {
    if (!window.electronAPI) return
    const authStatus = await window.electronAPI.getAuthStatus()
    const settings = (await window.electronAPI.getSettings()) as any

    if (authStatus.connected) {
      setState((prev) => ({
        ...prev,
        connected: true,
        workspaceName: authStatus.workspace_name || '',
        todoDatabaseId: settings.todoDatabaseId || '',
        habitDatabaseId: settings.habitDatabaseId || '',
        todoPropertyMapping: settings.todoPropertyMapping || { title: '', status: '' },
        habitPropertyMapping: settings.habitPropertyMapping || { title: '', status: '' },
        position: settings.position || 'topLeft',
        pollingInterval: settings.pollingInterval || 60000,
      }))
      setIsOnboarding(false)
      setStep('settings')
    }
  }

  function handleOAuthConnected() {
    setState((prev) => ({ ...prev, connected: true }))
    setStep('selectDb')
  }

  function handleDatabasesSelected(todoDbId: string, todoDbName: string, habitDbId: string, habitDbName: string) {
    setState((prev) => ({
      ...prev,
      todoDatabaseId: todoDbId,
      todoDatabaseName: todoDbName,
      habitDatabaseId: habitDbId,
      habitDatabaseName: habitDbName,
    }))
    setStep('mapProps')
  }

  async function handleMappingComplete(
    todoMapping: { title: string; status: string; date?: string; priority?: string },
    habitMapping: { title: string; status: string }
  ) {
    const updated = {
      ...state,
      todoPropertyMapping: todoMapping,
      habitPropertyMapping: habitMapping,
    }
    setState(updated)

    if (window.electronAPI) {
      await window.electronAPI.setSettings({
        todoDatabaseId: updated.todoDatabaseId,
        habitDatabaseId: updated.habitDatabaseId,
        todoPropertyMapping: todoMapping,
        habitPropertyMapping: habitMapping,
        position: updated.position,
        pollingInterval: updated.pollingInterval,
      })
    }

    setIsOnboarding(false)
    setStep('settings')
  }

  async function handleSettingsSave(position: WidgetPosition, interval: number) {
    setState((prev) => ({ ...prev, position, pollingInterval: interval }))
    if (window.electronAPI) {
      await window.electronAPI.setSettings({ position, pollingInterval: interval })
    }
  }

  async function handleDisconnect() {
    if (window.electronAPI) {
      await window.electronAPI.disconnect()
      await window.electronAPI.setSettings({
        todoDatabaseId: '',
        habitDatabaseId: '',
        todoPropertyMapping: null,
        habitPropertyMapping: null,
      })
    }
    setState(initialState)
    setIsOnboarding(true)
    setStep('connect')
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>
        {isOnboarding ? '💬 Notion Whisper 설정' : '⚙️ 설정'}
      </h1>

      {step === 'connect' && (
        <NotionConnect onConnected={handleOAuthConnected} />
      )}

      {step === 'selectDb' && (
        <DatabaseSelect
          onSelected={handleDatabasesSelected}
          onBack={() => setStep('connect')}
        />
      )}

      {step === 'mapProps' && (
        <PropertyMapping
          todoDatabaseId={state.todoDatabaseId}
          habitDatabaseId={state.habitDatabaseId}
          onComplete={handleMappingComplete}
          onBack={() => setStep('selectDb')}
        />
      )}

      {step === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#2ecc71', fontWeight: 500 }}>
                {state.workspaceName ? `${state.workspaceName} 연결됨 ✅` : '연결됨 ✅'}
              </span>
              <button onClick={() => setStep('selectDb')} style={linkBtnStyle}>
                DB 변경
              </button>
            </div>
          </div>

          <PositionSelect
            position={state.position}
            interval={state.pollingInterval}
            onChange={handleSettingsSave}
          />

          <button onClick={handleDisconnect} style={dangerBtnStyle}>
            연결 해제
          </button>
        </div>
      )}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  padding: '24px',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  maxWidth: 440,
  margin: '0 auto',
}

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 24,
  color: '#333',
}

const cardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: 12,
  border: '1px solid #e5e5e5',
  background: '#fafafa',
}

const linkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#0066cc',
  cursor: 'pointer',
  fontSize: 13,
}

const dangerBtnStyle: React.CSSProperties = {
  padding: '10px',
  borderRadius: 8,
  border: '1px solid #ff4444',
  background: 'transparent',
  color: '#ff4444',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
}
