// app/(authenticated)/admin/finance/page.tsx
'use client'

import { useState, useEffect } from "react"

export default function FinancePage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/admin/finance')
      .then(res => res.json())
      .then(setData)
  }, [])

  return (
    <div>
      <h1>Total Revenue: KES {data?.totalRevenue}</h1>

      {data?.payments.map((p: any) => (
        <div key={p.id}>
          {p.student.name} - {p.course.title} - KES {p.amount}
        </div>
      ))}
    </div>
  )
}