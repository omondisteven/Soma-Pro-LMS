import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        visibility: 'SHOW',
        status: 'PUBLISHED'  // Make sure this is enforced
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        instructors: {
          include: {
            instructor: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error fetching public courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}