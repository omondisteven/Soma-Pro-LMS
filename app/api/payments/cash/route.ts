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
    const { courseId, amount, reference } = await request.json()

    if (!reference) {
      return NextResponse.json(
        { error: 'Receipt/Reference number is required' },
        { status: 400 }
      )
    }

    // Create payment (PENDING - to be verified later)
    const payment = await prisma.payment.create({
      data: {
        studentId: user.id,
        courseId,
        amount,
        paidAmount: amount,
        method: 'CASH', // ✅ KEEP THIS SIMPLE
        status: 'PENDING',
        transactionId: reference,
      }
    })

    // Update/Create application
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
          totalPaid: amount
        }
      })
    } else {
      const newTotalPaid = (application.totalPaid || 0) + amount

      await prisma.application.update({
        where: { id: application.id },
        data: {
          totalPaid: newTotalPaid,
          status: 'PENDING' // stays pending until verified
        }
      })
    }

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Cash payment error:', error)
    return NextResponse.json(
      { error: 'Failed to process cash payment' },
      { status: 500 }
    )
  }
}