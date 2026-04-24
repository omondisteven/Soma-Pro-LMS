import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'
import { Role } from '@prisma/client'  // Import the Role enum from Prisma

// GET - List all users (Admin/Manager only)
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  // Check if user exists and has appropriate role
  if (!user || (user.role !== Role.ADMIN && user.role !== Role.MANAGER)) {
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
  
  if (!currentUser || (currentUser.role !== Role.ADMIN && currentUser.role !== Role.MANAGER)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { email, password, name, role, highSchoolCompleted, qualification, qualificationDiscipline } = await request.json()
    
    // Validate role creation permissions
    if (role === Role.ADMIN && currentUser.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Only admins can create admin users' }, { status: 403 })
    }
    
    if (role === Role.MANAGER && currentUser.role !== Role.ADMIN) {
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
    if (role === Role.STUDENT) {
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