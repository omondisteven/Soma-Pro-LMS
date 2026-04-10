// app\api\teacher\submissions\[submissionId]\grade\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { notifyAssignmentGraded } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { submissionId } = await params
    const { grade, feedback } = await request.json()
    
    // Validate grade
    if (grade === undefined || grade === null) {
      return NextResponse.json({ error: 'Grade is required' }, { status: 400 })
    }
    
    // Get submission and verify teacher has access
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            lesson: {
              include: {
                section: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    
    // Verify teacher has access to this course
    const hasAccess = await prisma.course.findFirst({
      where: {
        id: submission.assignment.lesson.section.course.id,
        OR: [
          { ownerId: user.id },
          { instructors: { some: { instructorId: user.id } } }
        ]
      }
    })
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Update submission with grade and feedback
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: parseFloat(grade),
        feedback: feedback || null,
        gradedBy: user.id,
        gradedAt: new Date()
      }
    })
    
    // Calculate course progress percentage
    const allSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: submission.studentId,
        assignment: {
          lesson: {
            section: {
              courseId: submission.assignment.lesson.section.courseId
            }
          }
        }
      },
      include: {
        assignment: true
      }
    })
    
    const totalPossibleScore = allSubmissions.reduce((sum, s) => sum + s.assignment.maxScore, 0)
    const totalEarnedScore = allSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0)
    const courseProgress = totalPossibleScore > 0 ? (totalEarnedScore / totalPossibleScore) * 100 : 0
    
    // Update enrollment progress
    await prisma.enrollment.updateMany({
      where: {
        studentId: submission.studentId,
        courseId: submission.assignment.lesson.section.courseId
      },
      data: {
        progress: Math.round(courseProgress)
      }
    })
    
    // Update student progress for this lesson
    await prisma.studentProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId: submission.studentId,
          lessonId: submission.assignment.lessonId
        }
      },
      update: {
        status: 'COMPLETED',
        score: (parseFloat(grade) / submission.assignment.maxScore) * 100,
        completedAt: new Date()
      },
      create: {
        studentId: submission.studentId,
        lessonId: submission.assignment.lessonId,
        status: 'COMPLETED',
        score: (parseFloat(grade) / submission.assignment.maxScore) * 100,
        completedAt: new Date()
      }
    })
    
    // Send notification to student with all 6 arguments
    await notifyAssignmentGraded(
      submission.studentId,
      submission.assignment.title,
      parseFloat(grade),
      submission.assignment.maxScore,
      submission.assignment.lesson.section.course.id,
      submission.assignment.lesson.section.course.title  // Add the course title as the 6th argument
    )
    
    return NextResponse.json({ 
      submission: updatedSubmission,
      message: 'Submission graded successfully' 
    })
  } catch (error) {
    console.error('Error grading submission:', error)
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    )
  }
}