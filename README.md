# 🏥 CarePath - Post Surgery Recovery Tracker

A full-stack web application designed to monitor patient recovery after surgery, powered by AI-driven health analysis, real-time chat, video consultations, and automated reports.

---

## 🚀 Features Overview

-   🧑‍⚕️ Track patient recovery with daily health updates
-   🤖 AI-powered health risk analysis (Red / Yellow / Green status)
-   💬 Real-time patient-doctor chat
-   🎥 Secure video consultations (WebRTC)
-   📄 Auto-generated medical reports (PDF)
-   🔔 Critical alert notifications
-   🧑‍💼 Admin portal for complete system management
-   📊 Comprehensive analytics dashboards
-   ✅ Task and medication management
-   📝 Clinical notes and progress tracking

---

## 🏗️ Tech Stack

### Frontend

-   **Framework:** React + TypeScript
-   **Build Tool:** Vite
-   **Styling:** TailwindCSS
-   **UI Components:** shadcn/ui
-   **State Management:** React Context API
-   **Routing:** React Router v6

### Backend

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Language:** TypeScript
-   **Database:** MongoDB + Mongoose
-   **Authentication:** JWT (HTTP-only cookies)
-   **Validation:** Custom validation utilities
-   **Security:** bcrypt, CORS, role-based access control

---

## 📂 Project Structure

```
CarePath/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Context providers
│   │   ├── layouts/       # Layout components
│   │   └── lib/          # Utility functions
│   └── package.json
│
├── backend/            # Express API server
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routers/      # API routes
│   │   ├── middlewares/  # Custom middleware
│   │   ├── utils/        # Helper functions
│   │   └── app.ts        # Express configuration
│   └── package.json
│
└── README.md           # This file
```

---

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   MongoDB (v5.0 or higher)
-   npm or yarn

### Backend Setup

1. **Navigate to backend directory:**

    ```bash
    cd backend
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure environment:**

    ```bash
    cp .env.example .env
    ```

    Edit `.env` with your settings:

    ```env
    PORT=8000
    MONGODB_URI=mongodb://localhost:27017/carepath
    JWT_SECRET=your-secret-key
    FRONTEND_URL=http://localhost:5173
    ```

4. **Start the server:**

    ```bash
    npm run dev
    ```

5. **Seed sample data (optional):**
    - Register an admin account via API
    - Use admin account to seed patients and doctors

### Frontend Setup

1. **Navigate to frontend directory:**

    ```bash
    cd frontend
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Start development server:**

    ```bash
    npm run dev
    ```

4. **Open browser:**
    ```
    http://localhost:5173
    ```

---

## 📖 Complete Documentation

### Backend Documentation

-   [Backend README](./backend/README.md) - Setup and configuration
-   [API Documentation](./backend/API_DOCUMENTATION.md) - Complete API reference

### Key Features Implemented

✅ **Authentication & Authorization**

-   JWT-based authentication with HTTP-only cookies
-   Role-based access control (Admin, Doctor, Patient)
-   Secure password hashing with bcrypt

✅ **Patient Management**

-   Complete CRUD operations
-   Patient profiles with medical history
-   Risk level tracking (stable/monitor/critical)
-   Adherence and recovery progress metrics

✅ **Doctor Management**

-   Doctor profiles and specializations
-   Patient assignment system
-   License and credential management

✅ **Daily Health Monitoring**

-   Symptom check-ins (pain, temperature, vitals)
-   AI-driven risk analysis
-   Automatic alert generation for critical conditions
-   Recovery trend analysis and visualization

✅ **Task Management**

-   Medication reminders
-   Exercise schedules
-   Appointment tracking
-   Adherence rate calculation

✅ **Alert System**

-   Automated critical alerts
-   Manual alert creation
-   Alert status management (active/resolved/dismissed)
-   Priority levels (normal/warning/critical)

✅ **Clinical Notes**

-   Doctor notes for patients
-   Multiple note types (Clinical, Progress, Intervention, etc.)
-   Private/public note options
-   Attachment support

✅ **Messaging System**

-   Patient-doctor communication
-   Conversation management
-   Read receipts
-   Message history

✅ **Analytics Dashboards**

-   Admin: System-wide statistics
-   Doctor: Assigned patient overview
-   Patient: Personal health metrics

✅ **Video Consultations**

-   Call room creation
-   WebRTC signaling infrastructure
-   Session management

---

## 🔐 Default Credentials

### Admin Account

After running the registration endpoint:

-   Email: `admin@test.com`
-   Password: `admin123`
-   Role: `admin`

### Sample Patient (after seeding)

-   Email: `john.smith@example.com`
-   Password: `password`
-   Role: `patient`

### Sample Doctor (after seeding)

-   Email: `dr.smith@hospital.com`
-   Password: `Doctor@123`
-   Role: `doctor`

---

## 📚 API Endpoints Summary

### Authentication

-   `POST /api/v1/auth/login` - User login
-   `POST /api/v1/auth/logout` - User logout
-   `GET /api/v1/auth/me` - Get current user

### Admin Portal

