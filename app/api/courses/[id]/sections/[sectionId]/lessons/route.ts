import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { notifyMultipleStudents } from '@/lib/notifications'

export async function POST(
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
    const { title, description, type, content, videoUrl, duration, isMandatory, dueDate } = await request.json()
    
    // Verify course ownership or admin access
    let course = null
    
    if (user.role === 'ADMIN') {
      course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrollments: {
            select: { studentId: true }
          }
        }
      })
    } else {
      course = await prisma.course.findFirst({
        where: { 
          id: courseId, 
          OR: [
            { ownerId: user.id },
            { instructors: { some: { instructorId: user.id } } }
          ]
        },
        include: {
          enrollments: {
            select: { studentId: true }
          }
        }
      })
    }
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }
    
    // Verify section belongs to course
    const section = await prisma.section.findFirst({
      where: { id: sectionId, courseId }
    })
    
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }
    
    // Get current max order
    const lastLesson = await prisma.lesson.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' }
    })
    
    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        type,
        content,
        videoUrl,
        duration: duration || 10,
        isMandatory: isMandatory ?? true,
        order: (lastLesson?.order ?? 0) + 1,
        sectionId
      }
    })
    
    let assignmentId = null
    
    // If lesson type is QUIZ, create a default quiz structure
    if (type === 'QUIZ') {
      await prisma.quiz.create({
        data: {
          title: `${title} Quiz`,
          description: `Quiz for ${title}`,
          passingScore: 70,
          lessonId: lesson.id
        }
      })
    }
    
    // If lesson type is ASSIGNMENT, create a default assignment structure
    if (type === 'ASSIGNMENT') {
      // Parse the dueDate - ensure it's properly formatted
      let parsedDueDate = null
      if (dueDate) {
        parsedDueDate = new Date(dueDate)
        // Check if date is valid
        if (isNaN(parsedDueDate.getTime())) {
          parsedDueDate = null
        }
      }
      
      const assignment = await prisma.assignment.create({
        data: {
          title: `${title} Assignment`,
          description: `Assignment for ${title}`,
          maxScore: 100,
          dueDate: parsedDueDate,
          lessonId: lesson.id
        }
      })
      assignmentId = assignment.id
      
      // Notify all enrolled students about the new assignment
      const studentIds = course.enrollments.map(e => e.studentId)
      
      if (studentIds.length > 0) {
        const dueDateText = parsedDueDate ? parsedDueDate.toLocaleDateString() : 'TBA'
        await notifyMultipleStudents(
          studentIds,
          'ASSIGNMENT_NEW',
          'New Assignment',
          `New assignment "${title}" has been posted in "${course.title}". Due: ${dueDateText}`,
          `/courses/${courseId}`
        )
      }
    }
    
    return NextResponse.json({ lesson, assignmentId })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId, sectionId } = await params
    
    // Verify access
    let hasAccess = false
    
    if (user.role === 'ADMIN') {
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
    
    const lessons = await prisma.lesson.findMany({
      where: { sectionId },
      include: {
        quiz: true,
        assignment: true
      },
      orderBy: { order: 'asc' }
    })
    
    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}