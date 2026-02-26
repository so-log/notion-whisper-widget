import { useState, useEffect, useCallback } from 'react'
import type { WidgetSettings } from '../types/widget'
import { DEFAULT_SETTINGS } from '../types/widget'

export function useSettings() {
  const [settings, setSettingsState] = useState<WidgetSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!window.electronAPI) {
      setLoaded(true)
      return
    }

    window.electronAPI.getSettings().then((saved: any) => {
      setSettingsState({ ...DEFAULT_SETTINGS, ...saved })
      setLoaded(true)
    })

    const unsub = window.electronAPI.onSettingsUpdated?.((updated: any) => {
      setSettingsState((prev) => ({ ...prev, ...updated }))
    })
    return unsub
  }, [])

  const updateSettings = useCallback(async (patch: Partial<WidgetSettings>) => {
    const updated = { ...settings, ...patch }
    setSettingsState(updated)
    if (window.electronAPI) {
      await window.electronAPI.setSettings(patch as Record<string, unknown>)
    }
  }, [settings])

  return { settings, updateSettings, loaded }
}
