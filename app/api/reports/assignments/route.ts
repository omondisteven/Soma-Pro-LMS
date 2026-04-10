import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const searchParams = request.nextUrl.searchParams
  const statusFilter = searchParams.get('status') || 'all'
  const courseFilter = searchParams.get('course') || 'all'
  
  try {
    // Get all enrollments for the student
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: true
      }
    })
    
    let allAssignments: any[] = []
    
    for (const enrollment of enrollments) {
      // Apply course filter
      if (courseFilter !== 'all' && enrollment.course.id !== courseFilter) continue
      
      // Get all assignments for this course
      const assignments = await prisma.assignment.findMany({
        where: {
          lesson: {
            section: {
              courseId: enrollment.course.id
            }
          }
        },
        include: {
          submissions: {
            where: { studentId: user.id }
          }
        }
      })
      
      for (const assignment of assignments) {
        const submission = assignment.submissions[0]
        const status = submission ? (submission.grade !== null ? 'graded' : 'submitted') : 'pending'
        
        // Apply status filter
        if (statusFilter !== 'all' && status !== statusFilter) continue
        
        allAssignments.push({
          id: assignment.id,
          title: assignment.title,
          courseName: enrollment.course.title,
          dueDate: assignment.dueDate,
          submittedAt: submission?.submittedAt || null,
          status: status,
          score: submission?.grade || null,
          maxScore: assignment.maxScore,
          feedback: submission?.feedback || null,
          submittedOnTime: submission ? new Date(submission.submittedAt) <= new Date(assignment.dueDate) : false
        })
      }
    }
    
    // Sort by due date
    allAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    
    return NextResponse.json({ assignments: allAssignments })
  } catch (error) {
    console.error('Error fetching assignment report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignment data' },
      { status: 500 }
    )
  }
}