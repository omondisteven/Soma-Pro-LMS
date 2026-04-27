export interface Payment {
  id: string
  amount: number
  paidAmount: number
  method: string
  status: string
  transactionId?: string | null
}

export interface Application {
  id: string
  appliedAt: string
  status: string
  totalPaid: number

  student: {
    id: string
    name: string
    email: string
    highSchoolCompleted: boolean
    qualification: string | null
    qualificationDiscipline: string | null
  }

  course: {
    id: string
    title: string
    shortName: string
    price: number
    currency: string
  }

  payments: Payment[]
}