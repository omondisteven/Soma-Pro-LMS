// app\api\applications\[id]\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { notifyApplicationApproved, notifyApplicationDeclined } from '@/lib/notifications'

// PUT - Update application (Enroll/Decline)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // params is now a Promise
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Await the params to get the id
    const { id: applicationId } = await params
    
    const { action, declineReason } = await request.json()
    
    // Get the application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        course: true,
        student: true
      }
    })
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    
    // Check if teacher has permission
    const hasAccess = await prisma.course.findFirst({
      where: {
        id: application.courseId,
        OR: [
          { ownerId: user.id },
          { instructors: { some: { instructorId: user.id } } }
        ]
      }
    })
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    if (action === 'enroll') {
      // Update application status
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'ENROLLED',
          updatedAt: new Date()
        }
      })
      
      // Create enrollment record
      await prisma.enrollment.create({
        data: {
          studentId: application.studentId,
          courseId: application.courseId,
          progress: 0
        }
      })
      
      // Send notification to student about approval
      await notifyApplicationApproved(
        application.studentId,
        application.course.title,
        application.course.id
      )
      
      return NextResponse.json({ message: 'Student enrolled successfully' })
      
    } else if (action === 'decline') {
      if (!declineReason) {
        return NextResponse.json({ error: 'Decline reason required' }, { status: 400 })
      }
      
      // Update application status
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'DECLINED',
          declineReason,
          updatedAt: new Date()
        }
      })
      
      // Send notification to student about decline
      await notifyApplicationDeclined(
        application.studentId,
        application.course.title,
        declineReason
      )
      
      return NextResponse.json({ message: 'Application declined' })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing application:', error)
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    )
  }
}

// GET - Get single application (optional, for debugging)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: applicationId } = await params
    
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: true,
        course: true
      }
    })
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    
    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    )
  }
}