-   Patient management (CRUD)
-   Doctor management (CRUD)
-   Patient-doctor assignments
-   System analytics

### Patient Portal

-   Daily health check-ins
-   Recovery trends
-   Task management
-   Personal analytics
-   Messaging

### Doctor Portal

-   View assigned patients
-   Create clinical notes
-   Review alerts
-   Access patient history
-   Messaging

### Shared Features

-   Real-time messaging
-   Alert management
-   Video consultations
-   Analytics

See [API Documentation](./backend/API_DOCUMENTATION.md) for complete endpoint details.

---

## 🤖 AI-Driven Features

### Automatic Risk Detection

The system analyzes each symptom check-in and automatically:

-   **Critical (Red):** Temperature >101°F or <95°F, Pain ≥8/10

    -   Updates patient risk level to critical
    -   Creates high-priority alert
    -   Flags for immediate review

-   **Warning (Yellow):** Pain ≥6/10, Temperature >99.5°F

    -   Updates patient risk level to monitor
    -   Creates warning alert

-   **Normal (Green):** All vitals within acceptable range
    -   Logs check-in normally

### Recovery Trend Analysis

-   Tracks pain, temperature, and mood patterns
-   Calculates 7-day average comparisons
-   Determines improvement trends (improving/stable/declining)
-   Provides actionable insights for healthcare providers

---

## 🧪 Testing the Application

### 1. Start Both Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Register Admin & Seed Data

```bash
# Register admin
curl -X POST http://localhost:8000/api/v1/register-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","firstName":"Admin","lastName":"User","password":"admin123"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@test.com","password":"admin123","role":"admin"}'

# Seed patients and doctors
curl -X POST http://localhost:8000/api/v1/admin/seed-patients -b cookies.txt
curl -X POST http://localhost:8000/api/v1/admin/seed-doctors -b cookies.txt
```

### 3. Test Different User Roles

-   Login as admin to manage the system
-   Login as doctor to view assigned patients
-   Login as patient to submit health updates

---

## 🔮 Future Enhancements

-   [ ] Socket.IO for real-time notifications
-   [ ] Email notification service (Nodemailer)
-   [ ] SMS alerts for critical conditions (Twilio)
-   [ ] PDF report generation
-   [ ] File upload for medical images (AWS S3)
-   [ ] Advanced AI predictions using ML models
-   [ ] Appointment scheduling system
-   [ ] Multi-language support
-   [ ] Mobile app integration
-   [ ] Telemedicine platform integration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

For issues, questions, or contributions:

-   Check the documentation in `backend/API_DOCUMENTATION.md`
-   Review the backend README: `backend/README.md`
-   Open an issue in the repository
-   Contact the development team

---

## ✅ Implementation Status

### Completed ✅

-   Authentication & Authorization
-   User Management (Admin, Doctor, Patient)
-   Patient CRUD operations
-   Doctor CRUD operations
-   Patient-doctor assignments
-   Daily health check-ins with AI risk analysis
-   Task management system
-   Alert generation and management
-   Clinical notes
-   Messaging system
-   Analytics dashboards
-   Video call infrastructure
-   Custom validation (removed Zod dependency)
-   Comprehensive API documentation

### In Progress 🚧

-   Frontend UI improvements
-   Socket.IO integration
-   Email notifications
-   File upload system

### Planned 📋

-   PDF report generation
-   Advanced AI predictions
-   Appointment scheduling
-   Mobile responsiveness
-   Multi-language support

---

**Built with ❤️ for better healthcare management**

# 📂 Page-by-Page Detailed Documentation

This section documents **every page** of the Post Surgery Tracker — its purpose, UI flow, and backend functionality.

---

# 🌐 Public Pages

## 🏠 Landing Page

### **Purpose**

Entry point describing features and providing access to login/signup.

### **UI**

-   Navbar (Logo, About, Contact, Login, Signup)
-   Hero section with illustration and tagline
-   Feature highlights section
-   Footer with legal links

### **Functionality**

-   Navigate to login/signup
-   Contact form → sends email to admin

---

## 🔐 Login / Signup Page

### **Purpose**

Authentication for all roles (Patient, Doctor, Admin).

### **UI**

-   Role selector (Dropdown or Tabs)
-   Input fields: email, password, confirm password
-   Forgot password link
-   Buttons: Login / Signup

### **Functionality**

-   JWT authentication
-   Server-side validation
-   Role-based redirects:
    -   Patient → `/patient/dashboard`
    -   Doctor → `/doctor/dashboard`
    -   Admin → `/admin/dashboard`
-   Email + password hashing (bcrypt)
-   Email verification system

---

# 👩‍⚕️ Patient Portal

## 🩺 Patient Dashboard

### **Purpose**

Give the patient an overall snapshot of their ongoing recovery.

### **UI**

-   Cards:
    -   Daily Updates Count
    -   Next Consultation
    -   AI Health Status (Red / Yellow / Green)
-   Recovery charts (pain, temperature)
-   Quick-action buttons

### **Functionality**

-   Fetch user-specific analytics
-   Check AI-generated health alerts
-   Notify patient of doctor feedback

---

