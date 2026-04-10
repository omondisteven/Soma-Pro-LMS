// app\api\assignments\[assignmentId]\submit\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { notifyAssignmentSubmitted } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { assignmentId } = await params
    const { content, attachments } = await request.json()
    
    // Check if assignment exists and belongs to a course the student is enrolled in
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          include: {
            section: {
              include: {
                course: {
                  include: {
                    enrollments: {
                      where: { studentId: user.id }
                    },
                    owner: true,
                    instructors: {
                      include: { instructor: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }
    
    if (assignment.lesson.section.course.enrollments.length === 0) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }
    
    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: user.id
      }
    })
    
    if (existingSubmission) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
    }
    
    // Create submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: user.id,
        content: content || null,
        attachments: attachments || [],
        submittedAt: new Date()
      }
    })
    
    // Update lesson progress
    await prisma.studentProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId: user.id,
          lessonId: assignment.lessonId
        }
      },
      update: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      create: {
        studentId: user.id,
        lessonId: assignment.lessonId,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })
    
    // Notify course owner (teacher)
    const course = assignment.lesson.section.course
    await notifyAssignmentSubmitted(
      course.ownerId,
      user.name,
      assignment.title,
      course.id,
      course.title,
      submission.id
    )
    
    // Notify additional instructors
    for (const instructor of course.instructors) {
      await notifyAssignmentSubmitted(
        instructor.instructorId,
        user.name,
        assignment.title,
        course.id,
        course.title,
        submission.id
      )
    }
    
    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error submitting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    )
  }
}