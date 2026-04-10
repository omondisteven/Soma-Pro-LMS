// app\api\courses\[id]\sections\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId } = await params
    const { title, description } = await request.json()
    
    // Verify course exists and user owns it
    const course = await prisma.course.findFirst({
      where: { id: courseId, ownerId: user.id }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }
    
    // Get the current max order
    const lastSection = await prisma.section.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' }
    })
    
    const section = await prisma.section.create({
      data: {
        title,
        description,
        order: (lastSection?.order ?? 0) + 1,
        courseId
      }
    })
    
    return NextResponse.json({ section })
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId } = await params
    
    // First, verify user has access to this course
    let hasAccess = false
    
    if (user.role === 'TEACHER') {
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          OR: [
            { ownerId: user.id },
            { instructors: { some: { instructorId: user.id } } }
          ]
        }
      })
      hasAccess = !!course
    } else if (user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: user.id,
          courseId
        }
      })
      hasAccess = !!enrollment
    }
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const sections = await prisma.section.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            quiz: true,
            assignment: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })
    
    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}