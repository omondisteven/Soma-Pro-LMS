// app\(authenticated)\enroll-students\page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import StudentProfileModal from '@/components/StudentProfileModal'
import { Application } from '@/types/application'

export default function EnrollStudentsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  // Update the fetchApplications function to include payment status
const fetchApplications = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch('/api/admin/enroll', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    // Only show applications that have at least partial payment
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
        fetchApplications()
        alert('Student enrolled successfully!')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to enroll student')
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
      alert('Failed to enroll student')
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
        <h3 className="text-2xl font-bold text-gray-900">Review and manage student applications</h3>
      </div>

      <hr className="border-t-2 border-gray-200" />
      <br />

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Clock className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending applications</h3>
          <p className="text-gray-600">All applications have been processed</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Student Name</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
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
                  <td className="py-3 px-6 text-gray-600">
                    {new Date(application.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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