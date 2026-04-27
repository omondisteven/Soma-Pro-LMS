import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { courseId, amount, reference } = await req.json()

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference number required' },
        { status: 400 }
      )
    }

    // Create payment (PENDING verification)
    const payment = await prisma.payment.create({
      data: {
        studentId: user.id,
        courseId,
        amount,
        paidAmount: amount,
        method: 'CASH',
        status: 'PENDING',
        transactionId: reference
      }
    })

    return NextResponse.json({ success: true, payment })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to record cash payment' },
      { status: 500 }
    )
  }
}