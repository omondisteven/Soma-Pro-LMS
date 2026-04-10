// src\components\QuizComponent.tsx
'use client'

import { useState } from 'react'
import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface Question {
  id: string
  text: string
  type: string
  points: number
  options: string[]
  correctAnswer: string
  explanation: string
}

interface Quiz {
  id: string
  title: string
  description: string
  timeLimit: number
  passingScore: number
  attemptsAllowed: number
  questions: Question[]
}

interface QuizComponentProps {
  quiz: Quiz
  onComplete: () => void
}

export default function QuizComponent({ quiz, onComplete }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [passed, setPassed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(quiz.timeLimit ? quiz.timeLimit * 60 : null)
  const [loading, setLoading] = useState(false)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))
  }

  const nextQuestion = () => {
    if (isLastQuestion) {
      submitQuiz()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const previousQuestion = () => {
    setCurrentQuestionIndex(prev => prev - 1)
  }

  const submitQuiz = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quizId: quiz.id,
          answers
        })
      })
      
      const data = await res.json()
      setScore(data.score)
      setPassed(data.passed)
      setSubmitted(true)
      
      if (data.passed) {
        onComplete()
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <label key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="question"
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={() => handleAnswer(option)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )
      
      case 'TRUE_FALSE':
        return (
          <div className="flex gap-4">
            {['True', 'False'].map(option => (
              <label key={option} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex-1">
                <input
                  type="radio"
                  name="question"
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={() => handleAnswer(option)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )
      
      case 'SHORT_ANSWER':
        return (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      
      default:
        return null
    }
  }

  if (submitted) {
    const percentage = score ? (score / quiz.questions.reduce((sum, q) => sum + q.points, 0)) * 100 : 0
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          {passed ? (
            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          ) : (
            <XCircle size={64} className="mx-auto text-red-500 mb-4" />
          )}
          <h3 className="text-xl font-bold mb-2">
            {passed ? 'Congratulations!' : 'Not this time'}
          </h3>
          <p className="text-gray-600 mb-4">
            You scored {score} out of {quiz.questions.reduce((sum, q) => sum + q.points, 0)} points ({Math.round(percentage)}%)
          </p>
          <p className="text-sm text-gray-500">
            Passing score: {quiz.passingScore}%
          </p>
          {!passed && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Quiz Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-gray-600 mt-1">{quiz.description}</p>
            )}
          </div>
          {quiz.timeLimit && (
            <div className="flex items-center gap-2 text-orange-600">
              <Clock size={18} />
              <span>{Math.floor(timeRemaining! / 60)}:{(timeRemaining! % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <span className="text-sm text-gray-500">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {currentQuestion.text}
          </h3>
          {renderQuestion()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={nextQuestion}
            disabled={!answers[currentQuestion.id]}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLastQuestion ? (loading ? 'Submitting...' : 'Submit Quiz') : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}