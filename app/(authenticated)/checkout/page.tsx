// app\(authenticated)\checkout\page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { 
  CreditCard, 
  Smartphone, 
  Wallet,
  Shield,
  Lock,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Course {
  id: string
  title: string
  price: number
  currency: string
  description: string
  shortName: string
}

interface Application {
  id: string
  status: string
  totalPaid: number
}

// Helper function to format phone number to international format
const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1)
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1)
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned
  }
  
  return cleaned
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const courseId = searchParams.get('course')
  
  const [course, setCourse] = useState<Course | null>(null)
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [email, setEmail] = useState('')
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false) // Renamed from paymentStatus to avoid confusion

  const [cashReference, setCashReference] = useState('')
  const [cashError, setCashError] = useState('')

  useEffect(() => {
    if (courseId) {
      fetchCourseAndApplication()
    } else {
      router.push('/courses/public')
    }
  }, [courseId])

  const validatePhoneNumber = (phone: string): boolean => {
    const formatted = formatPhoneNumber(phone)
    const isValid = /^254[17]\d{8}$/.test(formatted)
    if (!isValid) {
      setPhoneError('Please enter a valid Kenyan phone number (e.g., 0722123456 or 254722123456)')
    } else {
      setPhoneError('')
    }
    return isValid
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhoneNumber(value)
    if (value) {
      validatePhoneNumber(value)
    } else {
      setPhoneError('')
    }
  }

  const fetchCourseAndApplication = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    
    try {
      const courseRes = await fetch(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!courseRes.ok) {
        throw new Error('Failed to fetch course')
      }
      
      const courseData = await courseRes.json()
      
      if (!courseData.course) {
        throw new Error('Course not found')
      }
      
      setCourse(courseData.course)
      setPaymentAmount(courseData.course.price)

      const appRes = await fetch(`/api/applications/check?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (appRes.ok) {
        const appData = await appRes.json()
        if (appData.application) {
          setApplication(appData.application)
          if (appData.application.totalPaid > 0) {
            setPaymentAmount(courseData.course.price - appData.application.totalPaid)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load checkout information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMpesaPayment = async () => {
    if (!courseId) {
      setError('Course not found')
      return
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    setProcessing(true)
    setError(null)
    const token = localStorage.getItem('token')
    
    try {
      const stkResponse = await fetch('https://e-biz-stk-prompt-page.vercel.app/api/stk_api/till_stk_api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedPhone,
          amount: paymentAmount,
          accountnumber: `COURSE-${courseId.slice(-8)}`,
        })
      })
      
      const stkData = await stkResponse.json()
      
      if (stkData.ResponseCode === '0') {
        toast.success('STK Push sent! Please check your phone.')
        
        // Poll for payment status
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch(`https://e-biz-stk-prompt-page.vercel.app/api/stk_api/check_payment_status?checkout_id=${stkData.CheckoutRequestID}`)
          const statusData = await statusRes.json()
          
          if (statusData.status === 'Success') {
            clearInterval(pollInterval)
            
            // Record payment in our database
            await fetch('/api/payments/mpesa/record', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                courseId,
                amount: paymentAmount,
                transactionId: stkData.CheckoutRequestID,
                receiptNumber: statusData.receiptNumber
              })
            })
            
            toast.success('Payment successful!')
            setPaymentSuccess(true)
            setSuccess(true)
            setTimeout(() => {
              router.push('/courses')
            }, 3000)
          } else if (statusData.status === 'Failed') {
            clearInterval(pollInterval)
            setError('Payment failed. Please try again.')
            setProcessing(false)
          }
        }, 3000)
        
        // Timeout after 90 seconds
        setTimeout(() => {
          clearInterval(pollInterval)
          if (!paymentSuccess) {
            setError('Payment timeout. Please try again.')
            setProcessing(false)
          }
        }, 90000)
        
      } else {
        setError(stkData.ResponseDescription || 'M-Pesa payment failed. Please try again.')
        setProcessing(false)
      }
    } catch (error) {
      console.error('M-Pesa error:', error)
      setError('Failed to initiate M-Pesa payment. Please try again.')
      setProcessing(false)
    }
  }

  const handleStripePayment = async () => {
    setProcessing(true)
    setError(null)
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId,
          amount: paymentAmount,
          paymentType
        })
      })
      
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Failed to create Stripe session')
        setProcessing(false)
      }
    } catch (error) {
      console.error('Stripe error:', error)
      setError('Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  const handlePayPalPayment = async () => {
    setProcessing(true)
    setError(null)
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch('/api/payments/paypal/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId,
          amount: paymentAmount,
          paymentType,
          email
        })
      })
      
      const data = await response.json()
      if (data.id) {
        const approvalUrl = data.links?.find((l: any) => l.rel === 'approve')?.href
        if (approvalUrl) {
          window.location.href = approvalUrl
        } else {
          setError('Failed to create PayPal order')
          setProcessing(false)
        }
      }
    } catch (error) {
      console.error('PayPal error:', error)
      setError('Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method')
      return
    }

    if (selectedMethod === 'MPESA') {
      if (!phoneNumber) {
        setError('Please enter your M-Pesa phone number')
        return
      }
      if (!validatePhoneNumber(phoneNumber)) {
        setError('Please enter a valid phone number')
        return
      }
      await handleMpesaPayment()

    } else if (selectedMethod === 'STRIPE') {
      if (!email) {
        setError('Please enter your email address')
        return
      }
      await handleStripePayment()

    } else if (selectedMethod === 'PAYPAL') {
      if (!email) {
        setError('Please enter your email address')
        return
      }
      await handlePayPalPayment()

    } else if (selectedMethod === 'CASH') {
      if (!cashReference.trim()) {
        setCashError('Receipt/reference number is required')
        return
      }

      await handleCashPayment()
    }
  }

  const handleCashPayment = async () => {
    setProcessing(true)
    setError(null)

    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/payments/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId,
          amount: paymentAmount,
          paymentType,
          reference: cashReference
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment')
      }

      toast.success('Payment recorded. Awaiting verification.')

      setSuccess(true)

      setTimeout(() => {
        router.push('/courses')
      }, 3000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
        <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have access.</p>
        <button
          onClick={() => router.push('/courses/public')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Browse Courses
        </button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Initiated!</h2>
        <p className="text-gray-600 mb-4">
          {selectedMethod === 'MPESA' 
            ? 'Please check your phone and enter your M-Pesa PIN to complete the payment.'
            : 'Your payment is being processed.'}
        </p>
        <p className="text-sm text-gray-500">You will be redirected shortly...</p>
      </div>
    )
  }
  
  const remainingAmount = course.price - (application?.totalPaid || 0)
  const minPartialAmount = Math.min(1000, remainingAmount)

  return (
    <div className="max-w-6xl mx-auto">
      <Toaster position="top-right" />
      
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Courses
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">{course.title}</p>
                <p className="text-sm text-gray-500">Course Enrollment</p>
              </div>
              <p className="font-bold text-gray-900">
                {course.currency} {course.price.toLocaleString()}
              </p>
            </div>
            
            {application?.totalPaid ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Already Paid</span>
                <span className="text-green-600">- {course.currency} {application.totalPaid.toLocaleString()}</span>
              </div>
            ) : null}
            
            <div className="flex justify-between pt-2">
              <p className="font-semibold text-gray-900">Amount Due</p>
              <p className="font-bold text-2xl text-blue-600">
                {course.currency} {remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment Type Selection */}
          {remainingAmount > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentType"
                    value="full"
                    checked={paymentType === 'full'}
                    onChange={() => {
                      setPaymentType('full')
                      setPaymentAmount(remainingAmount)
                    }}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Pay Full Amount</p>
                    <p className="text-sm text-gray-500">{course.currency} {remainingAmount.toLocaleString()}</p>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentType"
                    value="partial"
                    checked={paymentType === 'partial'}
                    onChange={() => {
                      setPaymentType('partial')
                      setPaymentAmount(minPartialAmount)
                    }}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Partial Payment</p>
                    <p className="text-sm text-gray-500">Minimum {course.currency} 1,000</p>
                  </div>
                </label>
              </div>
              
              {paymentType === 'partial' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Amount ({course.currency})
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Math.min(parseFloat(e.target.value), remainingAmount))}
                    min={minPartialAmount}
                    max={remainingAmount}
                    step={100}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: {course.currency} {minPartialAmount.toLocaleString()} | Maximum: {course.currency} {remainingAmount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Payment Method</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          
          <div className="space-y-3 mb-6">
            {/* Credit/Debit Card */}
            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="STRIPE"
                checked={selectedMethod === 'STRIPE'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mr-4"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                  💳
                </div>
                <div>
                  <p className="font-medium text-gray-900">Credit / Debit Card</p>
                  <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                </div>
              </div>
            </label>
            
            {/* PayPal */}
            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="PAYPAL"
                checked={selectedMethod === 'PAYPAL'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mr-4"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                  💰
                </div>
                <div>
                  <p className="font-medium text-gray-900">PayPal</p>
                  <p className="text-sm text-gray-500">Pay with your PayPal account</p>
                </div>
              </div>
            </label>
            
            {/* M-Pesa */}
            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="MPESA"
                checked={selectedMethod === 'MPESA'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mr-4"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-8 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                  📱
                </div>
                <div>
                  <p className="font-medium text-gray-900">M-Pesa</p>
                  <p className="text-sm text-gray-500">Pay using M-Pesa on your phone</p>
                </div>
              </div>
            </label>

            {/* Cash / Bank Payment */}
            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="CASH"
                checked={selectedMethod === 'CASH'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mr-4"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-8 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">
                  🧾
                </div>
                <div>
                  <p className="font-medium text-gray-900">Cash / Bank Transfer</p>
                  <p className="text-sm text-gray-500">
                    Pay via cash, bank deposit, or direct transfer
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* M-Pesa Phone Number Field */}
          {selectedMethod === 'MPESA' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="0722123456 or 254722123456"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  phoneError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1">{phoneError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter your M-Pesa registered phone number
              </p>
            </div>
          )}

          {/* Email Field (for Stripe/PayPal) */}
          {(selectedMethod === 'STRIPE' || selectedMethod === 'PAYPAL') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Receipt will be sent to this email</p>
            </div>
          )}

          {/* Cash Reference Input */}
          {selectedMethod === 'CASH' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt / Reference Number *
              </label>
              <input
                type="text"
                value={cashReference}
                onChange={(e) => {
                  setCashReference(e.target.value)
                  if (e.target.value.trim()) setCashError('')
                }}
                placeholder="Enter receipt or bank reference number"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  cashError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {cashError && (
                <p className="text-xs text-red-500 mt-1">{cashError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                This will be verified during application approval
              </p>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={processing || paymentAmount <= 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock size={18} />
                Pay {course.currency} {paymentAmount.toLocaleString()}
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
            <Shield size={14} />
            Secure payment processing
          </div>
        </div>
      </div>
    </div>
  )
}