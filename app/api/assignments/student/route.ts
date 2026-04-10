import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Get all assignments from courses the student is enrolled in
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: {
          include: {
            sections: {
              include: {
                lessons: {
                  where: {
                    type: 'ASSIGNMENT'
                  },
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
    
    const assignments = []
    
    for (const enrollment of enrollments) {
      for (const section of enrollment.course.sections) {
        for (const lesson of section.lessons) {
          if (lesson.assignment) {
            assignments.push({
              id: lesson.assignment.id,
              title: lesson.assignment.title,
              description: lesson.assignment.description,
              dueDate: lesson.assignment.dueDate,
              maxScore: lesson.assignment.maxScore,
              courseId: enrollment.course.id,
              courseTitle: enrollment.course.title,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              submission: lesson.assignment.submissions[0] || null
            })
          }
        }
      }
    }
    
    // Sort by due date (soonest first) - handle null dueDate
    assignments.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1  // Put items with no due date at the end
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
    
    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}