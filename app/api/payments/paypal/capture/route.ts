// app/api/payments/paypal/capture/route.ts
export async function POST(req: Request) {
  const { orderId, studentId, courseId, amount } = await req.json()

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`
    }
  })

  await prisma.payment.create({
    data: {
      studentId,
      courseId,
      amount,
      paidAmount: amount,
      method: 'PAYPAL',
      status: 'COMPLETED',
      transactionId: orderId
    }
  })

  return Response.json({ success: true })
}