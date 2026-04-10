// src\components\AssignmentComponent.tsx
'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Eye, Clock } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  maxScore: number
}

interface AssignmentComponentProps {
  assignment: Assignment
  onComplete: () => void
  existingSubmission?: {
    id: string
    content: string
    attachments: string[]
    grade: number | null
    feedback: string | null
    submittedAt: string
  } | null
}

export default function AssignmentComponent({ assignment, onComplete, existingSubmission }: AssignmentComponentProps) {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitted, setSubmitted] = useState(!!existingSubmission)
  const [submission, setSubmission] = useState(existingSubmission || null)
  const [loading, setLoading] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const uploadFiles = async (): Promise<string[]> => {
    return files.map(f => `/uploads/${Date.now()}-${f.name}`)
  }

  const handleSubmit = async () => {
    if (!content && files.length === 0) {
      alert('Please provide content or upload files')
      return
    }

    setLoading(true)
    const token = localStorage.getItem('token')
    
    try {
      const fileUrls = await uploadFiles()
      
      const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          attachments: fileUrls
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to submit assignment')
      }
      
      const data = await res.json()
      setSubmission(data.submission)
      setSubmitted(true)
      onComplete()
    } catch (error: any) {
      console.error('Error submitting assignment:', error)
      alert(error.message || 'Failed to submit assignment')
    } finally {
      setLoading(false)
    }
  }

  const isPastDue: boolean = assignment.dueDate ? new Date(assignment.dueDate) < new Date() : false

  // Show submitted state with grading info
  if (submitted && submission) {
    const isGraded = submission.grade !== null && submission.grade !== undefined
    
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className={`rounded-lg p-6 text-center ${isGraded ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          {isGraded ? (
            <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
          ) : (
            <Clock size={48} className="mx-auto text-yellow-600 mb-4" />
          )}
          <h3 className={`text-xl font-bold mb-2 ${isGraded ? 'text-green-700' : 'text-yellow-700'}`}>
            {isGraded ? 'Assignment Graded!' : 'Assignment Submitted!'}
          </h3>
          <p className={isGraded ? 'text-green-600' : 'text-yellow-600'}>
            {isGraded 
              ? 'Your instructor has reviewed and graded your submission.'
              : 'Your assignment has been submitted successfully. The instructor will review it and provide feedback.'}
          </p>
          
          {submission.grade !== null && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="font-medium">Grade: {submission.grade}/{assignment.maxScore}</p>
              {submission.feedback && <p className="text-gray-600 mt-2">Feedback: {submission.feedback}</p>}
            </div>
          )}
          
          <button
            onClick={() => setShowViewModal(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Eye size={16} />
            View Submission
          </button>
        </div>

        {/* View Submission Modal */}
        {showViewModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowViewModal(false)} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <h2 className="text-xl font-bold mb-4">Your Submission</h2>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                
                {submission.content && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Answer</label>
                    <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                      {submission.content}
                    </div>
                  </div>
                )}
                
                {submission.attachments && submission.attachments.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                    <div className="space-y-2">
                      {submission.attachments.map((url: string, idx: number) => (
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
                
                {submission.grade !== null && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-700">
                      Grade: {submission.grade}/{assignment.maxScore}
                    </p>
                    {submission.feedback && (
                      <p className="text-blue-600 mt-2">Feedback: {submission.feedback}</p>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end mt-6">
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
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900">{assignment.title}</h2>
        {assignment.description && (
          <p className="text-gray-600 mt-2">{assignment.description}</p>
        )}
        <div className="flex gap-4 mt-4 text-sm">
          {assignment.dueDate && (
            <div className="flex items-center gap-1">
              <AlertCircle size={14} className={isPastDue ? 'text-red-500' : 'text-gray-400'} />
              <span className={isPastDue ? 'text-red-500' : 'text-gray-600'}>
                Due: {new Date(assignment.dueDate).toLocaleString()}
              </span>
            </div>
          )}
          <div className="text-gray-600">
            Max Score: {assignment.maxScore} points
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Answer
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Type your answer here..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-600">Click to upload files</p>
              <p className="text-sm text-gray-500">or drag and drop</p>
            </label>
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText size={16} />
                  <span>{file.name}</span>
                  <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading || isPastDue}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>

        {isPastDue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-red-600 text-sm">This assignment is past due. Submissions may not be accepted.</p>
          </div>
        )}
      </div>
    </div>
  )
}