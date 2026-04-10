import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { assignmentId, content, attachments } = await request.json()
    
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: user.id,
        content,
        attachments,
        submittedAt: new Date()
      }
    })
    
    // Update lesson progress
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })
    
    if (assignment) {
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