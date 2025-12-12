"use client"

import { useEffect } from 'react'

export function HydrationDebug({ componentName }: { componentName: string }) {
  useEffect(() => {
    console.log(`✅ ${componentName} hydrated successfully`)
  }, [componentName])

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('418') || event.error?.message?.includes('Minified React error')) {
        console.error(`🚨 Hydration error detected - Last component: ${componentName}`)
        console.error('Error details:', event.error)
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [componentName])

  return null
}
