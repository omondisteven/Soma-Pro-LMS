'use client'

import { useEffect, useState } from 'react'
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Clock,
  FileText,
  PieChart,
  Activity
} from 'lucide-react'

interface ReportCard {
  id: string
  title: string
  description: string
  icon: any
  color: string
  href: string
  roles: string[]
}

const reportCards: ReportCard[] = [
  // Student Reports
  {
    id: 'student-progress',
    title: 'Progress Report',
    description: 'Track your course completion progress and achievements',
    icon: TrendingUp,
    color: 'bg-blue-500',
    href: '/reports/progress',
    roles: ['STUDENT']
  },
  {
    id: 'student-grades',
    title: 'Grade Report',
    description: 'View all your grades, GPA, and performance trends',
    icon: Award,
    color: 'bg-green-500',
    href: '/reports/grades',
    roles: ['STUDENT']
  },
  {
    id: 'student-assignments',
    title: 'Assignment Report',
    description: 'Track your assignment submissions and feedback',
    icon: FileText,
    color: 'bg-purple-500',
    href: '/reports/assignments',
    roles: ['STUDENT']
  },
  {
    id: 'student-analytics',
    title: 'Learning Analytics',
    description: 'Study time, activity heatmap, and learning patterns',
    icon: Activity,
    color: 'bg-orange-500',
    href: '/reports/analytics',
    roles: ['STUDENT']
  },
  
  // Teacher Reports
  {
    id: 'teacher-course-analytics',
    title: 'Course Analytics',
    description: 'Enrollment trends, completion rates, and performance metrics',
    icon: BarChart3,
    color: 'bg-blue-500',
    href: '/reports/course-analytics',
    roles: ['TEACHER']
  },
  {
    id: 'teacher-student-performance',
    title: 'Student Performance',
    description: 'Individual student grades, progress, and activity',
    icon: Users,
    color: 'bg-green-500',
    href: '/reports/student-performance',
    roles: ['TEACHER']
  },
  {
    id: 'teacher-assignment-analysis',
    title: 'Assignment Analysis',
    description: 'Submission rates, grade distribution, and score averages',
    icon: FileText,
    color: 'bg-purple-500',
    href: '/reports/assignment-analysis',
    roles: ['TEACHER']
  },
  {
    id: 'teacher-engagement',
    title: 'Engagement Report',
    description: 'Student activity, participation, and login frequency',
    icon: Activity,
    color: 'bg-orange-500',
    href: '/reports/engagement',
    roles: ['TEACHER']
  },
  {
    id: 'teacher-grade-distribution',
    title: 'Grade Distribution',
    description: 'Statistical breakdown of grades with visual charts',
    icon: PieChart,
    color: 'bg-red-500',
    href: '/reports/grade-distribution',
    roles: ['TEACHER']
  }
]

export default function ReportsPage() {
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserRole(user.role)
    }
    setLoading(false)
  }, [])

  const filteredReports = reportCards.filter(report => 
    report.roles.includes(userRole)
  )

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
        <h3 className="font-bold text-gray-900">View and download detailed analytics about your learning journey</h3>
      </div>

      <hr className="border-t-2 border-gray-200" />
      <br />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const Icon = report.icon
          return (
            <a
              key={report.id}
              href={report.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${report.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
                <Download size={18} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
              <p className="text-gray-600 text-sm">{report.description}</p>
            </a>
          )
        })}
      </div>
    </div>
  )
}