// app\(authenticated)\courses\[id]\page.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Play, 
  FileText, 
  Video, 
  CheckCircle, 
  Circle, 
  ChevronRight,
  ChevronDown,
  Clock,
  Award,
  ArrowLeft,
  X
} from 'lucide-react'

// Import components
import QuizComponent from '@/components/QuizComponent'
import AssignmentComponent from '@/components/AssignmentComponent'

interface Lesson {
  id: string
  title: string
  description: string
  type: string
  content: string
  videoUrl: string
  duration: number
  order: number
  isMandatory: boolean
  quiz?: any
  assignment?: any
}

interface Section {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  description: string
  sections: Section[]
}

interface Progress {
  status: string
  score: number
}

export default function CoursePlayerPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [progressMap, setProgressMap] = useState<Map<string, Progress>>(new Map())
  const [lessonData, setLessonData] = useState<any>(null)
  const [lessonProgress, setLessonProgress] = useState<any>(null)
  const [loadingLesson, setLoadingLesson] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [fetchingProgress, setFetchingProgress] = useState(false)
  const progressFetchedRef = useRef(false)

  useEffect(() => {
    fetchCourse()
    fetchProgress()
  }, [courseId])

  const fetchCourse = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCourse(data.course)
      
      if (data.course?.sections?.length) {
        setExpandedSections(new Set([data.course.sections[0].id]))
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProgress = useCallback(async () => {
    if (fetchingProgress) return
    setFetchingProgress(true)
    
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/progress/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const map = new Map()
      data.progress?.forEach((p: any) => {
        map.set(p.lessonId, { status: p.status, score: p.score })
      })
      setProgressMap(map)
      progressFetchedRef.current = true
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setFetchingProgress(false)
    }
  }, [courseId, fetchingProgress])

  const handleSelectLesson = useCallback(async (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setShowPlayer(true)
    setLoadingLesson(true)
    
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setLessonData(data.lesson)
      setLessonProgress(data.progress)
    } catch (error) {
      console.error('Error fetching lesson:', error)
    } finally {
      setLoadingLesson(false)
    }
  }, [])

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video size={18} />
      case 'QUIZ': return <Award size={18} />
      case 'ASSIGNMENT': return <FileText size={18} />
      default: return <BookOpen size={18} />
    }
  }

  const getProgressIcon = (lessonId: string) => {
    const progress = progressMap.get(lessonId)
    if (progress?.status === 'COMPLETED') {
      return <CheckCircle size={16} className="text-green-500" />
    }
    if (progress?.status === 'IN_PROGRESS') {
      return <Circle size={16} className="text-yellow-500" />
    }
    return <Circle size={16} className="text-gray-400" />
  }

  const calculateOverallProgress = () => {
    if (!course) return 0
    const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0)
    const completedLessons = Array.from(progressMap.values()).filter(p => p.status === 'COMPLETED').length
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  }

  const handleProgressUpdate = useCallback(() => {
    // Reset the ref to allow refetching
    progressFetchedRef.current = false
    fetchProgress()
    if (selectedLesson) {
      handleSelectLesson(selectedLesson)
    }
  }, [fetchProgress, selectedLesson, handleSelectLesson])

  const handleBackToCourse = () => {
    setShowPlayer(false)
    setSelectedLesson(null)
    setLessonData(null)
    setLessonProgress(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
        <p className="text-gray-600 mt-2">The course you're looking for doesn't exist or you don't have access.</p>
      </div>
    )
  }

  const overallProgress = calculateOverallProgress()

  if (showPlayer && selectedLesson) {
    return (
      <div>
        <button
          onClick={handleBackToCourse}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Course Content</span>
        </button>

        {loadingLesson ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : lessonData ? (
          <LessonPlayer
            lesson={lessonData}
            progress={lessonProgress}
            onProgressUpdate={handleProgressUpdate}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Unable to load lesson content.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
        {course.description && (
          <p className="text-gray-600 mt-1">{course.description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Course Progress</span>
          <span className="text-sm font-medium text-blue-600">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 rounded-full h-2 transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {course.sections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {section.lessons.length} {section.lessons.length === 1 ? 'lesson' : 'lessons'}
                </p>
              </div>
              {expandedSections.has(section.id) ? (
                <ChevronDown size={20} className="text-gray-500" />
              ) : (
                <ChevronRight size={20} className="text-gray-500" />
              )}
            </button>

            {expandedSections.has(section.id) && (
              <div className="divide-y divide-gray-100">
                {section.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {getLessonIcon(lesson.type)}
                      <div>
                        <p className="font-medium text-gray-900">{lesson.title}</p>
                        {lesson.description && (
                          <p className="text-sm text-gray-500">{lesson.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{lesson.duration || 5} min</span>
                          {lesson.isMandatory && (
                            <span className="text-xs text-gray-400">• Required</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getProgressIcon(lesson.id)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Lesson Player Component
function LessonPlayer({ lesson, progress, onProgressUpdate }: any) {
  const [completed, setCompleted] = useState(progress?.status === 'COMPLETED')
  const [loading, setLoading] = useState(false)
  const [localProgress, setLocalProgress] = useState(progress)
  const [existingSubmission, setExistingSubmission] = useState<any>(null)
  const [checkingSubmission, setCheckingSubmission] = useState(true)
  const isMounted = useRef(true)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (isMounted.current) {
      setCompleted(progress?.status === 'COMPLETED')
      setLocalProgress(progress)
    }
  }, [progress])

  // Check for existing submission once when assignment loads
  useEffect(() => {
    if (lesson.type !== 'ASSIGNMENT' || hasCheckedRef.current) return
    hasCheckedRef.current = true
    
    const checkSubmission = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setCheckingSubmission(false)
        return
      }
      
      try {
        const res = await fetch(`/api/assignments/${lesson.assignment?.id}/submission`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok && isMounted.current) {
          const data = await res.json()
          if (data.submission) {
            setExistingSubmission(data.submission)
            if (data.submission.grade !== null) {
              setCompleted(true)
            }
          }
        }
      } catch (error) {
        console.error('Error checking submission:', error)
      } finally {
        if (isMounted.current) setCheckingSubmission(false)
      }
    }
    
    checkSubmission()
  }, [lesson.type, lesson.assignment?.id])

  const markComplete = async () => {
    if (completed || loading) return
    
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/progress/lesson/${lesson.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'COMPLETED' })
      })
      if (res.ok && isMounted.current) {
        setCompleted(true)
        if (onProgressUpdate) {
          onProgressUpdate()
        }
      }
    } catch (error) {
      console.error('Error marking complete:', error)
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }

  // Show loading while checking for existing submission
  if (lesson.type === 'ASSIGNMENT' && checkingSubmission) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-gray-600 mt-2">{lesson.description}</p>
        )}
      </div>

      <div className="p-6">
        {lesson.type === 'VIDEO' && lesson.videoUrl && (
          <div className="aspect-video bg-black rounded-lg mb-6">
            <video
              src={lesson.videoUrl}
              controls
              className="w-full h-full rounded-lg"
            />
          </div>
        )}

        {lesson.type === 'TEXT' && lesson.content && (
          <div 
            className="prose max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        )}

        {lesson.type === 'QUIZ' && lesson.quiz && (
          <QuizComponent 
            quiz={lesson.quiz} 
            onComplete={() => {
              setCompleted(true)
              if (onProgressUpdate) onProgressUpdate()
            }}
          />
        )}

        {lesson.type === 'ASSIGNMENT' && lesson.assignment && (
          <AssignmentComponent 
            assignment={lesson.assignment} 
            onComplete={() => {
              setCompleted(true)
              if (onProgressUpdate) onProgressUpdate()
            }}
            existingSubmission={existingSubmission}
          />
        )}
      </div>

      {lesson.type !== 'QUIZ' && lesson.type !== 'ASSIGNMENT' && !completed && (
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end">
            <button
              onClick={markComplete}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      )}

      {completed && lesson.type !== 'QUIZ' && lesson.type !== 'ASSIGNMENT' && (
        <div className="border-t border-gray-200 p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="inline-block text-green-600 mr-2" size={20} />
            <span className="text-green-700">Lesson completed!</span>
          </div>
        </div>
      )}
    </div>
  )
}