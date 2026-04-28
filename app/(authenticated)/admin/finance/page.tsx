// app/(authenticated)/admin/finance/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Loader2, DollarSign, TrendingUp, Calendar } from 'lucide-react'

interface Payment {
  id: string
  student: { id: string; name: string; email: string }
  course: { id: string; title: string }
  paidAmount: number
  createdAt: string
  status: string
}

interface MonthlyRevenue {
  month: string
  amount: number
}

interface FinanceData {
  totalRevenue: number
  payments: Payment[]
  monthlyRevenue: MonthlyRevenue[]
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFinanceData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/admin/finance', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching finance data:', err)
        setError('Failed to load financial data')
      } finally {
        setLoading(false)
      }
    }

    fetchFinanceData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
        <p className="text-gray-600 mt-1">Track revenue and payment history</p>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Revenue Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">
                KES {data?.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign size={28} className="text-white" />
            </div>
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Transactions</p>
              <p className="text-3xl font-bold mt-1">
                {data?.payments?.length || 0}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp size={28} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      {data?.monthlyRevenue && data.monthlyRevenue.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-gray-500" />
            Monthly Revenue Trend
          </h2>
          <div className="space-y-3">
            {data.monthlyRevenue.map((month) => (
              <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </span>
                <span className="text-lg font-semibold text-green-600">
                  KES {month.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
          <p className="text-sm text-gray-500 mt-1">List of all completed payments</p>
        </div>
        
        <div className="overflow-x-auto">
          {data?.payments && data.payments.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Student</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Course</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{payment.student.name}</p>
                        <p className="text-xs text-gray-500">{payment.student.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-700">{payment.course.title}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-green-600">
                        KES {payment.paidAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <DollarSign size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500">No payments recorded yet</p>
              <p className="text-sm text-gray-400 mt-1">Payments will appear here once students complete enrollments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}