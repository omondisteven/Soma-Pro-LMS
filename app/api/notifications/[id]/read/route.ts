import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'  // Changed from './prisma' to '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id } = await params
    
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    })
    
    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}