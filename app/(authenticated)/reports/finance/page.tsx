'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Calendar, Download, Loader2 } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  createdAt: string
  student: { name: string; email: string }
  course: { title: string }
}

interface FinanceStats {
  totalRevenue: number
  totalPayments: number
  averagePayment: number
  monthlyRevenue: { month: string; amount: number }[]
}

export default function FinanceReportPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    totalPayments: 0,
    averagePayment: 0,
    monthlyRevenue: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinanceData()
  }, [])

  const fetchFinanceData = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/admin/finance', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setPayments(data.payments || [])
      setStats({
        totalRevenue: data.totalRevenue || 0,
        totalPayments: data.payments?.length || 0,
        averagePayment: data.payments?.length ? (data.totalRevenue / data.payments.length) : 0,
        monthlyRevenue: data.monthlyRevenue || []
      })
    } catch (error) {
      console.error('Error fetching finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    const headers = ['Date', 'Student', 'Course', 'Amount', 'Method', 'Status']
    const rows = payments.map(p => [
      new Date(p.createdAt).toLocaleDateString(),
      p.student.name,
      p.course.title,
      p.amount,
      p.method,
      p.status
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Track revenue and payment analytics</p>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download size={18} />
          Download Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">KES {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign size={32} className="text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Payments</p>
              <p className="text-3xl font-bold mt-1">{stats.totalPayments}</p>
            </div>
            <TrendingUp size={32} className="text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Average Payment</p>
              <p className="text-3xl font-bold mt-1">KES {Math.round(stats.averagePayment).toLocaleString()}</p>
            </div>
            <Calendar size={32} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Student</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Amount</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Method</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6 text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{payment.student.name}</p>
                      <p className="text-xs text-gray-500">{payment.student.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-gray-600">{payment.course.title}</td>
                  <td className="py-3 px-6 font-semibold text-gray-900">KES {payment.amount.toLocaleString()}</td>
                  <td className="py-3 px-6">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {payment.method}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}