import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const currentUser = await getUserFromToken(token)
  
  const currentUserRole = currentUser?.role as string
  if (!currentUser || (currentUserRole !== 'ADMIN' && currentUserRole !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id } = await params
    const { name, email, role, highSchoolCompleted, qualification, qualificationDiscipline, password } = await request.json()
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Prepare update data
    const updateData: any = {
      name,
      email,
      role,
    }
    
    // Update password if provided
    if (password) {
      updateData.password = await hashPassword(password)
    }
    
    // Add student-specific fields
    if (role === 'STUDENT') {
      updateData.highSchoolCompleted = highSchoolCompleted || false
      updateData.qualification = qualification || null
      updateData.qualificationDiscipline = qualificationDiscipline || null
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })
    
    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const currentUser = await getUserFromToken(token)
  
  const currentUserRole = currentUser?.role as string
  if (!currentUser || currentUserRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id } = await params
    
    // Don't allow deleting yourself
    if (id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }
    
    await prisma.user.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}