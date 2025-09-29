/**
 * Application Entry Point
 * 
 * This is the main entry point for the Arabic Educational Platform.
 * It initializes the React application with Strict Mode enabled for 
 * development-time checks and warnings.
 * 
 * Features:
 * - React 18 createRoot API for improved performance
 * - Strict Mode for development warnings and checks
 * - Global CSS imports for styling system
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import App from './App.tsx'
import './index.css'
import PerformanceSetup from '@/lib/performance-setup'
import { ErrorBoundary } from '@/lib/error-boundary'
import { StudentPresenceProvider } from './components/providers/StudentPresenceProvider.tsx'

// إعداد تحسينات الأداء
PerformanceSetup.initialize()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
})

window.addEventListener('beforeunload', () => PerformanceSetup.cleanup())

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <StudentPresenceProvider>
                <TooltipProvider>
                  <App />
                  <Toaster />
                  <Sonner />
                </TooltipProvider>
              </StudentPresenceProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
