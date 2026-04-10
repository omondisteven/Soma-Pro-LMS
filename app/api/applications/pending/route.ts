import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Get all pending applications for courses where user is instructor or owner
    const applications = await prisma.application.findMany({
      where: {
        status: 'PENDING',
        course: {
          OR: [
            { ownerId: user.id },
            { instructors: { some: { instructorId: user.id } } }
          ]
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
            shortName: true
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    })
    
    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching pending applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}