'use client'

import { useEffect, useState } from 'react'
import { Download, Filter, BarChart3, PieChart, TrendingUp, Loader2 } from 'lucide-react'

interface GradeDistribution {
  courseId: string
  courseTitle: string
  gradeRanges: {
    range: string
    count: number
    percentage: number
  }[]
  averageGrade: number
  medianGrade: number
  standardDeviation: number
  totalStudents: number
}

export default function GradeDistributionPage() {
  const [distributions, setDistributions] = useState<GradeDistribution[]>([])
  const [selectedDistribution, setSelectedDistribution] = useState<GradeDistribution | null>(null)
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState<'bar' | 'pie'>('bar')

  useEffect(() => {
    fetchGradeDistribution()
  }, [selectedCourse])

  const fetchGradeDistribution = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/reports/grade-distribution?course=${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setDistributions(data.distributions || [])
      setCourses(data.courses || [])
      if (data.distributions && data.distributions.length > 0) {
        setSelectedDistribution(data.distributions[0])
      }
    } catch (error) {
      console.error('Error fetching grade distribution:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!selectedDistribution) return
    
    const headers = ['Grade Range', 'Number of Students', 'Percentage']
    const rows = selectedDistribution.gradeRanges.map(range => [
      range.range,
      range.count,
      `${range.percentage}%`
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grade_distribution_${selectedDistribution.courseTitle}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getGradeColor = (range: string) => {
    if (range.includes('90')) return 'bg-green-500'
    if (range.includes('80')) return 'bg-blue-500'
    if (range.includes('70')) return 'bg-yellow-500'
    if (range.includes('60')) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grade Distribution</h1>
          <p className="text-gray-600 mt-1">Analyze grade patterns across your courses</p>
        </div>
        {selectedDistribution && (
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            Download Report
          </button>
        )}
      </div>

      {/* Course Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Select Course:</span>
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setViewType('bar')}
              className={`p-2 rounded-lg transition-colors ${viewType === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <BarChart3 size={20} />
            </button>
            <button
              onClick={() => setViewType('pie')}
              className={`p-2 rounded-lg transition-colors ${viewType === 'pie' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <PieChart size={20} />
            </button>
          </div>
        </div>
      </div>

      {selectedDistribution ? (
        <>
          {/* Course Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <p className="text-blue-100 text-sm">Average Grade</p>
              <p className="text-3xl font-bold mt-1">{selectedDistribution.averageGrade}%</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <p className="text-green-100 text-sm">Median Grade</p>
              <p className="text-3xl font-bold mt-1">{selectedDistribution.medianGrade}%</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <p className="text-purple-100 text-sm">Standard Deviation</p>
              <p className="text-3xl font-bold mt-1">{selectedDistribution.standardDeviation.toFixed(1)}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <p className="text-orange-100 text-sm">Total Students</p>
              <p className="text-3xl font-bold mt-1">{selectedDistribution.totalStudents}</p>
            </div>
          </div>

          {/* Grade Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution for {selectedDistribution.courseTitle}</h3>
            
            {viewType === 'bar' ? (
              <div className="space-y-4">
                {selectedDistribution.gradeRanges.map((range) => (
                  <div key={range.range}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{range.range}</span>
                      <span className="text-gray-500">{range.count} students ({range.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div
                        className={`${getGradeColor(range.range)} rounded-full h-8 flex items-center justify-end pr-3 text-white text-sm font-medium transition-all`}
                        style={{ width: `${range.percentage}%` }}
                      >
                        {range.percentage > 15 && `${range.percentage}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <div className="relative w-64 h-64">
                  {/* Simple pie chart visualization */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {(() => {
                      let startAngle = 0
                      return selectedDistribution.gradeRanges.map((range, idx) => {
                        const percentage = range.percentage
                        const angle = (percentage / 100) * 360
                        const endAngle = startAngle + angle
                        const startRad = (startAngle - 90) * Math.PI / 180
                        const endRad = (endAngle - 90) * Math.PI / 180
                        const x1 = 50 + 40 * Math.cos(startRad)
                        const y1 = 50 + 40 * Math.sin(startRad)
                        const x2 = 50 + 40 * Math.cos(endRad)
                        const y2 = 50 + 40 * Math.sin(endRad)
                        const largeArc = angle > 180 ? 1 : 0
                        
                        const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`
                        
                        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
                        const result = (
                          <path
                            key={idx}
                            d={pathData}
                            fill={colors[idx % colors.length]}
                            stroke="white"
                            strokeWidth="2"
                          />
                        )
                        startAngle = endAngle
                        return result
                      })
                    })()}
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Grade Distribution Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Grade Range</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Number of Students</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Percentage</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDistribution.gradeRanges.map((range) => (
                    <tr key={range.range} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-6 font-medium text-gray-900">{range.range}</td>
                      <td className="py-3 px-6 text-gray-600">{range.count}</td>
                      <td className="py-3 px-6 text-gray-600">{range.percentage}%</td>
                      <td className="py-3 px-6">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`${getGradeColor(range.range)} rounded-full h-2`}
                            style={{ width: `${range.percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="py-3 px-6 font-semibold text-gray-900">Total</td>
                    <td className="py-3 px-6 font-semibold text-gray-900">{selectedDistribution.totalStudents}</td>
                    <td className="py-3 px-6 font-semibold text-gray-900">100%</td>
                    <td className="py-3 px-6"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600">Select a course to view grade distribution</p>
        </div>
      )}
    </div>
  )
}