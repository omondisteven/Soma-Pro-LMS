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
    // Get ALL submissions (both pending and graded) for courses where user is instructor or owner
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          lesson: {
            section: {
              course: {
                OR: [
                  { ownerId: user.id },
                  { instructors: { some: { instructorId: user.id } } }
                ]
              }
            }
          }
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        assignment: {
          include: {
            lesson: {
              include: {
                section: {
                  include: {
                    course: {
                      select: {
                        id: true,
                        title: true,
                        shortName: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })
    
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}