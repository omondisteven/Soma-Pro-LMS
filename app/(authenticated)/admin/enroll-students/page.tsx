'use client'

import { useEffect, useState } from 'react'
import { Eye, CheckCircle, XCircle, Clock, X } from 'lucide-react'
import StudentProfileModal from '@/components/StudentProfileModal'

interface Application {
  id: string
  appliedAt: string
  status: string
  totalPaid: number
  student: {
    id: string
    name: string
    email: string
    highSchoolCompleted: boolean
    qualification: string | null
    qualificationDiscipline: string | null
  }
  course: {
    id: string
    title: string
    shortName: string
  }
}

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Student Name</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Amount Paid</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Application Date</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium text-gray-900">{application.student.name}</td>
                    <td className="py-3 px-6 text-gray-600">{application.student.email}</td>
                    <td className="py-3 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{application.course.title}</p>
                        <p className="text-xs text-gray-500">{application.course.shortName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="text-green-600 font-medium">KES {application.totalPaid.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-6 text-gray-600">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <Eye size={16} />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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