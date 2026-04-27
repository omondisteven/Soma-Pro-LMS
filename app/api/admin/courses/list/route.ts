import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  const userRole = user?.role as string
  if (!user || (userRole !== 'ADMIN' && userRole !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        shortName: true,
        instructors: {
          select: {
            instructorId: true
          }
        }
      },
      orderBy: { title: 'asc' }
    })
    
    // Format courses with current teachers
    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      shortName: course.shortName,
      currentTeachers: course.instructors.map(inv => ({ id: inv.instructorId }))
    }))
    
    return NextResponse.json({ courses: formattedCourses })
  } catch (error) {
    console.error('Error fetching courses list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}