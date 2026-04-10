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
    const { courseId, amount, transactionId, receiptNumber } = await request.json()
    
    // Check if payment already recorded
    const existingPayment = await prisma.payment.findFirst({
      where: { transactionId }
    })
    
    if (existingPayment) {
      return NextResponse.json({ message: 'Payment already recorded' })
    }
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        studentId: user.id,
        courseId,
        amount,
        paidAmount: amount,
        method: 'MPESA',
        status: 'COMPLETED',
        transactionId: receiptNumber || transactionId,
      }
    })
    
    // Update application
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
          status: 'PAID',
          totalPaid: amount
        }
      })
    } else {
      const newTotalPaid = (application.totalPaid || 0) + amount
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      })
      
      const isFullyPaid = newTotalPaid >= (course?.price || 0)
      
      await prisma.application.update({
        where: { id: application.id },
        data: {
          totalPaid: newTotalPaid,
          status: isFullyPaid ? 'PAID' : 'PARTIAL_PAID',
        }
      })
    }
    
    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}