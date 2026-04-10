'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  BookOpen, 
  Award, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  GraduationCap
} from 'lucide-react'

interface StudentDetail {
  id: string
  name: string
  email: string
  avatar: string | null
  enrolledAt: string
  progress: number
  overallGrade: number | null
  course: {
    id: string
    title: string
    shortName: string
    description: string
    owner: { name: string }
  }
  assignments: {
    id: string
    title: string
    dueDate: string
    maxScore: number
    submitted: boolean
    grade: number | null
    submittedAt: string | null
  }[]
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const courseId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('course') : null
  
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (studentId && courseId) {
      fetchStudentDetails()
    }
  }, [studentId, courseId])

  const fetchStudentDetails = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/teacher/students/${studentId}?course=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch student details')
      }
      
      const data = await res.json()
      setStudent(data.student)
    } catch (error) {
      console.error('Error fetching student details:', error)
      setError('Could not load student details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (submitted: boolean, graded: boolean) => {
    if (submitted && graded) {
      return <CheckCircle size={16} className="text-green-500" />
    }
    if (submitted) {
      return <Clock size={16} className="text-yellow-500" />
    }
    return <AlertCircle size={16} className="text-red-500" />
  }

  const getStatusText = (submitted: boolean, graded: boolean) => {
    if (submitted && graded) return 'Graded'
    if (submitted) return 'Submitted'
    return 'Pending'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Student not found'}</p>
        <Link href="/students" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Students
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/students"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Students
        </Link>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-gray-500">
              <div className="flex items-center gap-1">
                <Mail size={16} />
                <span>{student.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Enrolled: {new Date(student.enrolledAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Overall Progress</div>
            <div className="text-2xl font-bold text-blue-600">{student.progress}%</div>
            {student.overallGrade !== null && (
              <>
                <div className="text-sm text-gray-500 mt-2">Course Grade</div>
                <div className="text-2xl font-bold text-green-600">{student.overallGrade}%</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Course Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen size={20} />
          Course Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Course Title</p>
            <p className="font-medium text-gray-900">{student.course.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Course Code</p>
            <p className="font-medium text-gray-900">{student.course.shortName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Instructor</p>
            <p className="font-medium text-gray-900">{student.course.owner.name}</p>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Award size={20} />
            Assignment Submissions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Assignment</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Due Date</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Submitted At</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Grade</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {student.assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No assignments found for this course
                  </td>
                </tr>
              ) : (
                student.assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium text-gray-900">
                      {assignment.title}
                    </td>
                    <td className="py-3 px-6 text-gray-500">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(assignment.submitted, assignment.grade !== null)}
                        <span className="text-sm text-gray-600">
                          {getStatusText(assignment.submitted, assignment.grade !== null)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-gray-500">
                      {assignment.submittedAt 
                        ? new Date(assignment.submittedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td className="py-3 px-6">
                      {assignment.grade !== null ? (
                        <span className="font-medium text-gray-900">
                          {assignment.grade}/{assignment.maxScore}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      {assignment.submitted && assignment.grade === null && (
                        <Link
                          href={`/teacher/grading`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Grade
                        </Link>
                      )}
                      {assignment.grade !== null && (
                        <Link
                          href={`/teacher/grading`}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}