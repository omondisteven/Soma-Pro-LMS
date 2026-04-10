'use client'

import { useEffect, useState } from 'react'
import { 
  Bell, 
  Mail, 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  User, 
  Save,
  Loader2,
  CheckCircle,
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  Volume2,
  VolumeX
} from 'lucide-react'

interface NotificationPreferences {
  emailEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  typeSettings: {
    ASSIGNMENT_GRADED: boolean
    ASSIGNMENT_NEW: boolean
    ASSIGNMENT_SUBMITTED: boolean
    APPLICATION_APPROVED: boolean
    APPLICATION_DECLINED: boolean
    APPLICATION_NEW: boolean
    CERTIFICATE_READY: boolean
    ANNOUNCEMENT: boolean
    QUIZ_RESULT: boolean
  }
}

interface UserProfile {
  name: string
  email: string
  role: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance' | 'security'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({ name: '', email: '', role: '' })
  
  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    typeSettings: {
      ASSIGNMENT_GRADED: true,
      ASSIGNMENT_NEW: true,
      ASSIGNMENT_SUBMITTED: true,
      APPLICATION_APPROVED: true,
      APPLICATION_DECLINED: true,
      APPLICATION_NEW: true,
      CERTIFICATE_READY: true,
      ANNOUNCEMENT: true,
      QUIZ_RESULT: true
    }
  })
  
  // Appearance state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchNotificationPreferences()
    loadThemePreference()
  }, [])

  const fetchUserData = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setProfile(data.user)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchNotificationPreferences = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/user/notification-preferences', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.preferences) {
        setNotifPrefs(data.preferences)
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadThemePreference = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'light'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }

  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    let resolvedTheme = selectedTheme
    if (selectedTheme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const saveNotificationPreferences = async () => {
    setSaving(true)
    setMessage(null)
    const token = localStorage.getItem('token')
    
    try {
      const res = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(notifPrefs)
      })
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences' })
    } finally {
      setSaving(false)
    }
  }

  const saveThemePreference = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
    setMessage({ type: 'success', text: 'Theme updated!' })
    setTimeout(() => setMessage(null), 2000)
  }

  const updateTypeSetting = (key: keyof typeof notifPrefs.typeSettings, value: boolean) => {
    setNotifPrefs(prev => ({
      ...prev,
      typeSettings: { ...prev.typeSettings, [key]: value }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const isStudent = profile.role === 'STUDENT'
  const isTeacher = profile.role === 'TEACHER'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences</p>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <User size={18} />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Bell size={18} />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'appearance'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Moon size={18} />
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'security'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Shield size={18} />
            Security
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <p className="text-gray-900 dark:text-white">{profile.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <p className="text-gray-900 dark:text-white">{profile.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <p className="text-gray-900 dark:text-white capitalize">{profile.role}</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  To change your name or email, please contact support.
                </p>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
                <button
                  onClick={saveNotificationPreferences}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>

              {/* Delivery Methods */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Delivery Methods</h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Bell size={18} className="text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">In-App Notifications</span>
                    </div>
                    <button
                      onClick={() => setNotifPrefs(prev => ({ ...prev, inAppEnabled: !prev.inAppEnabled }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        notifPrefs.inAppEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifPrefs.inAppEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Mail size={18} className="text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
                    </div>
                    <button
                      onClick={() => setNotifPrefs(prev => ({ ...prev, emailEnabled: !prev.emailEnabled }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        notifPrefs.emailEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifPrefs.emailEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </label>
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Notification Types</h3>
                
                {isStudent && (
                  <>
                    <NotificationToggle
                      label="Assignment Graded"
                      description="When your assignment has been graded"
                      enabled={notifPrefs.typeSettings.ASSIGNMENT_GRADED}
                      onToggle={(val) => updateTypeSetting('ASSIGNMENT_GRADED', val)}
                    />
                    <NotificationToggle
                      label="New Assignment"
                      description="When a new assignment is posted"
                      enabled={notifPrefs.typeSettings.ASSIGNMENT_NEW}
                      onToggle={(val) => updateTypeSetting('ASSIGNMENT_NEW', val)}
                    />
                    <NotificationToggle
                      label="Application Status"
                      description="When your course application is approved or declined"
                      enabled={notifPrefs.typeSettings.APPLICATION_APPROVED}
                      onToggle={(val) => updateTypeSetting('APPLICATION_APPROVED', val)}
                    />
                    <NotificationToggle
                      label="Certificate Available"
                      description="When you earn a new certificate"
                      enabled={notifPrefs.typeSettings.CERTIFICATE_READY}
                      onToggle={(val) => updateTypeSetting('CERTIFICATE_READY', val)}
                    />
                    <NotificationToggle
                      label="Quiz Results"
                      description="When you complete a quiz"
                      enabled={notifPrefs.typeSettings.QUIZ_RESULT}
                      onToggle={(val) => updateTypeSetting('QUIZ_RESULT', val)}
                    />
                  </>
                )}

                {isTeacher && (
                  <>
                    <NotificationToggle
                      label="New Applications"
                      description="When a student applies for your course"
                      enabled={notifPrefs.typeSettings.APPLICATION_NEW}
                      onToggle={(val) => updateTypeSetting('APPLICATION_NEW', val)}
                    />
                    <NotificationToggle
                      label="Assignment Submissions"
                      description="When a student submits an assignment"
                      enabled={notifPrefs.typeSettings.ASSIGNMENT_SUBMITTED}
                      onToggle={(val) => updateTypeSetting('ASSIGNMENT_SUBMITTED', val)}
                    />
                  </>
                )}

                <NotificationToggle
                  label="Announcements"
                  description="Course announcements and updates"
                  enabled={notifPrefs.typeSettings.ANNOUNCEMENT}
                  onToggle={(val) => updateTypeSetting('ANNOUNCEMENT', val)}
                />
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => saveThemePreference('light')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Sun size={24} className="mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">Light</p>
                  </button>
                  <button
                    onClick={() => saveThemePreference('dark')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Moon size={24} className="mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">Dark</p>
                  </button>
                  <button
                    onClick={() => saveThemePreference('system')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'system'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Monitor size={24} className="mx-auto mb-2 text-gray-500" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">System</p>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 dark:text-gray-300">Reduced Motion</span>
                    <p className="text-xs text-gray-500">Minimize animations and transitions</p>
                  </div>
                  <button
                    onClick={() => setReducedMotion(!reducedMotion)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      reducedMotion ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      reducedMotion ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Security</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Change Password</label>
                  <a
                    href="/profile"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    Go to Profile to change your password →
                  </a>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Active Sessions</h3>
                  <p className="text-sm text-gray-500">You are currently logged in on this device.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Notification Toggle Component
function NotificationToggle({ label, description, enabled, onToggle }: any) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>
    </label>
  )
}