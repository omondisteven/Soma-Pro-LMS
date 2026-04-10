import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  console.log('=== M-PESA CALLBACK RECEIVED ===')
  
  try {
    const data = await request.json()
    console.log('Callback Data:', JSON.stringify(data, null, 2))
    
    const stk = data.Body?.stkCallback
    
    if (!stk) {
      console.log('❌ Invalid callback structure: missing stkCallback')
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback' })
    }
    
    console.log('ResultCode:', stk.ResultCode)
    console.log('ResultDesc:', stk.ResultDesc)
    console.log('CheckoutRequestID:', stk.CheckoutRequestID)
    console.log('MerchantRequestID:', stk.MerchantRequestID)
    
    if (stk.ResultCode === 0) {
      // Payment successful
      const metadata = stk.CallbackMetadata?.Item || []
      console.log('Callback Metadata:', metadata)
      
      let amount = 0
      let receipt = ''
      let phone = ''
      
      for (const item of metadata) {
        if (item.Name === 'Amount') amount = item.Value
        if (item.Name === 'MpesaReceiptNumber') receipt = item.Value
        if (item.Name === 'PhoneNumber') phone = item.Value
      }
      
      console.log(`✅ Payment successful: Amount=${amount}, Receipt=${receipt}, Phone=${phone}`)
      
      // Find the payment record
      const payment = await prisma.payment.findFirst({
        where: { 
          transactionId: stk.CheckoutRequestID 
        }
      })
      
      if (payment) {
        console.log('Payment record found:', payment.id)
        
        // Update payment - without metadata field if it doesn't exist
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAmount: amount,
            transactionId: receipt
          }
        })
        console.log('✅ Payment record updated')
        
        // Update application total paid
        const application = await prisma.application.findUnique({
          where: {
            studentId_courseId: {
              studentId: payment.studentId,
              courseId: payment.courseId
            }
          }
        })
        
        if (application) {
          const newTotalPaid = (application.totalPaid || 0) + amount
          const course = await prisma.course.findUnique({
            where: { id: payment.courseId }
          })
          
          const isFullyPaid = newTotalPaid >= (course?.price || 0)
          
          await prisma.application.update({
            where: { id: application.id },
            data: {
              totalPaid: newTotalPaid,
              status: isFullyPaid ? 'PAID' : 'PARTIAL_PAID',
              paymentStatus: isFullyPaid ? 'COMPLETED' : 'PARTIAL'
            }
          })
          console.log(`✅ Application updated: Total Paid=${newTotalPaid}, Status=${isFullyPaid ? 'PAID' : 'PARTIAL_PAID'}`)
        }
      } else {
        console.log('❌ Payment record not found for transactionId:', stk.CheckoutRequestID)
      }
    } else {
      console.log(`❌ Payment failed: ${stk.ResultDesc}`)
    }
    
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error) {
    console.error('❌ Callback processing error:', error)
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal error' }, { status: 500 })
  }
}