import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

// GET - List all users (Admin/Manager only)
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  const userRole = user?.role as string
  if (!user || (userRole !== 'ADMIN' && userRole !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        highSchoolCompleted: true,
        qualification: true,
        qualificationDiscipline: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new user (Admin/Manager only)
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const currentUser = await getUserFromToken(token)
  
  const currentUserRole = currentUser?.role as string
  if (!currentUser || (currentUserRole !== 'ADMIN' && currentUserRole !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { email, password, name, role, highSchoolCompleted, qualification, qualificationDiscipline } = await request.json()
    
    // Validate role creation permissions
    if (role === 'ADMIN' && currentUserRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can create admin users' }, { status: 403 })
    }
    
    if (role === 'MANAGER' && currentUserRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can create manager users' }, { status: 403 })
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }
    
    // Create user data
    const userData: any = {
      email,
      password: await hashPassword(password),
      name,
      role,
    }
    
    // Add student-specific fields
    if (role === 'STUDENT') {
      userData.highSchoolCompleted = highSchoolCompleted || false
      userData.qualification = qualification || null
      userData.qualificationDiscipline = qualificationDiscipline || null
    }
    
    const newUser = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })
    
    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const currentUser = await getUserFromToken(token)
  
  const currentUserRole = currentUser?.role as string
  if (!currentUser || (currentUserRole !== 'ADMIN' && currentUserRole !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id, name, role, highSchoolCompleted, qualification, qualificationDiscipline } = await request.json()
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Validate role update permissions
    if (role === 'ADMIN' && currentUserRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can update admin users' }, { status: 403 })
    }
    
    // Update user data
    const userData: any = {
      name,
      role,
    }
    
    // Add student-specific fields
    if (role === 'STUDENT') {
      userData.highSchoolCompleted = highSchoolCompleted || false
      userData.qualification = qualification || null
      userData.qualificationDiscipline = qualificationDiscipline || null
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: userData,
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
export async function DELETE(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const currentUser = await getUserFromToken(token)
  
  const currentUserRole = currentUser?.role as string
  if (!currentUser || currentUserRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
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