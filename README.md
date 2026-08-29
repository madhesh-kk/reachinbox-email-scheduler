# ReachInbox Hiring Assignment - Email Scheduler

A full-stack email job scheduler with Express.js, BullMQ, Redis, MySQL, and Next.js. This application allows users to schedule and send emails at scale using Ethereal Email (fake SMTP for testing).

## 🎯 Features

### Backend
- ✅ **Express.js + TypeScript** - RESTful API
- ✅ **BullMQ + Redis** - Persistent job scheduling (no cron jobs)
- ✅ **MySQL + Prisma ORM** - Database with migrations
- ✅ **Ethereal Email SMTP** - Fake SMTP for testing
- ✅ **Google OAuth** - Real authentication
- ✅ **Rate Limiting** - Per-sender hourly email limits
- ✅ **Worker Concurrency** - Configurable concurrent email processing
- ✅ **Delay Between Emails** - Configurable minimum delay
- ✅ **BullMQ Dashboard** - Live queue monitoring at `/admin/queues`
- ✅ **Slack Integration** - Rate limit notifications via Slack webhook
- ✅ **Elasticsearch** - Email search indexing (optional)
- ✅ **Survives Restarts** - Jobs persist across server restarts

### Frontend
- ✅ **Next.js 14 + TypeScript** - Modern React framework
- ✅ **Tailwind CSS** - Responsive UI styling
- ✅ **Google OAuth Login** - Real authentication flow
- ✅ **Compose Emails** - Rich text editor with formatting
- ✅ **CSV Upload** - Bulk email recipient import
- ✅ **File Attachments** - Upload files with emails
- ✅ **Schedule for Later** - Pick future send time
- ✅ **Real-time Updates** - Auto-refresh email lists
- ✅ **Search Functionality** - Search emails by content
- ✅ **Scheduled/Sent Tabs** - Organized email views

## 🛠 Tech Stack

**Backend:**
- Node.js v18+
- TypeScript
- Express.js
- BullMQ (Redis-backed job queue)
- Prisma ORM
- MySQL
- Nodemailer (Ethereal Email)
- Passport.js (Google OAuth)

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- TanStack Query (React Query)

**Infrastructure:**
- Redis
- MySQL
- Elasticsearch (optional)

## 📦 Installation

### Prerequisites
- Node.js v18 or higher
- MySQL server running
- Redis server running
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd outbox
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# - Set DATABASE_URL with your MySQL credentials
# - Set REDIS_URL with your Redis URL
# - Set Google OAuth credentials (get from Google Cloud Console)
# - Other settings can use defaults

