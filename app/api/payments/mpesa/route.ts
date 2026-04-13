// app\api\payments\mpesa\route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  console.log('=== M-PESA PAYMENT INITIATION ===')
  console.log('User ID:', user?.id)
  
  if (!user || user.role !== 'STUDENT') {
    console.log('❌ Unauthorized: User not found or not student')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Validate environment variables
  const consumerKey = process.env.MPESA_CONSUMER_KEY
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET
  const shortcode = process.env.MPESA_SHORTCODE
  const passkey = process.env.MPESA_PASSKEY
  const callbackUrl = process.env.MPESA_CALLBACK_URL
  
  if (!consumerKey || !consumerSecret) {
    console.error('❌ Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET')
    return NextResponse.json({ 
      error: 'M-Pesa configuration error. Please contact support.' 
    }, { status: 500 })
  }
  
  if (!shortcode || !passkey) {
    console.error('❌ Missing MPESA_SHORTCODE or MPESA_PASSKEY')
    return NextResponse.json({ 
      error: 'M-Pesa configuration error. Please contact support.' 
    }, { status: 500 })
  }
  
  try {
    const { courseId, amount, phoneNumber, paymentType, accountReference } = await request.json()
    
    console.log('Payment Request:', {
      courseId,
      amount,
      phoneNumber,
      paymentType,
      accountReference
    })
    
    // Format phone number for M-Pesa
    let formattedPhone = phoneNumber.replace(/\D/g, '')
    console.log('Raw phone number:', phoneNumber)
    console.log('Cleaned phone number:', formattedPhone)
    
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1)
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone
    }
    
    console.log('Formatted phone number for M-Pesa:', formattedPhone)
    
    // Validate phone number format
    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      console.log('❌ Invalid phone number format:', formattedPhone)
      return NextResponse.json({ 
        error: 'Invalid phone number format. Please use format: 2547XXXXXXXX' 
      }, { status: 400 })
    }
    
    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })
    
    if (!course) {
      console.log('❌ Course not found:', courseId)
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    
    console.log('Course found:', course.title, 'Price:', course.price)
    
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
      console.log('Creating new application record...')
      application = await prisma.application.create({
        data: {
          studentId: user.id,
          courseId,
          status: 'PENDING',
          totalPaid: 0
        }
      })
      console.log('✅ Application created:', application.id)
    } else {
      console.log('Existing application found:', application.id)
    }
    
    // Get M-Pesa access token
    console.log('Fetching M-Pesa access token...')
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
    
    const tokenRes = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { 
        method: 'GET',
        headers: { 
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        } 
      }
    )
    
    const tokenData = await tokenRes.json()
    
    if (!tokenRes.ok) {
      console.log('❌ Failed to get access token:', tokenData)
      return NextResponse.json({ 
        error: 'Failed to authenticate with M-Pesa. Please try again later.' 
      }, { status: 500 })
    }
    
    const accessToken = tokenData.access_token
    console.log('✅ Access token obtained successfully')
    
    // Generate timestamp (format: YYYYMMDDHHMMSS)
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
    console.log('Timestamp:', timestamp)
    
    // Generate password
    const passwordStr = shortcode + passkey + timestamp
    const password = Buffer.from(passwordStr).toString('base64')
    console.log('Password generated successfully')
    
    // Prepare STK Push request body
    const amountToCharge = Math.round(amount)
    const stkPushBody = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: amountToCharge,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl || 'https://mydomain.com/path',
      AccountReference: accountReference || `COURSE-${courseId.slice(-8)}`,
      TransactionDesc: `Payment for ${course.title.substring(0, 36)}`
    }
    
    console.log('STK Push Request:', {
      BusinessShortCode: stkPushBody.BusinessShortCode,
      Amount: stkPushBody.Amount,
      PartyA: stkPushBody.PartyA,
      PhoneNumber: stkPushBody.PhoneNumber,
      CallBackURL: stkPushBody.CallBackURL,
      AccountReference: stkPushBody.AccountReference
    })
    
    // Send STK Push request
    console.log('Sending STK Push request to M-Pesa...')
    const stkRes = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stkPushBody)
      }
    )
    
    const stkData = await stkRes.json()
    console.log('M-Pesa STK Push Response:', JSON.stringify(stkData, null, 2))
    
    // Check response
    if (stkData.ResponseCode === '0') {
      console.log('✅ STK Push initiated successfully!')
      console.log('CheckoutRequestID:', stkData.CheckoutRequestID)
      console.log('MerchantRequestID:', stkData.MerchantRequestID)
      
      // Create payment record WITHOUT metadata
      await prisma.payment.create({
        data: {
          studentId: user.id,
          courseId,
          amount: amountToCharge,
          paidAmount: 0,
          method: 'MPESA',
          status: 'PENDING',
          transactionId: stkData.CheckoutRequestID,
        }
      })
      console.log('✅ Payment record created')
      
      return NextResponse.json(stkData)
    } else {
      console.log('❌ STK Push failed:')
      console.log('ResponseCode:', stkData.ResponseCode)
      console.log('ResponseDescription:', stkData.ResponseDescription)
      console.log('Full error:', stkData)
      
      // Provide user-friendly error message
      let errorMessage = 'M-Pesa payment failed. '
      switch (stkData.ResponseCode) {
        case '1037':
          errorMessage += 'Invalid phone number format. Please use 254XXXXXXXXX format.'
          break
        case '1032':
          errorMessage += 'Insufficient funds or service unavailable.'
          break
        case '1001':
          errorMessage += 'Unable to process payment. Please try again.'
          break
        default:
          errorMessage += stkData.ResponseDescription || 'Please try again.'
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: stkData
      }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ M-Pesa payment error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate M-Pesa payment: ' + (error as Error).message },
      { status: 500 }
    )
  }
}