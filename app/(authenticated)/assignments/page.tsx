'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle, AlertCircle, Award, FileText, Upload, Eye } from 'lucide-react'

interface AssignmentSubmission {
  id: string
  submittedAt: string
  grade: number | null
  feedback: string | null
  attachments: string[]
  content?: string  // Add content field as optional
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  maxScore: number
  courseId: string
  courseTitle: string
  lessonId: string
  lessonTitle: string
  submission?: AssignmentSubmission
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [submissionContent, setSubmissionContent] = useState('')
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/assignments/student', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAssignments(data.assignments || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (assignmentId: string) => {
    if (!submissionContent && submissionFiles.length === 0) {
      alert('Please provide content or upload files')
      return
    }

    setSubmitting(true)
    const token = localStorage.getItem('token')

    try {
      const uploadedUrls = await uploadFiles(submissionFiles)
      
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: submissionContent,
          attachments: uploadedUrls
        })
      })

      if (res.ok) {
        alert('Assignment submitted successfully!')
        setShowSubmitModal(false)
        setSubmissionContent('')
        setSubmissionFiles([])
        fetchAssignments()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to submit assignment')
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert('Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    return files.map(f => `/uploads/${Date.now()}-${f.name}`)
  }

  const getStatus = (assignment: Assignment): 'pending' | 'submitted' | 'graded' => {
    if (!assignment.submission) return 'pending'
    if (assignment.submission.grade !== null && assignment.submission.grade !== undefined) return 'graded'
    return 'submitted'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="text-green-500" size={20} />
      case 'graded':
        return <Award className="text-blue-500" size={20} />
      default:
        return <AlertCircle className="text-yellow-500" size={20} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted'
      case 'graded':
        return 'Graded'
      default:
        return 'Pending'
    }
  }

  const isPastDue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
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
      <div className="bg-gray-200 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Track and submit your coursework</h1>
      </div>

      <hr className="border-t-2 border-gray-200" />
      <br />

      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
          <p className="text-gray-600">You don't have any pending assignments at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment: Assignment) => {
            const status = getStatus(assignment)
            const pastDue = isPastDue(assignment.dueDate)
            const submission = assignment.submission
            
            return (
              <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.title}
                        </h3>
                        {pastDue && status === 'pending' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Past Due</span>
                        )}
                      </div>
                      <Link 
                        href={`/courses/${assignment.courseId}`}
                        className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
                      >
                        {assignment.courseTitle}
                      </Link>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award size={16} />
                          <span>Max Score: {assignment.maxScore}</span>
                        </div>
                      </div>
                      
                      {/* Show grade if graded */}
                      {status === 'graded' && submission?.grade !== null && submission?.grade !== undefined && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-700">
                            Grade: {submission.grade}/{assignment.maxScore}
                          </p>
                          {submission.feedback && (
                            <p className="text-sm text-blue-600 mt-1">Feedback: {submission.feedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 ml-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="text-sm text-gray-600">{getStatusText(status)}</span>
                      </div>
                      
                      {status === 'submitted' ? (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment)
                            setShowViewModal(true)
                          }}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                          <Eye size={16} />
                          View Submission
                        </button>
                      ) : status === 'graded' ? (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment)
                            setShowViewModal(true)
                          }}
                          className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                        >
                          <Eye size={16} />
                          View Feedback
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment)
                            setShowSubmitModal(true)
                          }}
                          disabled={pastDue}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            pastDue
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <Upload size={16} />
                          Submit Assignment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowSubmitModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">Submit Assignment</h2>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedAssignment.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedAssignment.courseTitle}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={6}
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setSubmissionFiles(Array.from(e.target.files || []))}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-gray-600">Click to upload files</p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </label>
                  </div>
                  {submissionFiles.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {submissionFiles.map((file, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmit(selectedAssignment.id)}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Submission Modal */}
      {showViewModal && selectedAssignment && selectedAssignment.submission && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowViewModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">
                {selectedAssignment.submission.grade !== null ? 'Assignment Feedback' : 'Your Submission'}
              </h2>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedAssignment.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedAssignment.courseTitle}</p>
              
              <div className="space-y-4">
                {selectedAssignment.submission.content && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Answer</label>
                    <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                      {selectedAssignment.submission.content}
                    </div>
                  </div>
                )}
                
                {selectedAssignment.submission.attachments && selectedAssignment.submission.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                    <div className="space-y-2">
                      {selectedAssignment.submission.attachments.map((url: string, idx: number) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <FileText size={16} />
                          Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedAssignment.submission.grade !== null && selectedAssignment.submission.grade !== undefined && (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-700">
                        Grade: {selectedAssignment.submission.grade}/{selectedAssignment.maxScore}
                      </p>
                      {selectedAssignment.submission.feedback && (
                        <p className="text-blue-600 mt-2">Feedback: {selectedAssignment.submission.feedback}</p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Submitted on: {new Date(selectedAssignment.submission.submittedAt).toLocaleString()}
                    </div>
                  </>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}