# Run Prisma migrations
npx prisma generate
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 3. Frontend Setup

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local if needed (default: http://localhost:4000)
```

## 🚀 Running the Application

### Start Backend Services

**Terminal 1: Backend API**
```bash
cd backend
npm run dev
```
Server runs on http://localhost:4000

**Terminal 2: Email Worker**
```bash
cd backend
npm run worker
```
Processes email jobs from the queue

### Start Frontend

**Terminal 3: Frontend**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

## 🗄 Database Setup

### MySQL Setup

1. Create database and user:
```sql
CREATE DATABASE outbox;
CREATE USER 'reachinbox'@'localhost' IDENTIFIED BY 'reachinbox';
GRANT ALL PRIVILEGES ON outbox.* TO 'reachinbox'@'localhost';
FLUSH PRIVILEGES;
```

2. Run migrations:
```bash
cd backend
npx prisma migrate dev
```

### Redis Setup

**Option 1: Using Docker**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Option 2: Native Installation**
- Windows: Download from https://redis.io/download
- Mac: `brew install redis && brew services start redis`
- Linux: `sudo apt install redis-server && sudo systemctl start redis`

## 🔐 Environment Variables

### Backend (.env)

See `backend/.env.example` for all required variables:

**Required:**
- `DATABASE_URL` - MySQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

**Optional:**
- `ELASTICSEARCH_URL` - For search functionality
- `SLACK_CLIENT_ID` - For Slack integration
- `SLACK_CLIENT_SECRET` - For Slack integration

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:4000)

## 🎮 Usage

### 1. Login
- Navigate to http://localhost:3000
- Click "Sign in with Google"
- Authorize the application

### 2. Compose Email
- Click "Compose" button
- Add recipient emails (or upload CSV)
- Write subject and body
- (Optional) Attach files
- Click "Send" for immediate send
- Or click clock icon → pick time → "Done" for scheduled send

### 3. View Emails
- **Scheduled Tab**: See emails waiting to be sent with scheduled times
- **Sent Tab**: See sent/failed emails

### 4. Monitor Queue (Optional)
- Visit http://localhost:4000/admin/queues
- View real-time queue statistics
- See active, completed, and failed jobs

### 5. Slack Integration (Optional)
- Click user profile → "Connect Slack"
- Authorize Slack
- Receive notifications when rate limits are hit

## 📧 Ethereal Email

This project uses **Ethereal Email** (fake SMTP) as per assignment requirements.

**Important:** Emails are NOT actually delivered to recipients. Instead:
- Each sender gets auto-generated Ethereal SMTP credentials
- Emails create preview links visible only to you
- Check worker console logs for preview URLs
- Preview URLs look like: `https://ethereal.email/message/xyz...`

## ⚙️ Configuration

### Worker Settings (backend/.env)
```env
WORKER_CONCURRENCY=5                    # Number of parallel email jobs
MIN_DELAY_BETWEEN_EMAILS_MS=2000       # 2 second delay between sends
MAX_EMAILS_PER_HOUR_PER_SENDER=200     # Hourly rate limit per sender
```

### Rate Limiting
- Configured per sender
- Tracked in Redis with hourly windows
- Emails exceeding limit are delayed to next hour
- Slack notifications sent when limit is reached

### Throughput
- Configurable worker concurrency
- Minimum delay between sends
- Hourly rate limits per sender
- All safe across multiple worker instances

## 🏗 Project Structure

```
outbox/
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication (Google OAuth, JWT)
│   │   ├── config/        # Configuration files
│   │   ├── db/            # Prisma client
│   │   ├── middleware/    # Auth middleware
│   │   ├── queue/         # BullMQ queue and worker
│   │   ├── redis/         # Redis client
│   │   ├── routes/        # API routes
│   │   ├── services/      # Email, Elasticsearch, Slack services
│   │   ├── bullboard.ts   # BullMQ dashboard
│   │   └── index.ts       # Express server
│   ├── prisma/
│   │   ├── migrations/    # Database migrations
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   │   ├── dashboard/ # Dashboard pages
│   │   │   ├── login/     # Login page
│   │   │   └── layout.tsx # Root layout
│   │   ├── components/    # Reusable components
│   │   └── lib/           # API client, types
│   ├── .env.local.example
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── .gitignore
└── README.md
```

## 🧪 Testing

### Test Email Flow

1. **Immediate Send:**
   - Compose → Send
   - Email appears in "Sent" tab as "Sending..."
   - After 2-5 seconds, status changes to "Sent"
   - Check worker logs for Ethereal preview URL

2. **Scheduled Send:**
   - Compose → Clock icon → Pick future time → Done
   - Email appears in "Scheduled" tab with time
   - At scheduled time, worker processes it
   - Moves to "Sent" tab when complete

3. **Rate Limiting:**
   - Send 200+ emails in one hour
   - Additional emails delayed to next hour
   - Status shows "Rate Limited"
   - (If Slack connected) Receive Slack notification

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 4000 (backend)
npx kill-port 4000

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

### Database Connection Failed
- Verify MySQL is running: `mysql -u reachinbox -p`
- Check DATABASE_URL in `.env`
- Ensure database exists: `CREATE DATABASE outbox;`

### Redis Connection Failed
- Verify Redis is running: `redis-cli ping` (should return PONG)
- Check REDIS_URL in `.env`

### Worker Not Processing
- Check worker terminal for errors
- Verify Redis is running
- Restart worker: `npm run worker`

### Prisma Errors
```bash
# Regenerate Prisma client
cd backend
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 📝 Assignment Requirements Checklist

✅ **Backend:**
- [x] TypeScript
- [x] Express.js
- [x] BullMQ + Redis (no cron)
- [x] MySQL with ORM (Prisma)
- [x] Ethereal Email SMTP
- [x] API endpoints
- [x] Persistent across restarts
- [x] Worker concurrency
- [x] Rate limiting per sender
- [x] Delay between emails
- [x] BullMQ dashboard
- [x] Elasticsearch (optional)
- [x] Slack notifications

✅ **Frontend:**
- [x] React.js (Next.js)
- [x] TypeScript
- [x] Tailwind CSS
- [x] Google OAuth login
- [x] Compose email UI
- [x] Schedule emails
- [x] View scheduled/sent emails
- [x] CSV upload
- [x] File attachments
- [x] Search functionality

✅ **Infrastructure:**
- [x] Redis for queue
- [x] MySQL for persistence
- [x] Clean project structure
- [x] .env.example files
- [x] No secrets in repo

## 👨‍💻 Development

### Available Scripts

**Backend:**
```bash
npm run dev          # Start dev server with auto-reload
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run worker       # Start email worker
```

**Frontend:**
```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📄 License

This project is for ReachInbox hiring assignment purposes.

## 🤝 Contact

For any questions about this assignment, please refer to the assignment documentation.

---

**Note:** This is a test project using Ethereal Email (fake SMTP). No real emails are sent to recipients.
