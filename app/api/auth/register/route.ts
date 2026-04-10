import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      name, 
      role,
      highSchoolCompleted,
      qualification,
      qualificationDiscipline
    } = await request.json()
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }
    
    // Prepare data based on role
    let userData: any = {
      email,
      password: await hashPassword(password),
      name,
      role: role || 'STUDENT',
    }
    
    // Add student-specific fields if role is STUDENT
    if (role === 'STUDENT') {
      userData.highSchoolCompleted = highSchoolCompleted || false
      userData.qualification = qualification || null
      userData.qualificationDiscipline = qualificationDiscipline || null
    }
    
    // Create user
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        highSchoolCompleted: true,
        qualification: true,
        qualificationDiscipline: true,
      }
    })
    
    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    
    return NextResponse.json({
      user,
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}