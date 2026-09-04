# AptitudeTest Pro 🎓

A full-stack aptitude test platform built for **500+ concurrent students** with teacher dashboards, anti-cheating protection, AI-powered analytics, YouTube learning suggestions, and milestone tracking.

---

## ✨ Features

### 👩‍🏫 Teacher Dashboard
- Create and manage a **question bank** (MCQ with 4 options, difficulty levels, negative marking)
- Build tests by selecting questions, setting duration, schedule, and deadline
- Toggle tests active/inactive
- View per-test results with student scores and disqualification status
- Class-wide analytics: top performers, at-risk students, weak topics

### 🎓 Student Dashboard
- View available and upcoming tests with countdown timers
- Take tests in a clean fullscreen-style interface
- **Anti-cheating system**: Tab switch → 1 warning → 2nd switch = auto-disqualify (via Socket.io)
- Countdown timer with auto-submit on expiry
- Per-question answer navigation with visual indicators

### 📊 Analytics
- Overall performance stats (avg score, tests completed, best score)
- **Line chart**: score trend over time
- **Radar chart**: performance across all topics
- **Weak topics** (avg < 60%) highlighted with:
  - What to study (bullet points)
  - 4 curated YouTube videos per topic
- **Strong topics** (avg ≥ 80%) celebrated

### 🏆 Milestones
- 4 default milestones: Starter 🌱 → Consistent ⭐ → Scholar 🎓 → Champion 🏆
- Progress bars and achievement dates
- Teachers can create custom milestones

### 🔒 Anti-Cheat System
- Monitors `visibilitychange` (tab switch / minimize)
- Monitors `window.blur` (alt+tab, new window)
- Real-time via Socket.io
- **1 warning**, then automatic disqualification on 2nd violation
- All events logged in database

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io |
| Charts | Recharts |
| Auth | JWT (7-day tokens) |
| Deployment | Render |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd aptitude-platform
```

### 2. Setup Backend

```bash
cd server
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/aptitude_db"
JWT_SECRET="your-very-long-secret-key-here"
CLIENT_URL="http://localhost:5173"
```

```bash
npm install
npx prisma db push        # Create tables in database
npm run dev               # Start server on port 5000
```

The server auto-seeds 4 default milestones on first start.

### 3. Setup Frontend

```bash
cd ../client
cp .env.example .env     # VITE_API_URL=http://localhost:5000
npm install
npm run dev              # Start frontend on port 5173
```

### 4. Open App

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

---

## 🌐 Deploying to Render

### Step 1: Push to GitHub
Push your project to a GitHub repository.

### Step 2: Create PostgreSQL Database on Render
1. Go to [render.com](https://render.com)
2. New → PostgreSQL → Choose free plan
3. Name it `aptitude-db`
4. Note the **Internal Database URL**

### Step 3: Deploy Backend
1. New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
   - **Start Command**: `npm start`
4. Environment Variables:
   - `DATABASE_URL` → paste your Render PostgreSQL URL
   - `JWT_SECRET` → any long random string
   - `CLIENT_URL` → your frontend Render URL (add after deploying frontend)
   - `NODE_ENV` → `production`

### Step 4: Deploy Frontend
1. New → Static Site
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Environment Variables:
   - `VITE_API_URL` → your backend Render URL (e.g., `https://aptitude-server.onrender.com`)

### Step 5: Update CORS
Go to backend service → Environment → update `CLIENT_URL` to your frontend URL.

---

## 📁 Project Structure

```
aptitude-platform/
├── server/
│   ├── prisma/
│   │   └── schema.prisma          # Database models
│   ├── src/
│   │   ├── index.js               # Express + Socket.io server
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT + role middleware
│   │   ├── routes/
│   │   │   ├── auth.js            # Register, Login, /me
│   │   │   ├── questions.js       # Teacher question CRUD
│   │   │   ├── tests.js           # Test CRUD + student available
│   │   │   ├── attempts.js        # Start, answer, submit attempts
│   │   │   ├── analytics.js       # Student + teacher analytics
│   │   │   ├── milestones.js      # Milestone management
│   │   │   └── youtube.js         # Mock YouTube video suggestions
│   │   └── services/
│   │       └── analyticsService.js
│   ├── .env.example
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── api/axios.js           # Axios with JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar + header layout
│   │   │   ├── StatCard.jsx       # Reusable stat card
│   │   │   ├── YouTubeCard.jsx    # Video suggestion card
│   │   │   └── TopicBadge.jsx     # Topic performance badge
│   │   └── pages/
│   │       ├── auth/              # Login, Register
│   │       ├── teacher/           # Dashboard, Questions, CreateTest, Results, Analytics, Milestones
│   │       └── student/           # Dashboard, TakeTest, Analytics, Milestones, History
│   └── package.json
│
├── render.yaml                    # Render deployment config
└── README.md
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

### Teacher
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/questions` | List/create questions |
| PUT/DELETE | `/api/questions/:id` | Update/delete question |
| GET/POST | `/api/tests` | List/create tests |
| PATCH | `/api/tests/:id/activate` | Toggle test active |
| GET | `/api/tests/:id/results` | Student results for test |
| GET | `/api/analytics/teacher` | Class-wide analytics |
| GET | `/api/analytics/teacher/test/:id` | Per-test analytics |

### Student
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tests/available` | Active tests not yet taken |
| POST | `/api/attempts` | Start a test attempt |
| PUT | `/api/attempts/:id/answer` | Save an answer |
| POST | `/api/attempts/:id/submit` | Submit test |
| GET | `/api/attempts` | My attempt history |
| GET | `/api/analytics/student` | My analytics + weak topics |
| GET | `/api/milestones/my-progress` | My milestone progress |
| GET | `/api/youtube/:topic` | Video suggestions for topic |

### Socket.io Events
| Event | Direction | Description |
|---|---|---|
| `join-attempt` | Client → Server | Join attempt room |
| `tab-switch` | Client → Server | Tab switch detected |
| `tab-warning` | Server → Client | Warning issued |
| `disqualified` | Server → Client | Test disqualified |

---

## 🔐 Environment Variables

### Server
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `PORT` | Server port (default: 5000) |
| `CLIENT_URL` | Frontend URL for CORS |
| `NODE_ENV` | `development` or `production` |

### Client
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (e.g., `https://aptitude-server.onrender.com`) |

---

## 🧪 Testing the Platform

1. **Register as Teacher** → Create questions → Build a test → Activate it
2. **Register as Student** → See available test → Click "Start Test"
3. **Anti-cheat test**: Switch tab → Warning appears → Switch again → Disqualified
4. **Analytics**: After completing 2+ tests → Check Student Analytics for weak topics + YouTube videos
5. **Milestones**: Complete tests → See milestone progress update

---

## 📈 Scale Considerations (500 Students)

- Socket.io handles 500+ concurrent WebSocket connections easily
- Rate limiting: 200 requests per 15 minutes per IP
- Prisma connection pooling for PostgreSQL
- Consider Redis for session storage at > 1000 concurrent users
- Render free tier: ~500 concurrent users possible; upgrade to paid for guaranteed performance

---

## 📝 License

MIT License — free to use and modify.
