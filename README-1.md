# SomaPro LMS - Learning Management System

![SomaPro LMS Banner](https://via.placeholder.com/1200x400/1e293b/ffffff?text=SomaPro+LMS)

A comprehensive, modern Learning Management System built with Next.js 14, TypeScript, and MySQL. SomaPro LMS provides a complete solution for online education with support for courses, assignments, quizzes, grading, payment integration, and real-time notifications.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Key Features Explained](#-key-features-explained)
- [User Guide](#-user-guide)
- [Payment Integration](#-payment-integration)
- [Reports & Analytics](#-reports--analytics)
- [Building for Production](#-building-for-production)
- [Contributing](#-contributing)
- [License](#-license)
- [Developer](#-developer)
- [Acknowledgments](#-acknowledgments)

---

## 🚀 Features

### For Students
- Browse and enroll in courses  
- Multiple payment options (M-Pesa, Stripe, PayPal)  
- Submit assignments with file attachments  
- Take auto-graded quizzes  
- Track progress and grades  
- Real-time notifications  
- Download certificates  
- Manage profile  

### For Teachers
- Create and manage courses  
- Review student applications  
- Create assignments and quizzes  
- Grade submissions  
- View analytics and reports  
- Manage instructors  
- Track revenue  

### Admin Features
- Platform oversight  
- Financial reporting  
- User management  
- System statistics  

---

## 🛠️ Tech Stack

- Next.js 14  
- React 18  
- TypeScript  
- Tailwind CSS  
- Prisma ORM  
- MySQL  
- JWT Authentication  
- Stripe, PayPal, M-Pesa  
- PDFKit  

---

## 📋 Prerequisites

- Node.js (v18+)  
- MySQL / MariaDB  
- npm / yarn / pnpm  
- Git  

---

## 🚀 Installation

```bash
git clone https://github.com/omondisteven/Soma-Pro-LMS.git
cd Soma-Pro-LMS
npm install
```

Create DB:
```sql
CREATE DATABASE somapro_db;
```

Run:
```bash
npx prisma migrate dev
npx prisma generate
npm run dev
```

---

## 🔧 Environment Variables

```env
DATABASE_URL=""
JWT_SECRET=""
STRIPE_SECRET_KEY=""
PAYPAL_CLIENT_ID=""
MPESA_CONSUMER_KEY=""
NEXT_PUBLIC_BASE_URL=""
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

Main models:
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
- Assessments (quizzes + assignments)  
- Payments integration  
- Notifications system  

---

## 📚 User Guide

### Student
- Register  
- Enroll  
- Learn  
- Track progress  

### Teacher
- Create courses  
- Manage students  
- Grade work  

---

## 💳 Payment Integration

- M-Pesa (STK Push)  
- Stripe  
- PayPal  

---

## 📊 Reports & Analytics

- Student progress  
- Grades  
- Financial reports  

---

## 🔧 Build

```bash
npm run build
npm start
```

---

## 🤝 Contributing

Pull requests are welcome.

---

## 📄 License

MIT License

---

## 👨‍💻 Developer

Steven Omondi  
omondisteven@gmail.com  

---

## 🙏 Acknowledgments

Next.js, Prisma, Tailwind, Stripe, PayPal, Safaricom
