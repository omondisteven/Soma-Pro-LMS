import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string; lessonId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  // Allow ADMIN or TEACHER
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId, sectionId, lessonId } = await params
    const { title, description, type, content, videoUrl, duration, isMandatory } = await request.json()
    
    // Verify course ownership or admin access
    let course = null
    
    if (user.role === 'ADMIN') {
      course = await prisma.course.findUnique({
        where: { id: courseId }
      })
    } else {
      course = await prisma.course.findFirst({
        where: { 
          id: courseId, 
          OR: [
            { ownerId: user.id },
            { instructors: { some: { instructorId: user.id } } }
          ]
        }
      })
    }
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }
    
    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title,
        description,
        type,
        content,
        videoUrl,
        duration,
        isMandatory
      }
    })
    
    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Error updating lesson:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string; lessonId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  // Allow ADMIN or TEACHER
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId, sectionId, lessonId } = await params
    
    // Verify course ownership or admin access
    let course = null
    
    if (user.role === 'ADMIN') {
      course = await prisma.course.findUnique({
        where: { id: courseId }
      })
    } else {
      course = await prisma.course.findFirst({
        where: { 
          id: courseId, 
          OR: [
            { ownerId: user.id },
            { instructors: { some: { instructorId: user.id } } }
          ]
        }
      })
    }
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }
    
    // Get quiz and assignment IDs for this lesson
    const quiz = await prisma.quiz.findFirst({
      where: { lessonId },
      select: { id: true }
    })
    
    const assignment = await prisma.assignment.findFirst({
      where: { lessonId },
      select: { id: true }
    })
    
    // Delete related data in correct order
    if (assignment) {
      await prisma.assignmentSubmission.deleteMany({
        where: { assignmentId: assignment.id }
      })
      await prisma.assignment.delete({
        where: { id: assignment.id }
      })
    }
    
    if (quiz) {
      await prisma.quizAttempt.deleteMany({
        where: { quizId: quiz.id }
      })
      await prisma.question.deleteMany({
        where: { quizId: quiz.id }
      })
      await prisma.quiz.delete({
        where: { id: quiz.id }
      })
    }
    
    await prisma.studentProgress.deleteMany({
      where: { lessonId }
    })
    
    await prisma.lesson.delete({
      where: { id: lessonId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    )
  }
}