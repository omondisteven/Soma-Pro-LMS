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
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        highSchoolCompleted: true,
        qualification: true,
        qualificationDiscipline: true,
        createdAt: true,
        enrollments: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Transform data to include enrolled courses count
    const formattedStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      highSchoolCompleted: student.highSchoolCompleted,
      qualification: student.qualification,
      qualificationDiscipline: student.qualificationDiscipline,
      enrolledCourses: student.enrollments.length,
      createdAt: student.createdAt
    }))
    
    return NextResponse.json({ students: formattedStudents })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}