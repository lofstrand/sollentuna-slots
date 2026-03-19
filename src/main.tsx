import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { hydrateFromStorage, subscribePersist } from './lib/queryPersist'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 30 * 60 * 1000,    // 30 min — keep navigated months in memory longer
      staleTime: 60 * 60 * 1000, // 1 hour — booking data doesn't change frequently
      retry: 2,
    },
  },
})

// Restore cached booking data from localStorage before first render
hydrateFromStorage(queryClient)
// Persist successful booking queries to localStorage (debounced)
subscribePersist(queryClient)

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