## 📋 Daily Health Update Page

### **Purpose**

Patient submits their daily vitals and symptoms.

### **UI**

-   Pain level (1–10)
-   Temperature field
-   Wound condition dropdown
-   Mobility select field
-   Medication adherence checkbox
-   Notes textbox
-   Upload wound image

### **Functionality**

-   Store daily update in DB
-   Trigger AI analysis:
    -   Predict risk zone (R/G/Y)
    -   Send alert email if critical
-   Show success notification

---

## 📊 Recovery Trends Page

### **Purpose**

Visualize long-term healing progress.

### **UI**

-   Line chart: pain/temperature trends
-   Bar chart: mobility improvements
-   AI insights card

### **Functionality**

-   Fetch all previous updates
-   Generate charts (Chart.js / Recharts)
-   Create AI summary of last X days

---

## 💬 Chat with Doctor

### **Purpose**

Enable real-time messaging.

### **UI**

-   Chat list (doctor)
-   Conversation window
-   Input field + send button

### **Functionality**

-   Real-time messaging (WebSockets / Firebase)
-   Store messages in DB
-   Typing and read indicators
-   Notification on new message

---

## 🎥 Video Consultation Page

### **Purpose**

Allow live doctor-patient video calls.

### **UI**

-   Local + remote video windows
-   Call controls (mute, end, camera toggle)

### **Functionality**

-   WebRTC video calling
-   Socket-based signaling
-   Meeting room token generation

---

## 📄 PDF Report Page

### **Purpose**

Generate downloadable medical reports.

### **UI**

-   Summary + charts preview
-   Doctor notes section
-   “Download PDF” button

### **Functionality**

-   Compile patient data + charts
-   Generate formatted PDF
-   Email PDF to patient
-   Include AI summary of recovery

---

# 👨‍⚕️ Doctor Portal

## 🩺 Doctor Dashboard

### **Purpose**

Overview of all assigned patients and alerts.

### **UI**

-   Stats: Total patients, active alerts, pending consultations
-   Table of patients & their health color status

### **Functionality**

-   Fetch assigned patients
-   Highlight red/yellow alerts
-   Open patient detail page

---

## 👁️ Patient Detail Page (Doctor)

### **Purpose**

Provide detailed patient recovery information.

### **UI**

-   Patient overview card
-   Tabs:
    1. Overview
    2. Daily Updates
    3. Charts
    4. Doctor Notes

### **Functionality**

-   View full history of updates
-   Add/edit doctor notes
-   AI-based 7-day summary
-   Export data to PDF

---

## 📞 Consultation Management

### **Purpose**

Manage upcoming and ongoing video calls.

### **UI**

-   Calendar
-   Scheduled consult list
-   “Start Call” button

### **Functionality**

-   Schedule appointments
-   Join video call rooms
-   Send automated reminders

---

# 🧑‍💼 Admin Portal

## 🧭 Admin Dashboard

### **Purpose**

System-level monitoring & analytics.

### **UI**

-   Count cards (Patients, Doctors)
-   Graphs: AI alerts, platform usage
-   Recent activity logs

### **Functionality**

-   Fetch global analytics
-   System-wide performance metrics

---

## 👥 User Management Page

### **Purpose**

Manage doctor and patient accounts.

### **UI**

-   Table with user details
-   Edit, Delete, Suspend buttons
-   Role filters & search

### **Functionality**

-   CRUD on user accounts
-   Assign patient-doctor relationships

---

## 🔔 AI Alerts & Reports Page

### **Purpose**

Monitor AI-flagged critical patients.

### **UI**

-   Table: patient name, alert level, date
-   View details button

### **Functionality**

-   List all high-risk events
-   Escalation to doctor
-   Full event logs

---

## ⚙️ System Settings Page

### **Purpose**

Control platform configuration.

### **UI**

-   AI threshold sliders
-   SMTP settings
-   Toggle features (chat, video, alerts)

### **Functionality**

-   Update system-wide configuration
-   Modify thresholds for AI detection
-   Manage email/notification settings

---

# 🧠 AI Integration Summary

| Feature                    | Description                                   |
| -------------------------- | --------------------------------------------- |
| Daily Health Risk Analysis | Predicts patient condition (Red/Yellow/Green) |
| Automated Critical Alerts  | Sends doctor notifications for serious risks  |
| AI Recovery Summaries      | Key insights over day/week/month              |
| Report Generator           | Auto-generates PDF reports with insights      |

---

# 🏗️ Recommended Tech Stack

-   **Frontend:** React / Next.js + TailwindCSS
-   **Backend:** Node.js (Express)
-   **Database:** MongoDB + Mongoose
-   **Realtime:** Socket.IO
-   **Video Calls:** WebRTC
-   **PDF Generator:** jsPDF / ReportLab
-   **AI:** Python microservice or OpenAI API
-   **Auth:** JWT + cookies
-   **Mailing:** Nodemailer / Gmail API

---

# 📌 Conclusion

This README describes the full architecture, pages, and functionality of the **Post Surgery Tracker** platform.  
You can directly use this as a base for GitHub documentation or technical planning.
