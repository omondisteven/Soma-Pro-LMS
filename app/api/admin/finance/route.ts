// app/api/admin/finance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const user = await getUserFromToken(token)
  
  // Only allow admins to access finance data
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Calculate total revenue from applications (same as dashboard)
    const paidApplications = await prisma.application.findMany({
      where: {
        status: {
          in: ['PAID', 'APPROVED']
        }
      },
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
      orderBy: { appliedAt: 'desc' }  // Changed from createdAt to appliedAt
    })

    const totalRevenue = paidApplications.reduce(
      (sum, app) => sum + (app.totalPaid || 0),
      0
    )

    // Calculate monthly revenue
    const monthlyRevenueMap = new Map<string, number>()
    
    paidApplications.forEach(app => {
      const month = app.appliedAt.toISOString().slice(0, 7) // YYYY-MM (changed from createdAt to appliedAt)
      const amount = app.totalPaid || 0
      monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) || 0) + amount)
    })

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6)

    // Format payments for display
    const payments = paidApplications.map(app => ({
      id: app.id,
      student: app.student,
      course: app.course,
      paidAmount: app.totalPaid,
      appliedAt: app.appliedAt,  // Changed from createdAt to appliedAt
      status: 'COMPLETED'
    }))

    return NextResponse.json({
      totalRevenue: totalRevenue,
      payments: payments,
      monthlyRevenue: monthlyRevenue
    })
  } catch (error) {
    console.error('Error fetching finance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    )
  }
}