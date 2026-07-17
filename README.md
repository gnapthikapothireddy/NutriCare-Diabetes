# NutriCare Diabetes AI 🩺

A comprehensive diabetes management web application built with React + Vite (frontend) and Express.js (backend).

## 🌐 Live Application (Production URLs)

| Service | Public URL | Status |
|---------|------------|--------|
| **🖥️ Frontend App** | **https://nutricare-diabetes.vercel.app** | ✅ Live on Vercel |
| **⚙️ Backend API** | **https://api-production-e8000.up.railway.app/api** | ✅ Live on Railway |
| **🔗 Health Check** | **https://api-production-e8000.up.railway.app/api/health** | ✅ Healthy |

> **Note:** You can share the **Frontend App** link with anyone in the world! It is publicly accessible and fully connected to the live backend API.

## ✨ Features

- 🩸 **Blood Sugar Tracker** — Log & visualize glucose readings with AI insights
- 🥗 **Meal Planner** — AI-powered diabetic-friendly meal plans
- 🍎 **Food Database** — 45+ Indian foods with GI ratings & alternatives
- 💊 **Medication Manager** — Track medications & adherence
- 🏃 **Exercise Tracker** — Log workouts with calorie burn estimates
- 💧 **Water Tracker** — Daily hydration monitoring
- 🤖 **AI Chatbot** — Multilingual nutrition assistant (EN/TE/HI)
- 📊 **Health Insights** — Comprehensive health analytics dashboard
- 🚨 **Emergency Guide** — Hypoglycemia & hyperglycemia action plans
- 👤 **Admin Panel** — User management dashboard

## 🚀 Quick Start (Local Development)

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## 🔧 Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost:5173
MONGODB_URI=          # Optional: MongoDB Atlas URI
GEMINI_API_KEY=       # Optional: Google Gemini AI key
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE=http://localhost:5000/api
```

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7, Chart.js |
| Backend | Node.js, Express 4, Helmet, Rate Limiting |
| Database | MongoDB Atlas (optional) / Local JSON fallback |
| Deployment | Vercel (frontend) + Railway (backend) |
