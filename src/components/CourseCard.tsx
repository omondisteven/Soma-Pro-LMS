'use client'

import Link from 'next/link'
import { Users, BookOpen, Clock } from 'lucide-react'

interface CourseCardProps {
  course: {
    id: string
    title: string
    description: string
    imageUrl: string | null
    status: string
    teacher: { name: string }
    _count: { enrollments: number; sections: number }
  }
  userRole: string
}

export default function CourseCard({ course, userRole }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="card hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500">
          {course.imageUrl ? (
            <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="text-white" size={48} />
            </div>
          )}
          {course.status === 'DRAFT' && userRole === 'TEACHER' && (
            <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
              Draft
            </span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {course.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>{course._count.enrollments} students</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={16} />
            <span>{course._count.sections} sections</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">Instructor: {course.teacher.name}</p>
        </div>
      </div>
    </Link>
  )
}