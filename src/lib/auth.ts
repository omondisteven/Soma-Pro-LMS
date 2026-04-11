// src\lib\auth.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables')
  }
  
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): JWTPayload | null {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error('JWT_SECRET is not defined')
    return null
  }
  
  try {
    return jwt.verify(token, secret) as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function getUserFromToken(token: string | undefined) {
  if (!token) return null
  
  const payload = verifyToken(token)
  if (!payload) return null
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      }
    })
    return user
  } catch (error) {
    console.error('Error fetching user from token:', error)
    return null
  }
}