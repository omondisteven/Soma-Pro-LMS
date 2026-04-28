// app\api\dashboard\stats\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    if (user.role === 'STUDENT') {
      // Student Dashboard Stats
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.id },
        include: {
          course: {
            include: {
              owner: true,
              sections: {
                include: {
                  lessons: {
                    include: {
                      assignment: {
                        include: {
                          submissions: {
                            where: { studentId: user.id }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
      
      let totalGrade = 0
      let gradedCount = 0
      let completedLessons = 0
      let totalLessons = 0
      let pendingSubmissions = 0
      const pendingSubmissionsList = []
      
      for (const enrollment of enrollments) {
        for (const section of enrollment.course.sections) {
          for (const lesson of section.lessons) {
            totalLessons++
            if (lesson.type === 'ASSIGNMENT' && lesson.assignment) {
              const submission = lesson.assignment.submissions[0]
              if (submission) {
                if (submission.grade !== null) {
                  totalGrade += submission.grade
                  gradedCount++
                  completedLessons++
                } else {
                  pendingSubmissions++
                  pendingSubmissionsList.push({
                    id: submission.id,
                    assignmentTitle: lesson.assignment.title,
                    submittedAt: submission.submittedAt
                  })
                }
              }
            } else {
              // Check progress for non-assignment lessons
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
        }
      }
      
      const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
      const averageGrade = gradedCount > 0 ? totalGrade / gradedCount : 0
      
      // Get recent courses with progress
      const recentCourses = await Promise.all(
        enrollments.slice(0, 3).map(async (enrollment) => {
          let courseCompleted = 0
          let courseTotal = 0
          
          for (const section of enrollment.course.sections) {
            for (const lesson of section.lessons) {
              courseTotal++
              const progress = await prisma.studentProgress.findUnique({
                where: {
                  studentId_lessonId: {
                    studentId: user.id,
                    lessonId: lesson.id
                  }
                }
              })
              if (progress?.status === 'COMPLETED') {
                courseCompleted++
              }
            }
          }
          
          return {
            id: enrollment.course.id,
            title: enrollment.course.title,
            progress: courseTotal > 0 ? Math.round((courseCompleted / courseTotal) * 100) : 0,
            instructor: enrollment.course.owner.name,
            lastActivity: enrollment.enrolledAt
          }
        })
      )
      
      return NextResponse.json({
        stats: {
          totalCourses: enrollments.length,
          totalStudents: 0,
          averageGrade: Math.round(averageGrade),
          completionRate: Math.round(completionRate),
          pendingAssignments: pendingSubmissions,
          gradedAssignments: gradedCount
        },
        recentCourses,
        pendingSubmissions: pendingSubmissionsList.slice(0, 5)
      })
      
    } else if (user.role === 'ADMIN') {
      // ===== GLOBAL SYSTEM STATS =====

      const totalCourses = await prisma.course.count()

      const totalStudents = await prisma.user.count({
        where: { role: 'STUDENT' }
      })

      const totalTeachers = await prisma.user.count({
        where: { role: 'TEACHER' }
      })

      const totalEnrollments = await prisma.enrollment.count()

      // All graded submissions
      const gradedSubmissions = await prisma.assignmentSubmission.findMany({
        where: {
          grade: { not: null }
        },
        select: { grade: true }
      })

      // ✅ Fix TypeScript types
      const totalGradeSum = gradedSubmissions.reduce(
        (sum: number, s: { grade: number | null }) => sum + (s.grade ?? 0),
        0
      )

      const averageGrade =
        gradedSubmissions.length > 0
          ? totalGradeSum / gradedSubmissions.length
          : 0

      // Pending approvals (applications)
      const pendingApplications = await prisma.application.count({
        where: {
          status: {
            in: ['PENDING', 'PARTIAL_PAID']
          }
        }
      })

      // Revenue (only paid)
      const paidApplications = await prisma.application.findMany({
        where: {
          status: {
            in: ['PAID', 'APPROVED']
          }
        },
        select: { totalPaid: true }
      })

      const totalRevenue = paidApplications.reduce(
        (sum, app) => sum + (app.totalPaid || 0),
        0
      )

      // Recent courses (latest created)
      const recentCourses = await prisma.course.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: true
        }
      })

      return NextResponse.json({
        stats: {
          totalCourses,
          totalStudents,
          totalTeachers,
          totalEnrollments,
          averageGrade: Math.round(averageGrade),
          completionRate: 0,
          pendingAssignments: pendingApplications,
          gradedAssignments: gradedSubmissions.length,
          revenue: totalRevenue
        },
        recentCourses: recentCourses.map(course => ({
          id: course.id,
          title: course.title,
          progress: 0,
          instructor: course.owner.name,
          lastActivity: course.createdAt
        })),
        pendingSubmissions: [] // optional for admin
      })
    } else if (user.role === 'TEACHER') {
      // Teacher Dashboard Stats
      const courses = await prisma.course.findMany({
        where: {
          OR: [
            { ownerId: user.id },
            { instructors: { some: { instructorId: user.id } } }
          ]
        },
        include: {
          enrollments: true,
          sections: {
            include: {
              lessons: {
                include: {
                  assignment: {
                    include: {
                      submissions: true
                    }
                  }
                }
              }
            }
          }
        }
      })
      
      let totalStudents = 0
      let totalGradeSum = 0
      let totalGradedSubmissions = 0
      let pendingGrading = 0
      const pendingGradingList = []
      
      for (const course of courses) {
        totalStudents += course.enrollments.length
        
        for (const section of course.sections) {
          for (const lesson of section.lessons) {
            if (lesson.assignment) {
              for (const submission of lesson.assignment.submissions) {
                if (submission.grade !== null) {
                  totalGradeSum += submission.grade
                  totalGradedSubmissions++
                } else {
                  pendingGrading++
                  pendingGradingList.push({
                    id: submission.id,
                    assignmentTitle: lesson.assignment.title,
                    studentName: (await prisma.user.findUnique({ where: { id: submission.studentId } }))?.name,
                    submittedAt: submission.submittedAt
                  })
                }
              }
            }
          }
        }
      }
      
      const averageGrade = totalGradedSubmissions > 0 ? totalGradeSum / totalGradedSubmissions : 0
      
      // Calculate course completion rates
      const recentCourses = await Promise.all(
        courses.slice(0, 3).map(async (course) => {
          let totalLessons = 0
          let totalCompletions = 0
          
          for (const section of course.sections) {
            for (const lesson of section.lessons) {
              totalLessons++
              const completions = await prisma.studentProgress.count({
                where: {
                  lessonId: lesson.id,
                  status: 'COMPLETED'
                }
              })
              totalCompletions += completions
            }
          }
          
          const expectedCompletions = totalLessons * course.enrollments.length
          const completionRate = expectedCompletions > 0 ? (totalCompletions / expectedCompletions) * 100 : 0
          
          return {
            id: course.id,
            title: course.title,
            progress: Math.round(completionRate),
            instructor: user.name,
            lastActivity: course.updatedAt
          }
        })
      )
      
      return NextResponse.json({
        stats: {
          totalCourses: courses.length,
          totalStudents,
          averageGrade: Math.round(averageGrade),
          completionRate: 0,
          pendingAssignments: pendingGrading,
          gradedAssignments: totalGradedSubmissions
        },
        recentCourses,
        pendingSubmissions: pendingGradingList.slice(0, 5)
      })
    }
    
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}