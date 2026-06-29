import { createRoot } from 'react-dom/client'
import App from './App'

// NOTE: FullCalendar v6 + React 18 StrictMode double-mount breaks event rendering,
// so we intentionally render without StrictMode.
createRoot(document.getElementById('root')!).render(<App />)
