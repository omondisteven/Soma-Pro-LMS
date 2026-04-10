'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
          <BookOpen className="text-white" size={40} />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">E-Shule</h1>
        <p className="text-xl text-gray-600 mb-8">Modern Learning Management System</p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/login" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Register
          </Link>
          <Link 
            href="/test" 
            className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Test Page
          </Link>
        </div>
      </div>
    </div>
  )
}