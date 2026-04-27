import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  const userRole = user?.role as string
  if (!user || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        ownedCourses: {
          select: { id: true }
        },
        taughtCourses: {
          include: {
            course: {
              select: {
                enrollments: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Transform data to include courses taught and students enrolled
    const formattedTeachers = teachers.map(teacher => {
      const totalStudents = teacher.taughtCourses.reduce((sum, tc) => {
        return sum + tc.course.enrollments.length
      }, 0)
      
      return {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        coursesTaught: teacher.ownedCourses.length + teacher.taughtCourses.length,
        studentsEnrolled: totalStudents,
        createdAt: teacher.createdAt
      }
    })
    
    return NextResponse.json({ teachers: formattedTeachers })
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    )
  }
}