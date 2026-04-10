import { prisma } from './prisma'

interface CreateNotificationParams {
  userId: string
  type: string
  title: string
  message: string
  link?: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  metadata?: any
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    // Check if user has this notification type enabled
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: params.userId }
    })
    
    if (preferences) {
      const typeSettings = preferences.typeSettings as any || {}
      if (typeSettings[params.type] === false) {
        return null // User disabled this notification type
      }
    }
    
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        priority: params.priority || 'NORMAL',
        metadata: params.metadata
      }
    })
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

// Student Notifications
export async function notifyAssignmentGraded(studentId: string, assignmentTitle: string, grade: number, maxScore: number, courseId: string, courseTitle: string) {
  return createNotification({
    userId: studentId,
    type: 'ASSIGNMENT_GRADED',
    title: 'Assignment Graded',
    message: `Your assignment "${assignmentTitle}" in "${courseTitle}" has been graded. Score: ${grade}/${maxScore}`,
    link: `/courses/${courseId}`,
    priority: 'HIGH'
  })
}

export async function notifyNewAssignment(studentId: string, assignmentTitle: string, dueDate: Date, courseId: string, courseTitle: string) {
  return createNotification({
    userId: studentId,
    type: 'ASSIGNMENT_NEW',
    title: 'New Assignment',
    message: `New assignment "${assignmentTitle}" available in "${courseTitle}". Due: ${dueDate.toLocaleDateString()}`,
    link: `/courses/${courseId}`,
    priority: 'NORMAL'
  })
}

export async function notifyApplicationApproved(studentId: string, courseTitle: string, courseId: string) {
  return createNotification({
    userId: studentId,
    type: 'APPLICATION_APPROVED',
    title: 'Application Approved!',
    message: `Your application for "${courseTitle}" has been approved! You can now access the course.`,
    link: `/courses/${courseId}`,
    priority: 'HIGH'
  })
}

export async function notifyApplicationDeclined(studentId: string, courseTitle: string, reason: string) {
  return createNotification({
    userId: studentId,
    type: 'APPLICATION_DECLINED',
    title: 'Application Update',
    message: `Your application for "${courseTitle}" was declined. Reason: ${reason}`,
    priority: 'NORMAL'
  })
}

export async function notifyCertificateAvailable(studentId: string, courseTitle: string, certificateUrl: string) {
  return createNotification({
    userId: studentId,
    type: 'CERTIFICATE_READY',
    title: 'Certificate Available!',
    message: `Congratulations! Your certificate for "${courseTitle}" is now available to download.`,
    link: certificateUrl,
    priority: 'HIGH'
  })
}

// Teacher Notifications
export async function notifyNewApplication(teacherId: string, studentName: string, courseTitle: string, applicationId: string) {
  return createNotification({
    userId: teacherId,
    type: 'APPLICATION_NEW',
    title: 'New Course Application',
    message: `${studentName} applied for "${courseTitle}". Review the application.`,
    link: `/enroll-students`,
    priority: 'HIGH'
  })
}

export async function notifyAssignmentSubmitted(teacherId: string, studentName: string, assignmentTitle: string, courseId: string, courseTitle: string, submissionId: string) {
  return createNotification({
    userId: teacherId,
    type: 'ASSIGNMENT_SUBMITTED',
    title: 'Assignment Submitted',
    message: `${studentName} submitted "${assignmentTitle}" for "${courseTitle}". Ready for grading.`,
    link: `/teacher/grading`,
    priority: 'NORMAL'
  })
}

// Bulk notification for multiple students
export async function notifyMultipleStudents(studentIds: string[], type: string, title: string, message: string, link?: string) {
  const notifications = []
  for (const studentId of studentIds) {
    notifications.push(
      createNotification({
        userId: studentId,
        type,
        title,
        message,
        link,
        priority: 'NORMAL'
      })
    )
  }
  return Promise.all(notifications)
}