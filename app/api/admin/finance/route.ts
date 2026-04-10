import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  // Only allow teachers and admins to access finance data
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const totalRevenue = await prisma.payment.aggregate({
      _sum: { paidAmount: true },
      where: { status: 'COMPLETED' }
    })

    const payments = await prisma.payment.findMany({
      include: { 
        student: { 
          select: { 
            id: true, 
            name: true, 
            email: true 
          } 
        }, 
        course: { 
          select: { 
            id: true, 
            title: true 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate monthly revenue
    const monthlyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        SUM(paidAmount) as amount
      FROM Payment
      WHERE status = 'COMPLETED'
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.paidAmount || 0,
      payments: payments || [],
      monthlyRevenue: monthlyRevenue || []
    })
  } catch (error) {
    console.error('Error fetching finance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    )
  }
}