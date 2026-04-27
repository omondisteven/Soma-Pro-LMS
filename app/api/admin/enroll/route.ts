// app/api/admin/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

// ================= POST =================
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  const userRole = user?.role as string
  if (!user || (userRole !== 'ADMIN' && userRole !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { studentId, courseId } = await request.json()
    
    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: 'Student ID and Course ID are required' },
        { status: 400 }
      )
    }
    
    // Check if student exists
    const student = await prisma.user.findFirst({
      where: { id: studentId, role: 'STUDENT' }
    })
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    
    // Check application
    const application = await prisma.application.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    })
    
    if (!application) {
      return NextResponse.json(
        { error: 'Student has not applied for this course' },
        { status: 400 }
      )
    }
    
    if (application.totalPaid === 0 && application.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Student has not completed payment for this course' },
        { status: 400 }
      )
    }
    
    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    })
    
    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this course' },
        { status: 400 }
      )
    }
    
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        progress: 0
      }
    })
    
    // Update application status
    await prisma.application.update({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      },
      data: {
        status: 'APPROVED'
      }
    })
    
    return NextResponse.json({ success: true, enrollment })
  } catch (error) {
    console.error('Error enrolling student:', error)
    return NextResponse.json(
      { error: 'Failed to enroll student' },
      { status: 500 }
    )
  }
}

// ================= GET =================
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  const userRole = user?.role as string
  if (!user || (userRole !== 'ADMIN' && userRole !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const applications = await prisma.application.findMany({
      where: {
        OR: [
          { totalPaid: { gt: 0 } },
          { status: 'PAID' }
        ],
        NOT: {
          status: 'APPROVED'
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            highSchoolCompleted: true,
            qualification: true,
            qualificationDiscipline: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            shortName: true,
            price: true,
            currency: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paidAmount: true,
            method: true,
            status: true,
            transactionId: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}