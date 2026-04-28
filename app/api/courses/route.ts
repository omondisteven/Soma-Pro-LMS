// app\api\courses\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

// GET - List courses
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    let courses
    
    if (user.role === 'ADMIN') {
      // Admin sees all courses
      courses = await prisma.course.findMany({
        include: {
          owner: true,
          instructors: {
            include: {
              instructor: true
            }
          },
          enrollments: true,
          _count: {
            select: { enrollments: true, sections: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
        } else if (user.role === 'TEACHER') {
          // Teacher sees courses they own OR are instructors of
          courses = await prisma.course.findMany({
            where: {
              OR: [
                { ownerId: user.id },
                { instructors: { some: { instructorId: user.id } } }
              ]
            },
            include: {
              owner: true,
              instructors: {
                include: {
                  instructor: true
                }
              },
              enrollments: true,
              _count: {
                select: { enrollments: true, sections: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
        courses = await prisma.course.findMany({
        include: {
          owner: true,
          instructors: {
            include: {
              instructor: true
            }
          },
          _count: {
            select: { sections: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }
    
    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST - Create new course (Teachers only)
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { 
      title, 
      shortName, 
      description, 
      category, 
      visibility, 
      status, 
      price,
      currency,
      startDate, 
      endDate,
      imageUrl,
      instructorIds 
    } = body
    
    // Validate required fields
    if (!title || !shortName || !description || !category || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Create course with instructors
    const course = await prisma.course.create({
      data: {
        title,
        shortName,
        description,
        category,
        visibility: visibility || 'SHOW',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        imageUrl: imageUrl || null,
        ownerId: user.id,
        status: status || 'DRAFT', 
        price: price || 0,
        currency: currency || 'KES', 
        instructors: {
          create: [
            // Add the owner as an instructor
            { instructorId: user.id },
            // Add additional instructors (deduplicate)
            ...(instructorIds || [])
              .filter((id: string) => id !== user.id)
              .map((instructorId: string) => ({ instructorId }))
          ]
        }
      },
      include: {
        owner: true,
        instructors: {
          include: {
            instructor: true
          }
        },
        _count: {
          select: { enrollments: true, sections: true }
        }
      }
    })
    
    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}