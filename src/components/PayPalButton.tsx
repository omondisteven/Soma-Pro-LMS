// components/PayPalButton.tsx
'use client'

import { useEffect, useState } from 'react'

interface PayPalButtonProps {
  hostedButtonId: string
  containerId?: string
  onSuccess?: () => void
  onError?: (error: any) => void
}

export default function PayPalButton({ 
  hostedButtonId, 
  containerId = `paypal-container-${hostedButtonId}`,
  onSuccess,
  onError 
}: PayPalButtonProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if PayPal is loaded
    const checkPayPal = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).paypal) {
        setIsReady(true)
        clearInterval(checkPayPal)
      }
    }, 100)

    return () => clearInterval(checkPayPal)
  }, [])

  useEffect(() => {
    if (isReady && hostedButtonId) {
      try {
        (window as any).paypal.HostedButtons({
          hostedButtonId: hostedButtonId,
          onSuccess: () => {
            if (onSuccess) onSuccess()
          },
          onError: (err: any) => {
            console.error('PayPal error:', err)
            if (onError) onError(err)
          }
        }).render(`#${containerId}`)
      } catch (error) {
        console.error('Error rendering PayPal button:', error)
        if (onError) onError(error)
      }
    }
  }, [isReady, hostedButtonId, containerId, onSuccess, onError])

  return (
    <div id={containerId} className="paypal-button-container min-h-[100px]">
      {!isReady && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-maroon-600"></div>
          <span className="ml-2 text-gray-600">Loading payment options...</span>
        </div>
      )}
    </div>
  )
}