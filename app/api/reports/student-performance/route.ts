import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const searchParams = request.nextUrl.searchParams
  const courseFilter = searchParams.get('course') || 'all'
  
  try {
    // Get courses where user is instructor or owner
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { instructors: { some: { instructorId: user.id } } }
        ]
      },
      select: {
        id: true,
        title: true
      }
    })
    
    let students: any[] = []
    
    for (const course of courses) {
      if (courseFilter !== 'all' && course.id !== courseFilter) continue
      
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: {
          student: true
        }
      })
      
      for (const enrollment of enrollments) {
        // Get assignments for this course
        const assignments = await prisma.assignment.findMany({
          where: {
            lesson: {
              section: {
                courseId: course.id
              }
            }
          },
          include: {
            submissions: {
              where: { studentId: enrollment.studentId }
            }
          }
        })
        
        let completedAssignments = 0
        let totalGrade = 0
        let gradedCount = 0
        
        for (const assignment of assignments) {
          const submission = assignment.submissions[0]
          if (submission) {
            completedAssignments++
            if (submission.grade !== null) {
              totalGrade += submission.grade
              gradedCount++
            }
          }
        }
        
        // Get quizzes
        const quizzes = await prisma.quiz.findMany({
          where: {
            lesson: {
              section: {
                courseId: course.id
              }
            }
          },
          include: {
            attempts: {
              where: { studentId: enrollment.studentId }
            }
          }
        })
        
        let quizzesTaken = 0
        let totalQuizScore = 0
        
        for (const quiz of quizzes) {
          const attempt = quiz.attempts[0]
          if (attempt && attempt.score) {
            quizzesTaken++
            totalQuizScore += attempt.score
          }
        }
        
        const avgQuizScore = quizzesTaken > 0 ? Math.round(totalQuizScore / quizzesTaken) : 0
        
        // Get last activity
        const lastSubmission = await prisma.assignmentSubmission.findFirst({
          where: {
            studentId: enrollment.studentId,
            assignment: {
              lesson: {
                section: {
                  courseId: course.id
                }
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        })
        
        const overallGrade = gradedCount > 0 ? Math.round((totalGrade / (assignments.length * 100)) * 100) : null
        
        students.push({
          id: enrollment.student.id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          courseId: course.id,
          courseTitle: course.title,
          progress: enrollment.progress,
          grade: overallGrade,
          assignmentsCompleted: completedAssignments,
          totalAssignments: assignments.length,
          quizzesTaken,
          avgQuizScore,
          lastActive: lastSubmission?.submittedAt || enrollment.enrolledAt
        })
      }
    }
    
    return NextResponse.json({ students, courses })
  } catch (error) {
    console.error('Error fetching student performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student performance' },
      { status: 500 }
    )
  }
}