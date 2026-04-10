# SomaPro LMS - Learning Management System

![SomaPro LMS Banner](https://via.placeholder.com/1200x400/1e293b/ffffff?text=SomaPro+LMS)

A comprehensive, modern Learning Management System built with Next.js 14, TypeScript, and MySQL. SomaPro LMS provides a complete solution for online education with support for courses, assignments, quizzes, grading, payment integration, and real-time notifications.

---

## 📋 Table of Contents
- Features
- Tech Stack
- Prerequisites
- Installation
- Environment Variables
- Project Structure
- Database Schema
- Key Features Explained
- User Guide
- Payment Integration
- Reports & Analytics
- Building for Production
- Contributing
- License
- Developer
- Acknowledgments

---

## 🚀 Features

### Students
- Course enrollment
- M-Pesa, Stripe, PayPal payments
- Assignments & quizzes
- Progress tracking
- Notifications
- Certificates

### Teachers
- Course creation
- Assignments & grading
- Analytics
- Multi-instructor support

### Admin
- Full system control
- Reports & analytics
- User management

---

## 🛠️ Tech Stack
- Next.js 14
- TypeScript
- MySQL
- Prisma ORM
- Tailwind CSS
- JWT Auth
- Stripe, PayPal, M-Pesa

---

## 📋 Prerequisites
- Node.js 18+
- MySQL
- npm/yarn/pnpm

---

## 🚀 Installation

```bash
git clone https://github.com/omondisteven/Soma-Pro-LMS.git
cd Soma-Pro-LMS
npm install
```

```sql
CREATE DATABASE somapro_db;
```

```bash
npx prisma migrate dev
npx prisma generate
npm run dev
```

---

## 🔧 Environment Variables

```env
DATABASE_URL=
JWT_SECRET=
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
MPESA_CONSUMER_KEY=
NEXT_PUBLIC_BASE_URL=
```

---

## 📁 Project Structure
```
app/
components/
lib/
prisma/
public/
```

---

## 📊 Database Schema
- User
- Course
- Lesson
- Assignment
- Quiz
- Enrollment
- Payment

---

## 🎯 Key Features
- Course management
- Assessments
- Payment system
- Notifications

---

## 📚 User Guide

### Student
- Register
- Enroll
- Learn

### Teacher
- Create courses
- Manage students
- Grade

---

## 💳 Payment Integration
- M-Pesa
- Stripe
- PayPal

---

## 📊 Reports
- Student performance
- Financial analytics

---

## 🔧 Production

```bash
npm run build
npm start
```

---

## 🤝 Contributing
PRs welcome

---

## 📄 License
MIT

---

## 👨‍💻 Developer
Steven Omondi

---

## 🙏 Acknowledgments
Next.js, Prisma, Tailwind, Stripe, PayPal, Safaricom
