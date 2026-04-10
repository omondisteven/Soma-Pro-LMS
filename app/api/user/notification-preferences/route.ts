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
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id }
    })
    
    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
          typeSettings: {
            ASSIGNMENT_GRADED: true,
            ASSIGNMENT_NEW: true,
            ASSIGNMENT_SUBMITTED: true,
            APPLICATION_APPROVED: true,
            APPLICATION_DECLINED: true,
            APPLICATION_NEW: true,
            CERTIFICATE_READY: true,
            ANNOUNCEMENT: true,
            QUIZ_RESULT: true
          }
        }
      })
    }
    
    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { emailEnabled, pushEnabled, inAppEnabled, typeSettings } = await request.json()
    
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        emailEnabled,
        pushEnabled,
        inAppEnabled,
        typeSettings,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        emailEnabled,
        pushEnabled,
        inAppEnabled,
        typeSettings
      }
    })
    
    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}