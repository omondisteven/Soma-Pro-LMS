import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const searchParams = request.nextUrl.searchParams
  const semester = searchParams.get('semester') || 'all'
  const courseFilter = searchParams.get('course') || 'all'
  
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: {
          include: {
            owner: true,
            sections: {
              include: {
                lessons: {
                  where: { type: 'ASSIGNMENT' },
                  include: {
                    assignment: {
                      include: {
                        submissions: {
                          where: { studentId: user.id }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
    
    const grades = []
    for (const enrollment of enrollments) {
      let totalEarned = 0
      let totalPossible = 0
      
      for (const section of enrollment.course.sections) {
        for (const lesson of section.lessons) {
          if (lesson.assignment) {
            totalPossible += lesson.assignment.maxScore
            const submission = lesson.assignment.submissions[0]
            if (submission?.grade) {
              totalEarned += submission.grade
            }
          }
        }
      }
      
      const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null
      const getLetterGrade = (pct: number | null) => {
        if (!pct) return '—'
        if (pct >= 90) return 'A'
        if (pct >= 80) return 'B+'
        if (pct >= 75) return 'B'
        if (pct >= 70) return 'B-'
        if (pct >= 65) return 'C+'
        if (pct >= 60) return 'C'
        return 'D'
      }
      
      grades.push({
        id: enrollment.course.id,
        courseName: enrollment.course.title,
        courseCode: enrollment.course.shortName,
        instructor: enrollment.course.owner.name,
        grade: percentage ? Math.round(percentage) : null,
        letterGrade: getLetterGrade(percentage),
        credits: 3,
        status: percentage && percentage >= 60 ? 'completed' : 'in-progress',
        assignments: []
      })
    }
    
    // Mock GPA history
    const gpaHistory = [
      { semester: 'Fall 2023', gpa: 3.2, credits: 12 },
      { semester: 'Spring 2024', gpa: 3.5, credits: 15 },
      { semester: 'Fall 2024', gpa: 3.7, credits: 12 }
    ]
    
    return NextResponse.json({ grades, gpaHistory })
  } catch (error) {
    console.error('Error fetching grade report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}