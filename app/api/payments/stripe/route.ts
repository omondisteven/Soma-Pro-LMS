import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user || user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { courseId, amount, paymentType } = await request.json()
    
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
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'kes',
          product_data: {
            name: course.title,
            description: `Course enrollment - ${paymentType === 'partial' ? 'Partial Payment' : 'Full Payment'}`
          },
          unit_amount: Math.round(amount * 100)
        },
        quantity: 1
      }],
      customer_email: user.email,
      metadata: {
        studentId: user.id,
        courseId,
        applicationId: application.id,
        paymentType
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&courseId=${courseId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?course=${courseId}`
    })
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe payment error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}