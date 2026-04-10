// app/api/admin/finance/route.ts
export async function GET() {
  const totalRevenue = await prisma.payment.aggregate({
    _sum: { paidAmount: true },
    where: { status: 'COMPLETED' }
  })

  const payments = await prisma.payment.findMany({
    include: { student: true, course: true },
    orderBy: { createdAt: 'desc' }
  })

  return Response.json({
    totalRevenue: totalRevenue._sum.paidAmount || 0,
    payments
  })
}