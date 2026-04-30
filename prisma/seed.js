// prisma\seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create initial admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@somapro.com' },
    update: {},
    create: {
      email: 'admin@somapro.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      highSchoolCompleted: false,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create second admin user
  const semeonPassword = await bcrypt.hash('Semeon@123', 10)
  const semeon = await prisma.user.upsert({
    where: { email: 'semeon@somapro.com' },
    update: {},
    create: {
      email: 'semeon@somapro.com',
      password: semeonPassword,
      name: 'Semeon Onyango',
      role: 'ADMIN',
      highSchoolCompleted: false,
    },
  })
  console.log('✅ Semeon user created:', semeon.email)

  // Create a sample manager user
  try {
    const managerPassword = await bcrypt.hash('Manager@123', 10)
    const manager = await prisma.user.upsert({
      where: { email: 'manager@somapro.com' },
      update: {},
      create: {
        email: 'manager@somapro.com',
        password: managerPassword,
        name: 'Department Manager',
        role: 'MANAGER',
        highSchoolCompleted: false,
      },
    })
    console.log('✅ Manager user created:', manager.email)
  } catch (error) {
    console.log('⚠️ Could not create manager user:', error.message)
  }

  // Create a sample teacher user
  const teacherPassword = await bcrypt.hash('Teacher@123', 10)
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@somapro.com' },
    update: {},
    create: {
      email: 'teacher@somapro.com',
      password: teacherPassword,
      name: 'Demo Teacher',
      role: 'TEACHER',
      highSchoolCompleted: false,
    },
  })
  console.log('✅ Teacher user created:', teacher.email)

  // Create a sample student user
  const studentPassword = await bcrypt.hash('Student@123', 10)
  const student = await prisma.user.upsert({
    where: { email: 'student@somapro.com' },
    update: {},
    create: {
      email: 'student@somapro.com',
      password: studentPassword,
      name: 'Demo Student',
      role: 'STUDENT',
      highSchoolCompleted: true,
      qualification: 'BACHELORS',
      qualificationDiscipline: 'Computer Science',
    },
  })
  console.log('✅ Student user created:', student.email)

  console.log('🌱 Seeding complete!')
  console.log('📝 Login credentials:')
  console.log('   Admin: admin@somapro.com / Admin@123')
  console.log('   Admin2: semeon@somapro.com / Semeon@123')
  console.log('   Manager: manager@somapro.com / Manager@123')
  console.log('   Teacher: teacher@somapro.com / Teacher@123')
  console.log('   Student: student@somapro.com / Student@123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })