import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { quizId, answers } = await request.json()
    
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true }
    })
    
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }
    
    let totalScore = 0
    let earnedScore = 0
    
    for (const question of quiz.questions) {
      totalScore += question.points
      const userAnswer = answers[question.id]
      
      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        if (userAnswer === question.correctAnswer) {
          earnedScore += question.points
        }
      } else if (question.type === 'SHORT_ANSWER') {
        // For short answer, case-insensitive comparison
        if (userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
          earnedScore += question.points
        }
      }
    }
    
    const percentage = (earnedScore / totalScore) * 100
    const passed = percentage >= quiz.passingScore
    
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: user.id,
        score: earnedScore,
        percentage,
        passed,
        answers,
        completedAt: new Date()
      }
    })
    
    // Update lesson progress if passed
    if (passed) {
      await prisma.studentProgress.upsert({
        where: {
          studentId_lessonId: {
            studentId: user.id,
            lessonId: quiz.lessonId
          }
        },
        update: {
          status: 'COMPLETED',
          score: percentage,
          completedAt: new Date()
        },
        create: {
          studentId: user.id,
          lessonId: quiz.lessonId,
          status: 'COMPLETED',
          score: percentage,
          completedAt: new Date()
        }
      })
    }
    
    return NextResponse.json({
      score: earnedScore,
      total: totalScore,
      percentage,
      passed
    })
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    )
  }
}