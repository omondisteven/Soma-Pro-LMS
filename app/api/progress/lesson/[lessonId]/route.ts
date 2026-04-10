import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { lessonId } = await params
    const { status, score } = await request.json()
    
    const progress = await prisma.studentProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId: user.id,
          lessonId: lessonId
        }
      },
      update: {
        status,
        score,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        updatedAt: new Date()
      },
      create: {
        studentId: user.id,
        lessonId: lessonId,
        status,
        score,
        completedAt: status === 'COMPLETED' ? new Date() : undefined
      }
    })
    
    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}