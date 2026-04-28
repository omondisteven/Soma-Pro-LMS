// app\api\reports\course-analytics\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || !['TEACHER', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const searchParams = request.nextUrl.searchParams
  const courseFilter = searchParams.get('course') || 'all'
  const dateRange = searchParams.get('range') || 'month'
  
  try {
    // Get courses where user is instructor or owner
    const courseWhere =
      user.role === 'ADMIN'
        ? {}
        : {
            OR: [
              { ownerId: user.id },
              { instructors: { some: { instructorId: user.id } } }
            ]
          }    

    const courses = await prisma.course.findMany({
      where: courseWhere, 
      include: {
        enrollments: {
          include: {
            student: true
          }
        },
        sections: {
          include: {
            lessons: true
          }
        }
      }
    })
    
    const courseAnalytics = []
    
    for (const course of courses) {
      if (courseFilter !== 'all' && course.id !== courseFilter) continue
      
      // Calculate completion rate
      let totalLessons = 0
      let completedLessons = 0
      const studentProgressMap = new Map()
      
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          totalLessons++
          const progresses = await prisma.studentProgress.findMany({
            where: {
              lessonId: lesson.id,
              status: 'COMPLETED'
            }
          })
          completedLessons += progresses.length
          progresses.forEach(p => {
            studentProgressMap.set(p.studentId, (studentProgressMap.get(p.studentId) || 0) + 1)
          })
        }
      }
      
      const totalPossibleCompletions = totalLessons * course.enrollments.length
      const completionRate = totalPossibleCompletions > 0 
        ? Math.round((completedLessons / totalPossibleCompletions) * 100) 
        : 0
      
      // Calculate average grade
      let totalGradeSum = 0
      let gradedCount = 0
      
      for (const enrollment of course.enrollments) {
        const submissions = await prisma.assignmentSubmission.findMany({
          where: {
            studentId: enrollment.studentId,
            assignment: {
              lesson: {
                section: {
                  courseId: course.id
                }
              }
            },
            grade: { not: null }
          }
        })
        
        for (const submission of submissions) {
          totalGradeSum += submission.grade || 0
          gradedCount++
        }
      }
      
      const averageGrade = gradedCount > 0 ? Math.round(totalGradeSum / gradedCount) : 0
      
      // Calculate active vs dropped students
      const activeThreshold = new Date()
      activeThreshold.setDate(activeThreshold.getDate() - 30)
      
      let activeStudents = 0
      let droppedStudents = 0
      
      for (const enrollment of course.enrollments) {
        const lastActivity = await prisma.assignmentSubmission.findFirst({
          where: {
            studentId: enrollment.studentId,
            assignment: {
              lesson: {
                section: {
                  courseId: course.id
                }
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        })
        
        if (lastActivity && lastActivity.submittedAt > activeThreshold) {
          activeStudents++
        } else if (enrollment.progress < 30) {
          droppedStudents++
        }
      }
      
      // Calculate average time spent (mock data - implement actual tracking)
      const avgTimeSpent = Math.floor(Math.random() * 300) + 60
      
      courseAnalytics.push({
        id: course.id,
        title: course.title,
        shortName: course.shortName,
        enrollments: course.enrollments.length,
        completionRate,
        averageGrade,
        totalLessons,
        avgTimeSpent,
        activeStudents,
        droppedStudents,
        weeklyActivity: generateWeeklyActivity()
      })
    }
    
    return NextResponse.json({ courses: courseAnalytics })
  } catch (error) {
    console.error('Error fetching course analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course analytics' },
      { status: 500 }
    )
  }
}

function generateWeeklyActivity() {
  return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(week => ({
    week,
    activity: Math.floor(Math.random() * 100) + 20
  }))
}