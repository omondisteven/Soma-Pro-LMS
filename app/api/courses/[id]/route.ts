// app\api\courses\[id]\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// GET - Get single course
// GET - Get single course (allow public access for checkout)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  try {
    const { id: courseId } = await params
    
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        owner: true,
        instructors: {
          include: {
            instructor: true
          }
        },
        sections: {
          include: {
            lessons: {
              include: {
                quiz: true,
                assignment: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        enrollments: true
      }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    
    // If user is not logged in, still return basic course info
    if (!user) {
      // Return limited info for public access
      return NextResponse.json({ 
        course: {
          id: course.id,
          title: course.title,
          shortName: course.shortName,
          description: course.description,
          category: course.category,
          price: course.price,
          currency: course.currency,
          startDate: course.startDate,
          endDate: course.endDate,
          owner: course.owner,
          instructors: course.instructors
        }
      })
    }
    
    // Check if user has access - ADMIN can access everything
    if (user.role === 'ADMIN') {
      // Admins have full access
      return NextResponse.json({ course })
    }
    
    if (user.role === 'STUDENT') {
      const isEnrolled = await prisma.enrollment.findFirst({
        where: {
          studentId: user.id,
          courseId: courseId
        }
      })
      // For checkout page, still return course info even if not enrolled
      if (!isEnrolled && request.nextUrl.pathname.includes('/checkout')) {
        // Return limited info for checkout
        return NextResponse.json({ 
          course: {
            id: course.id,
            title: course.title,
            shortName: course.shortName,
            description: course.description,
            category: course.category,
            price: course.price,
            currency: course.currency,
            startDate: course.startDate,
            endDate: course.endDate,
            owner: course.owner,
            instructors: course.instructors
          }
        })
      }
    } else if (user.role === 'TEACHER') {
      const isInstructor = await prisma.courseInstructor.findFirst({
        where: {
          courseId: courseId,
          instructorId: user.id
        }
      })
      if (!isInstructor && course.ownerId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }
    
    return NextResponse.json({ course })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

// PUT - Update course
export async function PUT(
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
    const body = await request.json()
    const { 
      title, 
      shortName, 
      description, 
      category, 
      visibility, 
      status, 
      startDate, 
      endDate,
      price,
      currency, 
      instructorIds 
    } = body
    
    // Validate required fields
    if (!title || !shortName || !description || !category || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if course exists and user has access
    let existingCourse = null
    
    if (user.role === 'ADMIN') {
      // Admin can access any course
      existingCourse = await prisma.course.findUnique({
        where: { id: courseId }
      })
    } else {
      // Teacher can only access their own courses
      existingCourse = await prisma.course.findFirst({
        where: {
          id: courseId,
          OR: [
            { ownerId: user.id },
            { instructors: { some: { instructorId: user.id } } }
          ]
        }
      })
    }
    
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }
    
    // Update course and instructors in a transaction
    const course = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update course details
      const updatedCourse = await tx.course.update({
        where: { id: courseId },
        data: {
          title,
          shortName,
          description,
          category,
          visibility,
          status: status || existingCourse.status,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          price: price !== undefined ? price : existingCourse.price,
          currency: currency || existingCourse.currency,
        }
      })
      
      // Update instructors: remove all and add new ones
      await tx.courseInstructor.deleteMany({
        where: { courseId: courseId }
      })
      
      // Add all instructors including owner (deduplicate)
      const allInstructorIds = [...new Set([existingCourse.ownerId, ...(instructorIds || [])])]
      
      await tx.courseInstructor.createMany({
        data: allInstructorIds.map(instructorId => ({
          courseId: courseId,
          instructorId
        }))
      })
      
      return updatedCourse
    })
    
    return NextResponse.json({ course })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json(
      { error: 'Failed to update course: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// DELETE - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  // Allow ADMIN or TEACHER (only owner for teacher)
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId } = await params
    
    // Check if course exists and user has access
    let existingCourse = null
    
    if (user.role === 'ADMIN') {
      existingCourse = await prisma.course.findUnique({
        where: { id: courseId }
      })
    } else {
      existingCourse = await prisma.course.findFirst({
        where: {
          id: courseId,
          ownerId: user.id
        }
      })
    }
    
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }
    
    // First, get all section IDs for this course
    const sections = await prisma.section.findMany({
      where: { courseId: courseId },
      select: { id: true }
    })
    const sectionIds = sections.map(s => s.id)
    
    // Get all lesson IDs for these sections
    const lessons = await prisma.lesson.findMany({
      where: { sectionId: { in: sectionIds } },
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
    
    // Delete in correct order using transactions
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
      prisma.section.deleteMany({
        where: { id: { in: sectionIds } }
      }),
      prisma.courseInstructor.deleteMany({
        where: { courseId: courseId }
      }),
      prisma.enrollment.deleteMany({
        where: { courseId: courseId }
      }),
      prisma.application.deleteMany({
        where: { courseId: courseId }
      }),
      prisma.payment.deleteMany({
        where: { courseId: courseId }
      }),
      prisma.course.delete({
        where: { id: courseId }
      })
    ])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course: ' + (error as Error).message },
      { status: 500 }
    )
  }
}