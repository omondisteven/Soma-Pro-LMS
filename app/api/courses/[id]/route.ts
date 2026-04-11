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
    
    // Check if user has access
    if (user.role === 'STUDENT') {
      const isEnrolled = await prisma.enrollment.findFirst({
        where: {
          studentId: user.id,
          courseId: courseId
        }
      })
      // For checkout page, still return course info even if not enrolled
      // Only block if they need to access course content
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
// PUT - Update course
export async function PUT(
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
      price,           // Add this
      currency,        // Add this
      instructorIds 
    } = body
    
    // Validate required fields
    if (!title || !shortName || !description || !category || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if course exists and user has access (owner or instructor)
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { ownerId: user.id },
          { instructors: { some: { instructorId: user.id } } }
        ]
      }
    })
    
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }
    
    // Update course and instructors in a transaction
    const course = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update course details including price and currency
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
          price: price !== undefined ? price : existingCourse.price,     // Add this
          currency: currency || existingCourse.currency,                 // Add this
        }
      })
      
      // Update instructors: remove all and add new ones
      await tx.courseInstructor.deleteMany({
        where: { courseId: courseId }
      })
      
      // Add all instructors including owner (deduplicate)
      const allInstructorIds = [...new Set([user.id, ...(instructorIds || [])])]
      
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
// DELETE - Delete course
// DELETE - Delete course
export async function DELETE(
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
    
    // Check if course exists and user is the owner
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        ownerId: user.id
      }
    })
    
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
      // Delete assignment submissions
      prisma.assignmentSubmission.deleteMany({
        where: { assignmentId: { in: assignmentIds } }
      }),
      
      // Delete assignments
      prisma.assignment.deleteMany({
        where: { id: { in: assignmentIds } }
      }),
      
      // Delete quiz attempts
      prisma.quizAttempt.deleteMany({
        where: { quizId: { in: quizIds } }
      }),
      
      // Delete questions
      prisma.question.deleteMany({
        where: { quizId: { in: quizIds } }
      }),
      
      // Delete quizzes
      prisma.quiz.deleteMany({
        where: { id: { in: quizIds } }
      }),
      
      // Delete student progress
      prisma.studentProgress.deleteMany({
        where: { lessonId: { in: lessonIds } }
      }),
      
      // Delete lessons
      prisma.lesson.deleteMany({
        where: { id: { in: lessonIds } }
      }),
      
      // Delete sections
      prisma.section.deleteMany({
        where: { id: { in: sectionIds } }
      }),
      
      // Delete course instructors
      prisma.courseInstructor.deleteMany({
        where: { courseId: courseId }
      }),
      
      // Delete enrollments
      prisma.enrollment.deleteMany({
        where: { courseId: courseId }
      }),
      
      // Delete applications
      prisma.application.deleteMany({
        where: { courseId: courseId }
      }),
      
      // Delete payments
      prisma.payment.deleteMany({
        where: { courseId: courseId }
      }),
      
      // Finally delete the course
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