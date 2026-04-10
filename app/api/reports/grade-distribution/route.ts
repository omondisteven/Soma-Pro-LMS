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
    
    const distributions = []
    
    for (const course of courses) {
      if (courseFilter !== 'all' && course.id !== courseFilter) continue
      
      // Get all students enrolled in this course
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: {
          student: true
        }
      })
      
      const studentGrades: number[] = []
      
      for (const enrollment of enrollments) {
        // Calculate overall grade for this student
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
              where: { studentId: enrollment.studentId }
            }
          }
        })
        
        let totalEarned = 0
        let totalPossible = 0
        
        for (const assignment of assignments) {
          totalPossible += assignment.maxScore
          const submission = assignment.submissions[0]
          if (submission && submission.grade !== null) {
            totalEarned += submission.grade
          }
        }
        
        const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null
        if (percentage !== null) {
          studentGrades.push(percentage)
        }
      }
      
      if (studentGrades.length === 0) continue
      
      // Sort grades for median calculation
      const sortedGrades = [...studentGrades].sort((a, b) => a - b)
      const median = sortedGrades[Math.floor(sortedGrades.length / 2)]
      
      // Calculate standard deviation
      const mean = studentGrades.reduce((sum, g) => sum + g, 0) / studentGrades.length
      const variance = studentGrades.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / studentGrades.length
      const stdDev = Math.sqrt(variance)
      
      // Calculate grade distribution ranges
      const ranges = [
        { range: '90-100%', min: 90, max: 100, count: 0 },
        { range: '80-89%', min: 80, max: 89, count: 0 },
        { range: '70-79%', min: 70, max: 79, count: 0 },
        { range: '60-69%', min: 60, max: 69, count: 0 },
        { range: 'Below 60%', min: 0, max: 59, count: 0 }
      ]
      
      for (const grade of studentGrades) {
        for (const range of ranges) {
          if (grade >= range.min && grade <= range.max) {
            range.count++
            break
          }
        }
      }
      
      distributions.push({
        courseId: course.id,
        courseTitle: course.title,
        gradeRanges: ranges.map(range => ({
          range: range.range,
          count: range.count,
          percentage: Math.round((range.count / studentGrades.length) * 100)
        })),
        averageGrade: Math.round(mean),
        medianGrade: Math.round(median),
        standardDeviation: stdDev,
        totalStudents: studentGrades.length
      })
    }
    
    return NextResponse.json({ distributions, courses })
  } catch (error) {
    console.error('Error fetching grade distribution:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grade distribution' },
      { status: 500 }
    )
  }
}