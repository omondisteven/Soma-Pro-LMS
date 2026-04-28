// app\api\courses\[id]\sections\[sectionId]\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId, sectionId } = await params
    const { title, description } = await request.json()
    
    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, ownerId: user.id }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }
    
    const section = await prisma.section.update({
      where: { id: sectionId },
      data: { title, description }
    })
    
    return NextResponse.json({ section })
  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id: courseId, sectionId } = await params
    
    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, ownerId: user.id }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }
    
    await prisma.section.delete({
      where: { id: sectionId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}