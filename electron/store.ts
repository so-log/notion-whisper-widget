import Store from 'electron-store'

let store: Store | null = null

export function getStore(): Store {
  if (!store) {
    store = new Store({
      name: 'notion-whisper-config',
      defaults: {
        settings: {
          position: 'bottomLeft',
          pollingInterval: 60000,
          showWidget: true,
          launchAtStartup: false,
        },
      },
    })
  }
  return store
}
