'use client'

import Link from 'next/link'
import { BookOpen, Users, Calendar, Clock, Settings } from 'lucide-react'
import CourseActionMenu from './CourseActionMenu'

interface Instructor {
  id: string
  name: string
  email: string
}

interface CourseInstructor {
  instructor: Instructor
}

interface Course {
  id: string
  title: string
  shortName: string
  description: string
  imageUrl: string | null
  category: string
  visibility: string
  startDate: string
  endDate: string | null
  status: string
  owner?: { name: string }
  instructors?: CourseInstructor[]
  teacher?: { name: string }
  _count: { enrollments: number; sections: number }
}

interface CourseListViewProps {
  courses: Course[]
  userRole: string
  onEdit: (course: Course) => void
  onDelete: (courseId: string) => void
  onViewDetails: (course: Course) => void
}

export default function CourseListView({
  courses,
  userRole,
  onEdit,
  onDelete,
  onViewDetails
}: CourseListViewProps) {
  const isAdmin = userRole === 'ADMIN'
  const isTeacher = userRole === 'TEACHER'
  const canManage = isAdmin || isTeacher

  // Helper function to get instructor names
  const getInstructorNames = (course: Course) => {
    if (course.instructors && course.instructors.length > 0) {
      return course.instructors.map((inv: any) => inv.instructor?.name || inv.instructor).join(', ')
    }
    if (course.owner?.name) {
      return course.owner.name
    }
    if (course.teacher?.name) {
      return course.teacher.name
    }
    return 'No instructor assigned'
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-start justify-between">
              {/* Course Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <Link href={canManage ? `/courses/${course.id}/manage` : `/courses/${course.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                  </Link>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {course.shortName}
                  </span>
                  {course.status === 'DRAFT' && canManage && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      Draft
                    </span>
                  )}
                  {course.status === 'PUBLISHED' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Published
                    </span>
                  )}
                  {course.visibility === 'HIDE' && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Hidden
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {course.description}
                </p>

                {/* Instructors Section */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>Instructors: </span>
                    <span className="text-gray-700">
                      {getInstructorNames(course)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{course._count.enrollments} students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen size={16} />
                    <span>{course._count.sections} sections</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">|</span>
                    <span>Category: {course.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>Starts: {new Date(course.startDate).toLocaleDateString()}</span>
                  </div>
                  {course.endDate && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Ends: {new Date(course.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                {/* Management Section - For Admin and Teacher */}
                {canManage && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Primary Instructor: {getInstructorNames(course)}
                    </p>
                    <Link
                      href={`/courses/${course.id}/manage`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Settings size={12} />
                      Manage Course Content
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Actions - for Admin and Teacher */}
              {canManage && (
                <CourseActionMenu
                  courseId={course.id}
                  courseTitle={course.title}
                  onEdit={() => onEdit(course)}
                  onDelete={() => onDelete(course.id)}
                  onViewDetails={() => onViewDetails(course)}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}