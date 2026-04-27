import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  const userRole = user?.role as string
  if (!user || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { teacherId, courseId } = await request.json()
    
    if (!teacherId || !courseId) {
      return NextResponse.json({ error: 'Teacher ID and Course ID are required' }, { status: 400 })
    }
    
    // Check if teacher exists
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: 'TEACHER' }
    })
    
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }
    
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    
    // Check if already assigned
    const existingAssignment = await prisma.courseInstructor.findUnique({
      where: {
        courseId_instructorId: {
          courseId,
          instructorId: teacherId
        }
      }
    })
    
    if (existingAssignment) {
      return NextResponse.json({ error: 'Teacher is already assigned to this course' }, { status: 400 })
    }
    
    // Create assignment
    const assignment = await prisma.courseInstructor.create({
      data: {
        courseId,
        instructorId: teacherId
      }
    })
    
    return NextResponse.json({ success: true, assignment })
  } catch (error) {
    console.error('Error assigning course:', error)
    return NextResponse.json(
      { error: 'Failed to assign course' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  const userRole = user?.role as string
  if (!user || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const teacherId = searchParams.get('teacherId')
    
    if (!courseId || !teacherId) {
      return NextResponse.json({ error: 'Course ID and Teacher ID are required' }, { status: 400 })
    }
    
    await prisma.courseInstructor.delete({
      where: {
        courseId_instructorId: {
          courseId,
          instructorId: teacherId
        }
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing course assignment:', error)
    return NextResponse.json(
      { error: 'Failed to remove course assignment' },
      { status: 500 }
    )
  }
}