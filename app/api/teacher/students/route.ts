import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Get all courses where user is instructor or owner
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { instructors: { some: { instructorId: user.id } } }
        ]
      },
      select: {
        id: true,
        title: true,
        shortName: true
      }
    })
    
    const courseIds = courses.map(c => c.id)
    
    // Get all enrollments for these courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: { in: courseIds }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            shortName: true
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    })
    
    // Calculate last active and grade for each enrollment
    const studentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get last activity (last submission or progress update)
        const lastSubmission = await prisma.assignmentSubmission.findFirst({
          where: {
            studentId: enrollment.studentId,
            assignment: {
              lesson: {
                section: {
                  courseId: enrollment.courseId
                }
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        })
        
        // Calculate overall course grade
        const assignments = await prisma.assignment.findMany({
          where: {
            lesson: {
              section: {
                courseId: enrollment.courseId
              }
            }
          },
          include: {
            submissions: {
              where: { studentId: enrollment.studentId }
            }
          }
        })
        
        let totalEarnedPoints = 0
        let totalPossiblePoints = 0
        
        for (const assignment of assignments) {
          totalPossiblePoints += assignment.maxScore
          const submission = assignment.submissions[0]
          if (submission && submission.grade !== null) {
            totalEarnedPoints += submission.grade
          }
        }
        
        const overallGrade = totalPossiblePoints > 0 
          ? (totalEarnedPoints / totalPossiblePoints) * 100 
          : null
        
        return {
          id: enrollment.student.id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          courseId: enrollment.course.id,
          courseName: enrollment.course.title,
          courseCode: enrollment.course.shortName,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          lastActive: lastSubmission?.submittedAt || enrollment.enrolledAt,
          grade: overallGrade ? Math.round(overallGrade) : undefined
        }
      })
    )
    
    return NextResponse.json({
      students: studentsWithProgress,
      courses: courses.map(c => ({ id: c.id, title: c.title }))
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}