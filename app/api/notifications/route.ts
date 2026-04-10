import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json({ notifications: [] }, { status: 200 })
  }
  
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ notifications: [] }, { status: 200 })
  }
  
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json({ notifications: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { userId, type, title, message, link, priority, metadata } = await request.json()
    
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        priority: priority || 'NORMAL',
        metadata
      }
    })
    
    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}