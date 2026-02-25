import { useState, useEffect } from 'react'
import { WidgetView } from './views/WidgetView'
import { SettingsPanel } from './components/settings/SettingsPanel'

export default function App() {
  const [route, setRoute] = useState(window.location.hash)

  useEffect(() => {
    const handleHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // 설정 윈도우: #/settings
  if (route === '#/settings') {
    return <SettingsPanel />
  }

  // 기본: 위젯 뷰
  return <WidgetView />
}
