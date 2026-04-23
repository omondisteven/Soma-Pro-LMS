'use client'

import MainLayout from '@/components/MainLayout'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { useSidebar } from '@/context/SidebarContext'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { isMobile, closeSidebar } = useSidebar()
  
  return <MainLayout>{children}</MainLayout>
}