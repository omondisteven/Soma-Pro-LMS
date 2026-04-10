import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const searchParams = request.nextUrl.searchParams
  const dateRange = searchParams.get('dateRange') || 'all'
  const courseFilter = searchParams.get('course') || 'all'
  
  try {
    // Get enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: {
          include: {
            sections: {
              include: {
                lessons: true
              }
            }
          }
        }
      }
    })
    
    const coursesData = []
    
    for (const enrollment of enrollments) {
      if (courseFilter !== 'all' && enrollment.course.id !== courseFilter) continue
      
      let totalLessons = 0
      let completedLessons = 0
      
      for (const section of enrollment.course.sections) {
        for (const lesson of section.lessons) {
          totalLessons++
          const progress = await prisma.studentProgress.findUnique({
            where: {
              studentId_lessonId: {
                studentId: user.id,
                lessonId: lesson.id
              }
            }
          })
          if (progress?.status === 'COMPLETED') {
            completedLessons++
          }
        }
      }
      
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      
      coursesData.push({
        id: enrollment.course.id,
        title: enrollment.course.title,
        progress,
        completedLessons,
        totalLessons,
        timeSpent: Math.floor(Math.random() * 300) + 60, // Mock data - implement actual tracking
        startedAt: enrollment.enrolledAt,
        lastActivity: enrollment.updatedAt
      })
    }
    
    return NextResponse.json({ courses: coursesData })
  } catch (error) {
    console.error('Error fetching progress report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    )
  }
}