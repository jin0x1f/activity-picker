import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker, requestPersistentStorage } from './pwa.ts'
import { setupAds } from './ads.ts'
import { restoreNativeStorage } from './storage.ts'

// iOS アプリでは保存データを Preferences から戻してから描画する（ブラウザではすぐ描画）
restoreNativeStorage().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

registerServiceWorker()
requestPersistentStorage()
setupAds()
