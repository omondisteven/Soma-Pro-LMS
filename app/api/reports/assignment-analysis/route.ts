import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const searchParams = request.nextUrl.searchParams
  const courseFilter = searchParams.get('course') || 'all'
  
  try {
    // Get courses where user is instructor or owner
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { instructors: { some: { instructorId: user.id } } }
        ]
      },
      select: {
        id: true,
        title: true
      }
    })
    
    let allAssignments: any[] = []
    
    for (const course of courses) {
      if (courseFilter !== 'all' && course.id !== courseFilter) continue
      
      const assignments = await prisma.assignment.findMany({
        where: {
          lesson: {
            section: {
              courseId: course.id
            }
          }
        },
        include: {
          submissions: {
            include: {
              student: true
            }
          }
        }
      })
      
      for (const assignment of assignments) {
        const totalSubmissions = assignment.submissions.length
        const gradedCount = assignment.submissions.filter(s => s.grade !== null).length
        const pendingCount = totalSubmissions - gradedCount
        
        let totalScore = 0
        let highestScore = 0
        let lowestScore = 100
        let onTimeCount = 0
        
        for (const submission of assignment.submissions) {
          if (submission.grade !== null) {
            totalScore += submission.grade
            if (submission.grade > highestScore) highestScore = submission.grade
            if (submission.grade < lowestScore) lowestScore = submission.grade
          }
          
          if (assignment.dueDate && submission.submittedAt <= assignment.dueDate) {
            onTimeCount++
          }
        }
        
        const averageScore = gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0
        const onTimeRate = totalSubmissions > 0 ? Math.round((onTimeCount / totalSubmissions) * 100) : 0
        
        allAssignments.push({
          id: assignment.id,
          title: assignment.title,
          courseTitle: course.title,
          dueDate: assignment.dueDate,
          totalSubmissions,
          gradedCount,
          pendingCount,
          averageScore,
          highestScore,
          lowestScore,
          onTimeRate
        })
      }
    }
    
    return NextResponse.json({ assignments: allAssignments, courses })
  } catch (error) {
    console.error('Error fetching assignment analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignment analysis' },
      { status: 500 }
    )
  }
}