import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Get all enrollments for the student
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: {
          include: {
            owner: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })
    
    const grades = []
    let totalGradePoints = 0
    let totalCompletedCredits = 0
    let totalCredits = 0
    
    for (const enrollment of enrollments) {
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
      
      // Calculate course grade
      let totalEarnedPoints = 0
      let totalPossiblePoints = 0
      let gradedCount = 0
      
      for (const assignment of assignments) {
        totalPossiblePoints += assignment.maxScore
        
        const submission = assignment.submissions[0]
        if (submission && submission.grade !== null && submission.grade !== undefined) {
          totalEarnedPoints += submission.grade
          gradedCount++
        }
      }
      
      const coursePercentage = totalPossiblePoints > 0 
        ? (totalEarnedPoints / totalPossiblePoints) * 100 
        : 0
      
      // Determine if course is completed (at least 60% and all assignments graded)
      const isCompleted = assignments.length > 0 && gradedCount === assignments.length && coursePercentage >= 60
      
      // Calculate grade points for GPA (4.0 scale)
      let gradePoints = 0
      if (coursePercentage >= 90) gradePoints = 4.0
      else if (coursePercentage >= 85) gradePoints = 3.7
      else if (coursePercentage >= 80) gradePoints = 3.3
      else if (coursePercentage >= 75) gradePoints = 3.0
      else if (coursePercentage >= 70) gradePoints = 2.7
      else if (coursePercentage >= 65) gradePoints = 2.3
      else if (coursePercentage >= 60) gradePoints = 2.0
      else if (coursePercentage >= 50) gradePoints = 1.0
      else gradePoints = 0
      
      const credits = 3 // Each course has 3 credits
      totalCredits += credits
      
      if (isCompleted) {
        totalGradePoints += gradePoints * credits
        totalCompletedCredits += credits
      }
      
      const getLetterGrade = (percentage: number): string => {
        if (percentage >= 90) return 'A'
        if (percentage >= 85) return 'A-'
        if (percentage >= 80) return 'B+'
        if (percentage >= 75) return 'B'
        if (percentage >= 70) return 'B-'
        if (percentage >= 65) return 'C+'
        if (percentage >= 60) return 'C'
        if (percentage >= 55) return 'C-'
        if (percentage >= 50) return 'D'
        return 'F'
      }
      
      grades.push({
        id: enrollment.course.id,
        courseName: enrollment.course.title,
        courseCode: enrollment.course.shortName,
        instructor: enrollment.course.owner.name,
        grade: gradedCount > 0 ? Math.round(coursePercentage) : null,
        letterGrade: gradedCount > 0 ? getLetterGrade(coursePercentage) : '—',
        credits: credits,
        status: isCompleted ? 'completed' : 'in-progress',
        progress: enrollment.progress
      })
    }
    
    const overallGPA = totalCompletedCredits > 0 
      ? totalGradePoints / totalCompletedCredits 
      : 0
    
    return NextResponse.json({
      grades,
      overallGPA,
      completedCredits: totalCompletedCredits,
      totalCredits
    })
  } catch (error) {
    console.error('Error fetching grades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    )
  }
}