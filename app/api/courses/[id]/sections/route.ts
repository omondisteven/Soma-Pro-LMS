import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  // Allow ADMIN or TEACHER
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId } = await params
    const { title, description } = await request.json()
    
    // Verify course exists and user has access
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
    
    if (user.role === 'ADMIN') {
      // Admin has access to all courses
      hasAccess = true
    } else if (user.role === 'TEACHER') {
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  // Allow ADMIN or TEACHER
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId, sectionId } = await params
    const { title, description } = await request.json()
    
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
    
    const section = await prisma.section.update({
      where: { id: sectionId },
      data: { title, description }
    })
    
    return NextResponse.json({ section })
  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  // Allow ADMIN or TEACHER
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId, sectionId } = await params
    
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
    
    // First, get all lesson IDs in this section
    const lessons = await prisma.lesson.findMany({
      where: { sectionId },
      select: { id: true }
    })
    const lessonIds = lessons.map(l => l.id)
    
    // Get all quiz IDs for these lessons
    const quizzes = await prisma.quiz.findMany({
      where: { lessonId: { in: lessonIds } },
      select: { id: true }
    })
    const quizIds = quizzes.map(q => q.id)
    
    // Get all assignment IDs for these lessons
    const assignments = await prisma.assignment.findMany({
      where: { lessonId: { in: lessonIds } },
      select: { id: true }
    })
    const assignmentIds = assignments.map(a => a.id)
    
    // Delete in correct order using transaction
    await prisma.$transaction([
      prisma.assignmentSubmission.deleteMany({
        where: { assignmentId: { in: assignmentIds } }
      }),
      prisma.assignment.deleteMany({
        where: { id: { in: assignmentIds } }
      }),
      prisma.quizAttempt.deleteMany({
        where: { quizId: { in: quizIds } }
      }),
      prisma.question.deleteMany({
        where: { quizId: { in: quizIds } }
      }),
      prisma.quiz.deleteMany({
        where: { id: { in: quizIds } }
      }),
      prisma.studentProgress.deleteMany({
        where: { lessonId: { in: lessonIds } }
      }),
      prisma.lesson.deleteMany({
        where: { id: { in: lessonIds } }
      }),
      prisma.section.delete({
        where: { id: sectionId }
      })
    ])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}