// app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let courses: any[] = []

    // ================= ADMIN =================
    if (user.role === 'ADMIN') {
      courses = await prisma.course.findMany({
        include: {
          owner: true,
          instructors: {
            include: { instructor: true }
          },
          enrollments: true,
          _count: {
            select: { enrollments: true, sections: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // ================= TEACHER =================
    else if (user.role === 'TEACHER') {
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
            include: { instructor: true }
          },
          enrollments: true,
          _count: {
            select: { enrollments: true, sections: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // ================= STUDENT (MY COURSES) =================
    else {
      const results = await prisma.course.findMany({
        where: {
          OR: [
            {
              enrollments: {
                some: { studentId: user.id }
              }
            },
            {
              applications: {
                some: { studentId: user.id }
              }
            }
          ]
        },
        include: {
          owner: true,
          instructors: {
            include: { instructor: true }
          },
          applications: {
            where: { studentId: user.id },
            select: {
              status: true,
              totalPaid: true
            }
          },
          _count: {
            select: { sections: true, enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Flatten application data
      courses = results.map(course => {
        const app = course.applications?.[0]

        return {
          ...course,
          applicationStatus: app?.status || null,
          totalPaid: app?.totalPaid ?? 0,
          applications: undefined
        }
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