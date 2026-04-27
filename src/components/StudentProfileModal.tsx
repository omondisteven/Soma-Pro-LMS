// src\components\StudentProfileModal.tsx
'use client'

import { useState } from 'react'
import { X, GraduationCap, CheckCircle, XCircle } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  paidAmount: number
  method: string
  status: string
  transactionId?: string
}

interface Application {
  id: string
  appliedAt: string
  status: string
  totalPaid: number
  // payments?: Payment[] // ✅ ADD THIS

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
    price: number        // ✅ ADD
    currency: string     // ✅ ADD
  }
  payments: {         // ✅ ADD
    id: string
    amount: number
    paidAmount: number
    method: string
    status: string
    transactionId?: string | null
  }[]
}

interface StudentProfileModalProps {
  application: Application
  onClose: () => void
  onEnroll: () => void
  isProcessing: boolean
}

const declineReasons = [
  'Not Qualified',
  'Course Unavailable',
  'Late Application',
  'Insufficient Prerequisites',
  'Application Incomplete',
  'Other'
]

const qualificationLabels: Record<string, string> = {
  DIPLOMA: 'Diploma',
  BACHELORS: "Bachelor's Degree",
  MASTERS: "Master's Degree",
  DOCTORATE: 'Doctorate (PhD)',
  CERTIFICATE: 'Professional Certificate',
  OTHER: 'Other Qualification'
}

export default function StudentProfileModal({
  application,
  onClose,
  onEnroll,
  isProcessing
}: StudentProfileModalProps) {
  const [showDecline, setShowDecline] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [isDeclining, setIsDeclining] = useState(false)

  const handleDecline = async () => {
    if (!declineReason) return
    
    setIsDeclining(true)
    const token = localStorage.getItem('token')
    
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'decline', declineReason })
      })
      
      if (res.ok) {
        alert('Application declined')
        onClose()
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to decline application')
      }
    } catch (error) {
      console.error('Error declining application:', error)
      alert('Failed to decline application')
    } finally {
      setIsDeclining(false)
    }
  }

  const getQualificationDisplay = () => {
    const qual = application.student.qualification
    const discipline = application.student.qualificationDiscipline
    
    if (!qual) return 'None'
    
    const qualLabel = qualificationLabels[qual] || qual
    if (discipline) return `${qualLabel} - ${discipline}`
    return qualLabel
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Student Profile</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Student Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">Name:</span> {application.student.name}</p>
                <p><span className="font-medium">Email:</span> {application.student.email}</p>
                <p><span className="font-medium">Application Date:</span> {new Date(application.appliedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Educational Background */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap size={20} />
                Educational Background
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p>
                  <span className="font-medium">High School Completed:</span>{' '}
                  {application.student.highSchoolCompleted ? (
                    <span className="text-green-600">Yes</span>
                  ) : (
                    <span className="text-red-600">No</span>
                  )}
                </p>
                <p>
                  <span className="font-medium">Qualification:</span> {getQualificationDisplay()}
                </p>
              </div>
            </div>

            {/* Course Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Applied Course</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">Course Title:</span> {application.course.title}</p>
                <p><span className="font-medium">Course Code:</span> {application.course.shortName}</p>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Information
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                
                <p>
                  <span className="font-medium">Total Paid:</span>{' '}
                  <span className="text-green-600 font-semibold">
                    {application.course.currency} {application.totalPaid.toLocaleString()}
                  </span>
                </p>

                <p>
                  <span className="font-medium">Course Price:</span>{' '}
                  {application.course.currency} {application.course.price.toLocaleString()}
                </p>

                <p>
                  <span className="font-medium">Balance:</span>{' '}
                  {application.course.currency}{' '}
                  {(application.course.price - application.totalPaid).toLocaleString()}
                </p>

                <p>
                  <span className="font-medium">Payment Status:</span>{' '}
                  {application.totalPaid >= application.course.price ? (
                    <span className="text-green-600 font-medium">Fully Paid</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Partial Payment</span>
                  )}
                </p>

                {/* Payment Methods Breakdown */}
                {application.payments && application.payments.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="font-medium mb-2">Payment Records:</p>

                    <div className="space-y-2">
                      {application.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="bg-white p-3 rounded border text-sm"
                        >
                          <p>
                            <span className="font-medium">Method:</span> {payment.method}
                          </p>

                          <p>
                            <span className="font-medium">Amount:</span>{' '}
                            {application.course.currency} {payment.amount.toLocaleString()}
                          </p>

                          <p>
                            <span className="font-medium">Status:</span>{' '}
                            {payment.status}
                          </p>

                          {/* CASH Receipt */}
                          {payment.method === 'CASH' && payment.transactionId && (
                            <p>
                              <span className="font-medium">Receipt No:</span>{' '}
                              {payment.transactionId}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!showDecline ? (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDecline(true)}
                  className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={onEnroll}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Enroll Student'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Declining <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a reason</option>
                    {declineReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDecline(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={!declineReason || isDeclining}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeclining ? 'Processing...' : 'Confirm Decline'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}