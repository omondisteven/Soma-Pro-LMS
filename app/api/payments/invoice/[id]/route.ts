// app/api/payments/invoice/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id } = await params
    
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        course: true,
        student: true
      }
    })
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    
    // Verify user has access to this payment
    if (payment.studentId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 })
    
    // Set response headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename=invoice_${payment.id}.pdf`)
    
    // Create a readable stream from the PDF
    const stream = new ReadableStream({
      start(controller) {
        doc.on('data', (chunk) => controller.enqueue(chunk))
        doc.on('end', () => controller.close())
        
        // Generate PDF content
        generateInvoicePDF(doc, payment)
        doc.end()
      }
    })
    
    return new Response(stream, { headers })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

function generateInvoicePDF(doc: PDFKit.PDFDocument, payment: any) {
  const currency = payment.currency || 'USD'
  const date = new Date(payment.paidAt || payment.createdAt)
  
  // Header
  doc.fontSize(20)
    .font('Helvetica-Bold')
    .text('INVOICE', { align: 'center' })
    .moveDown()
  
  // Company Info
  doc.fontSize(10)
    .font('Helvetica')
    .text('Cps-LMS Learning Platform', { align: 'center' })
    .text('contact@Cps-LMS.com', { align: 'center' })
    .text('+254 700 000 000', { align: 'center' })
    .moveDown()
  
  // Invoice Details
  doc.fontSize(10)
    .text(`Invoice Number: INV-${payment.id.slice(0, 8).toUpperCase()}`, { continued: true })
    .text(`Date: ${date.toLocaleDateString()}`, { align: 'right' })
    .moveDown()
  
  // Bill To
  doc.fontSize(12)
    .font('Helvetica-Bold')
    .text('Bill To:')
    .font('Helvetica')
    .fontSize(10)
    .text(payment.student.name)
    .text(payment.student.email)
    .moveDown()
  
  // Table Header
  const startX = 50
  let currentY = doc.y
  
  doc.font('Helvetica-Bold')
    .text('Description', startX, currentY, { width: 300 })
    .text('Amount', startX + 350, currentY, { width: 100, align: 'right' })
    .moveDown()
  
  // Draw line
  doc.moveTo(startX, doc.y).lineTo(startX + 500, doc.y).stroke()
  doc.moveDown(0.5)
  
  // Course Details
  doc.font('Helvetica')
    .text(`Course Enrollment: ${payment.course.title}`, startX, doc.y, { width: 300 })
    .text(`${currency} ${payment.amount.toFixed(2)}`, startX + 350, doc.y, { width: 100, align: 'right' })
    .moveDown()
  
  // Draw line
  doc.moveTo(startX, doc.y).lineTo(startX + 500, doc.y).stroke()
  doc.moveDown(0.5)
  
  // Total
  const totalY = doc.y
  doc.font('Helvetica-Bold')
    .text('Total', startX + 350, totalY, { width: 100, align: 'right' })
    .text(`${currency} ${payment.amount.toFixed(2)}`, startX + 350, totalY + 20, { width: 100, align: 'right' })
  
  // Payment Details
  doc.moveDown(3)
  doc.font('Helvetica')
    .fontSize(10)
    .text('Payment Details:', { underline: true })
    .text(`Transaction ID: ${payment.transactionId || 'N/A'}`)
    .text(`Payment Method: ${payment.method}`)
    .text(`Payment Status: ${payment.status}`)
    .text(`Paid On: ${date.toLocaleString()}`)
    .moveDown()
  
  // Footer
  doc.fontSize(8)
    .text('Thank you for your payment!', { align: 'center' })
    .text('This is a computer-generated invoice. No signature required.', { align: 'center' })
}