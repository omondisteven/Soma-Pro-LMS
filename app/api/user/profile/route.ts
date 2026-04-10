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
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        highSchoolCompleted: true,
        qualification: true,
        qualificationDiscipline: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
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
    const { highSchoolCompleted, qualification, qualificationDiscipline } = await request.json()
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        highSchoolCompleted,
        qualification,
        qualificationDiscipline
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        highSchoolCompleted: true,
        qualification: true,
        qualificationDiscipline: true
      }
    })
    
    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}