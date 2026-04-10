// app/api/payments/stripe/webhook/route.ts
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any

    // 🔥 Update payment
    await prisma.payment.create({
      data: {
        studentId: session.metadata.studentId,
        courseId: session.metadata.courseId,
        amount: session.amount_total / 100,
        paidAmount: session.amount_total / 100,
        method: 'CARD',
        status: 'COMPLETED',
        transactionId: session.id
      }
    })
  }

  return new Response('ok')
}