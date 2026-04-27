// app\api\applications\check\route.ts
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
  const courseId = searchParams.get('courseId')
  
  if (!courseId) {
    return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
  }
  
  try {
    const application = await prisma.application.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId
        }
      }
    })
    
    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error checking application:', error)
    return NextResponse.json(
      { error: 'Failed to check application' },
      { status: 500 }
    )
  }
}