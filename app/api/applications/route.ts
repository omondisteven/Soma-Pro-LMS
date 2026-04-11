// app\api\applications\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

// GET - Get student's applications
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const applications = await prisma.application.findMany({
      where: { studentId: user.id },
      include: {
        course: {
          include: {
            owner: true
          }
        }
      }
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

// POST - Create/Update application (Apply/Unapply)
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { courseId, action } = await request.json()
    
    if (action === 'apply') {
      // Check if application already exists
      const existingApplication = await prisma.application.findUnique({
        where: {
          studentId_courseId: {
            studentId: user.id,
            courseId
          }
        }
      })
      
      if (existingApplication) {
        if (existingApplication.status === 'DECLINED') {
          // Reactivate declined application
          const application = await prisma.application.update({
            where: { id: existingApplication.id },
            data: {
              status: 'PENDING',
              declineReason: null,
              updatedAt: new Date()
            }
          })
          return NextResponse.json({ application, message: 'Application resubmitted' })
        } else if (existingApplication.status === 'PENDING') {
          return NextResponse.json({ error: 'Application already pending' }, { status: 400 })
        } else if (existingApplication.status === 'APPROVED') {
          return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 })
        }
      }
      
      // Create new application
      const application = await prisma.application.create({
        data: {
          studentId: user.id,
          courseId,
          status: 'PENDING'
        }
      })
      
      return NextResponse.json({ application, message: 'Application submitted successfully' })
      
    } else if (action === 'unapply') {
      // Remove application (only if not enrolled)
      await prisma.application.deleteMany({
        where: {
          studentId: user.id,
          courseId,
          status: 'PENDING'
        }
      })
      
      return NextResponse.json({ message: 'Application withdrawn' })
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