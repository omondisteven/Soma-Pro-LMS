'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Eye, 
  ChevronRight,
  Download,
  User,
  Calendar,
  Award,
  X,
  Filter
} from 'lucide-react'

interface Submission {
  id: string
  content: string
  attachments: string[]
  submittedAt: string
  grade: number | null
  feedback: string | null
  student: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  assignment: {
    id: string
    title: string
    description: string
    maxScore: number
    lesson: {
      title: string
      section: {
        title: string
        course: {
          id: string
          title: string
          shortName: string
        }
      }
    }
  }
}

export default function TeacherGradingPage() {
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [grade, setGrade] = useState<string>('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<'pending' | 'graded'>('pending')

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const res = await fetch('/api/teacher/submissions/pending', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setAllSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmit = async (submissionId: string) => {
    if (!grade) {
      alert('Please enter a grade')
      return
    }

    const gradeNum = parseFloat(grade)
    const maxScore = selectedSubmission?.assignment.maxScore || 100
    
    if (gradeNum < 0 || gradeNum > maxScore) {
      alert(`Grade must be between 0 and ${maxScore}`)
      return
    }

    setSubmitting(true)
    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`/api/teacher/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ grade: gradeNum, feedback })
      })

      if (res.ok) {
        alert('Submission graded successfully!')
        setSelectedSubmission(null)
        setGrade('')
        setFeedback('')
        fetchSubmissions() // Refresh the list
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to grade submission')
      }
    } catch (error) {
      console.error('Error grading submission:', error)
      alert('Failed to grade submission')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (submission: Submission) => {
    if (submission.grade !== null) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle size={12} />
          Graded
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <Clock size={12} />
        Pending
      </span>
    )
  }

  // Filter submissions based on selected filter
  const filteredSubmissions = allSubmissions.filter(sub => {
    if (filter === 'pending') return sub.grade === null
    return sub.grade !== null
  })

  const pendingCount = allSubmissions.filter(s => s.grade === null).length
  const gradedCount = allSubmissions.filter(s => s.grade !== null).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-gray-200 flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Review and grade student submissions</h3>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Clock size={16} />
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('graded')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              filter === 'graded'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CheckCircle size={16} />
            Graded ({gradedCount})
          </button>
        </div>
      </div>

      <hr className="border-t-2 border-gray-200" />
        <br />

      {allSubmissions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
          <p className="text-gray-600">When students submit assignments, they will appear here.</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'pending' ? 'No pending submissions' : 'No graded submissions yet'}
          </h3>
          <p className="text-gray-600">
            {filter === 'pending' 
              ? 'All caught up! Check back later for new submissions.'
              : 'Once you grade submissions, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {submission.assignment.title}
                      </h3>
                      {getStatusBadge(submission)}
                    </div>
                    
                    <Link 
                      href={`/courses/${submission.assignment.lesson.section.course.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {submission.assignment.lesson.section.course.title}
                    </Link>
                    
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{submission.student.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award size={14} />
                        <span>Max Score: {submission.assignment.maxScore}</span>
                      </div>
                    </div>
                    
                    {submission.grade !== null && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-700">
                          Grade: {submission.grade}/{submission.assignment.maxScore}
                        </p>
                        {submission.feedback && (
                          <p className="text-sm text-green-600 mt-1">Feedback: {submission.feedback}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6">
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission)
                        setGrade(submission.grade !== null ? submission.grade.toString() : '')
                        setFeedback(submission.feedback || '')
                      }}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye size={16} />
                      {submission.grade !== null ? 'Review' : 'Grade'}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedSubmission(null)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedSubmission.grade !== null ? 'Review & Edit Grade' : 'Grade Submission'}
                </h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Submission Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Assignment Information</h3>
                  <p className="text-gray-700">{selectedSubmission.assignment.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Course: {selectedSubmission.assignment.lesson.section.course.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    Student: {selectedSubmission.student.name} ({selectedSubmission.student.email})
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                  </p>
                </div>

                {/* Student's Submission */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Student's Submission</h3>
                  {selectedSubmission.content && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.content}</p>
                    </div>
                  )}
                  
                  {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Attachments:</p>
                      {selectedSubmission.attachments.map((url: string, idx: number) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <Download size={16} />
                          Download Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grading Form */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Grading</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade (out of {selectedSubmission.assignment.maxScore})
                    </label>
                    <input
                      type="number"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      step="0.5"
                      min="0"
                      max={selectedSubmission.assignment.maxScore}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter grade"
                    />
                    <span className="ml-2 text-sm text-gray-500">
                      / {selectedSubmission.assignment.maxScore}
                    </span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback (Optional)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide constructive feedback to the student..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleGradeSubmit(selectedSubmission.id)}
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : selectedSubmission.grade !== null ? 'Update Grade' : 'Submit Grade'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}