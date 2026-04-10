import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: studentId } = await params
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course')
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }
    
    // Verify teacher has access to this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { ownerId: user.id },
          { instructors: { some: { instructorId: user.id } } }
        ]
      }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get student details
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    })
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    
    // Get enrollment details
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: studentId,
          courseId: courseId
        }
      }
    })
    
    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled in this course' }, { status: 404 })
    }
    
    // Get all assignments for this course
    const assignments = await prisma.assignment.findMany({
      where: {
        lesson: {
          section: {
            courseId: courseId
          }
        }
      },
      include: {
        submissions: {
          where: { studentId: studentId }
        }
      },
      orderBy: { dueDate: 'asc' }
    })
    
    // Calculate overall grade
    let totalEarnedPoints = 0
    let totalPossiblePoints = 0
    
    const assignmentList = assignments.map(assignment => {
      const submission = assignment.submissions[0]
      const grade = submission?.grade ?? null
      
      if (grade !== null) {
        totalEarnedPoints += grade
        totalPossiblePoints += assignment.maxScore
      }
      
      return {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        submitted: !!submission,
        grade: grade,
        submittedAt: submission?.submittedAt || null
      }
    })
    
    const overallGrade = totalPossiblePoints > 0 
      ? (totalEarnedPoints / totalPossiblePoints) * 100 
      : null
    
    return NextResponse.json({
      student: {
        ...student,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        overallGrade: overallGrade ? Math.round(overallGrade) : null,
        course: {
          id: course.id,
          title: course.title,
          shortName: course.shortName,
          description: course.description,
          owner: {
            name: course.ownerId === user.id ? user.name : (await prisma.user.findUnique({ where: { id: course.ownerId } }))?.name
          }
        },
        assignments: assignmentList
      }
    })
  } catch (error) {
    console.error('Error fetching student details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student details' },
      { status: 500 }
    )
  }
}