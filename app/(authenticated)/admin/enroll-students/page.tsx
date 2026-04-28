// app/(authenticated)/admin/enroll-students/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Eye, CheckCircle, XCircle, Clock, X } from 'lucide-react'
import StudentProfileModal from '@/components/StudentProfileModal'
import { Application } from '@/types/application'

import { Prisma } from '@prisma/client'
import DataTable from '@/components/ui/DataTable'

export type ApplicationWithRelations =
  Prisma.ApplicationGetPayload<{
    include: {
      student: true
      course: true
      payments: true
    }
  }>


// // interface Payment {
// //   id: string
// //   amount: number
// //   paidAmount: number
// //   method: string
// //   status: string
// //   transactionId?: string
// // }

// interface Application {
//   id: string
//   appliedAt: string
//   status: string
//   totalPaid: number

//   student: {
//     id: string
//     name: string
//     email: string
//     highSchoolCompleted: boolean
//     qualification: string | null
//     qualificationDiscipline: string | null
//   }

//   course: {
//     id: string
//     title: string
//     shortName: string
//     price: number        // ✅ ADD
//     currency: string     // ✅ ADD
//   }

//   payments: {           // ✅ ADD
//     id: string
//     amount: number
//     paidAmount: number
//     method: string
//     status: string
//     transactionId?: string | null
//   }[]
// }

export default function AdminEnrollStudentsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/admin/enroll', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (applicationId: string) => {
    const token = localStorage.getItem('token')
    setProcessingId(applicationId)
    
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'enroll' })
      })
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Student enrolled successfully!' })
        fetchApplications()
        setTimeout(() => setMessage(null), 3000)
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to enroll student' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
      setMessage({ type: 'error', text: 'Failed to enroll student' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setProcessingId(null)
      setSelectedApplication(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enroll Students</h1>
        <p className="text-gray-600 mt-1">Review student applications and enroll them into courses</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          {message.text}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Clock className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending applications</h3>
          <p className="text-gray-600">All applications have been processed</p>
        </div>
      ) : (
        <DataTable
          data={applications}
          columns={[
            { key: 'student.name', header: 'Student Name', render: (app) => app.student.name, className: 'font-medium text-gray-900' },
            { key: 'student.email', header: 'Email', render: (app) => app.student.email },
            { 
              key: 'course', 
              header: 'Course',
              render: (app) => (
                <div>
                  <p className="font-medium text-gray-900">{app.course.title}</p>
                  <p className="text-xs text-gray-500">{app.course.shortName}</p>
                </div>
              )
            },
            { 
              key: 'totalPaid', 
              header: 'Amount Paid',
              render: (app) => <span className="text-green-600 font-medium">KES {app.totalPaid.toLocaleString()}</span>
            },
            { 
              key: 'appliedAt', 
              header: 'Application Date',
              render: (app) => new Date(app.appliedAt).toLocaleDateString()
            },
          ]}
          actions={[
            {
              label: 'Review',
              icon: <Eye size={14} />,
              onClick: (app) => setSelectedApplication(app)
            }
          ]}
        />
      )}

      {/* Student Profile Modal */}
      {selectedApplication && (
        <StudentProfileModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onEnroll={() => handleEnroll(selectedApplication.id)}
          isProcessing={processingId === selectedApplication.id}
        />
      )}
    </div>
  )
}