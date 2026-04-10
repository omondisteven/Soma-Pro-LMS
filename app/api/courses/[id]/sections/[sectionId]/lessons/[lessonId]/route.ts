import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string; lessonId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId, sectionId, lessonId } = await params
    const { title, description, type, content, videoUrl, duration, isMandatory } = await request.json()
    
    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, ownerId: user.id }
    })
    
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
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId, sectionId, lessonId } = await params
    
    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, ownerId: user.id }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }
    
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