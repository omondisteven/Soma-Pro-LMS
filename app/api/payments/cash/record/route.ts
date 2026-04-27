// app\api\payments\cash\record\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { courseId, amount, receiptNumber, paymentType } = await request.json()
    
    if (!courseId || !amount || !receiptNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    
    // Create or update application
    let application = await prisma.application.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId
        }
      }
    })
    
    if (!application) {
      application = await prisma.application.create({
        data: {
          studentId: user.id,
          courseId,
          status: 'PENDING',
          totalPaid: 0
        }
      })
    }
    
    // Calculate new total paid
    const newTotalPaid = (application.totalPaid || 0) + amount
    const isFullyPaid = newTotalPaid >= course.price
    
    // Update application
    await prisma.application.update({
      where: { id: application.id },
      data: {
        totalPaid: newTotalPaid,
        status: isFullyPaid ? 'PAID' : 'PARTIAL_PAID',
      }
    })
    
    // Create payment record with CASH method (now available after migration)
    const payment = await prisma.payment.create({
      data: {
        studentId: user.id,
        courseId,
        amount,
        paidAmount: amount,
        method: 'MPESA', // Change to 'CASH' after migration
        status: 'COMPLETED',
        transactionId: receiptNumber,
        metadata: {
          receiptNumber,
          paymentType,
          verified: false
        }
      }
    })
    
    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Error recording cash payment:', error)
    return NextResponse.json(
      { error: 'Failed to record cash payment' },
      { status: 500 }
    )
  }
}