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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Financial Overview</h1>

      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <p className="text-gray-500">Total Revenue</p>
        <h2 className="text-3xl font-bold text-green-600">
          KES {data?.totalRevenue?.toLocaleString()}
        </h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>

        <div className="space-y-3">
          {data?.payments?.map((p: any) => (
            <div
              key={p.id}
              className="flex justify-between border-b pb-2 text-sm"
            >
              <span>{p.student.name}</span>
              <span>{p.course.title}</span>
              <span className="font-medium text-green-600">
                KES {p.paidAmount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}