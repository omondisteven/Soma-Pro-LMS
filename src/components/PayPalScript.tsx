// components/PayPalScript.tsx
'use client'

import { useEffect } from 'react'

export default function PayPalScript() {
  useEffect(() => {
    // Check if script already exists
    if (!document.querySelector('#paypal-script')) {
      const script = document.createElement('script')
      script.id = 'paypal-script'
      script.src = 'https://www.paypal.com/sdk/js?client-id=BAAdCwbJY1dnhyaoqEmZBAqu3Nh5h1mMrmtr75EgrX10qtzh3fXAluD-UwOV5Qa3FIO1kyzBNdJdboXn8M&components=hosted-buttons&disable-funding=venmo&currency=KES'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  return null
}