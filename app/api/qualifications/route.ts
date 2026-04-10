import { NextResponse } from 'next/server'

// Qualification data structure
const qualificationsData = {
  DIPLOMA: {
    label: 'Diploma',
    disciplines: [
      'Information Technology',
      'Business Management',
      'Commerce',
      'Engineering',
      'Hospitality',
      'Education',
      'Health Sciences',
      'Agriculture',
      'Media Studies',
      'Other'
    ]
  },
  BACHELORS: {
    label: "Bachelor's Degree",
    disciplines: [
      'Information Technology',
      'Computer Science',
      'Business Administration',
      'Commerce',
      'Engineering',
      'Medicine',
      'Law',
      'Education',
      'Economics',
      'Psychology',
      'Other'
    ]
  },
  MASTERS: {
    label: "Master's Degree",
    disciplines: [
      'Information Technology',
      'Business Administration (MBA)',
      'Engineering',
      'Education',
      'Public Health',
      'Data Science',
      'Artificial Intelligence',
      'Finance',
      'Other'
    ]
  },
  DOCTORATE: {
    label: 'Doctorate (PhD)',
    disciplines: [
      'Computer Science',
      'Engineering',
      'Business',
      'Education',
      'Medicine',
      'Law',
      'Other'
    ]
  },
  CERTIFICATE: {
    label: 'Professional Certificate',
    disciplines: [
      'Project Management',
      'Digital Marketing',
      'Data Analysis',
      'Cloud Computing',
      'Cybersecurity',
      'Other'
    ]
  },
  OTHER: {
    label: 'Other Qualification',
    disciplines: ['Other']
  }
}

export async function GET() {
  return NextResponse.json(qualificationsData)
}