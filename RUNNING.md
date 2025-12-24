# 🚀 Project چلانے کی Guide

یہ guide میں Cloud Native Todo Chatbot کو اپنے مشین پر چلانے کی مکمل ہدایات دی جائیں گی۔

---

## 📋 فہرست

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Testing the Application](#testing-the-application)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

---

## Prerequisites

اپنے مشین پر یہ چیزیں install ہونی ضروری ہیں:

### System Requirements
- **Node.js:** v18.0.0 یا اس سے اوپر
- **npm:** v9.0.0 یا اس سے اوپر
- **Git:** Version control کے لیے

### Check Installation
```bash
# Node.js version check کریں
node --version    # v18+

# npm version check کریں
npm --version     # v9+

# Git check کریں
git --version
```

---

## Installation

### Step 1: Repository Clone کریں
```bash
git clone <repository-url>
cd hackathon-04-kubenates-todo-mangment-system
```

### Step 2: Root Dependencies Install کریں
```bash
npm install
```

### Step 3: Frontend Dependencies Install کریں
```bash
cd frontend
npm install
cd ..
```

---

## Running the Project

### ✅ Option 1: دونوں Servers الگ الگ Terminals میں چلائیں (Recommended)

#### Terminal 1 - Backend Server شروع کریں:
```bash
# Backend چلانے کے لیے root directory میں جائیں
npm run dev

# یا Production mode میں:
npm start
```

**Output میں یہ دیکھیں:**
```
Server running on port 3000 (development mode)
```

---

#### Terminal 2 - Frontend Server شروع کریں:
```bash
cd frontend
npm run dev

# یا Production build کے لیے:
npm run build
npm run preview
```

**Output میں یہ دیکھیں:**
```
➜  Local:   http://localhost:3002/
```

---

### ✅ Option 2: دونوں Servers ایک ہی Command سے چلائیں

#### Package.json میں Concurrently استعمال کریں:
```bash
# دونوں servers ایک ساتھ شروع ہوں گے
npm run dev:all
```

> نوٹ: یہ command کام کرے گا اگر package.json میں یہ script موجود ہے

---

## Testing the Application

### 1️⃣ Backend Health Check کریں
```bash
# Browser میں یا terminal میں:
curl http://localhost:3000/health

# Expected Response:
# {"status":"UP"}
```

### 2️⃣ Frontend کھولیں
```
Browser میں یہ URL کھولیں:
http://localhost:3002
```

### 3️⃣ Chat Functionality Test کریں
```bash
# API کو test کریں
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, create a todo"}'
```

### 4️⃣ Backend Tests چلائیں
```bash
# تمام tests
npm test

# صرف unit tests
npm run test:unit

# صرف integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

---

## Available Commands

### Backend Commands
```bash
npm run dev              # Development mode (auto-reload)
npm start                # Production mode
npm test                 # تمام tests چلائیں
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:coverage    # Code coverage report
npm run lint             # ESLint code check
```

### Frontend Commands
```bash
cd frontend

npm run dev              # Development server
npm run build            # Production build
npm run preview          # Preview build locally
npm run lint             # ESLint check
```

---

## Project Structure

```
hackathon-04-kubenates-todo-mangment-system/
├── src/                          # Backend source code
│   ├── app.js                    # Express app entry point
│   ├── routes.js                 # API routes
│   ├── middleware/               # Custom middlewares
│   │   ├── cors.js              # CORS configuration
│   │   ├── error-handler.js     # Error handling
│   │   └── logging.js           # Request logging
│   ├── handlers/                 # Request handlers
│   │   ├── todos.js             # Todo CRUD operations
│   │   └── chat.js              # Chat processing
│   ├── utils/                    # Utility functions
│   │   └── logger.js            # Winston logger
│   └── constants/                # Constants
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── App.jsx              # Main app component
│   │   ├── components/          # React components
│   │   ├── context/             # Context API
│   │   ├── services/            # API services
│   │   ├── utils/               # Utilities
│   │   ├── styles/              # CSS/Tailwind styles
│   │   └── main.jsx             # Entry point
│   ├── public/                   # Static assets
│   ├── tailwind.config.js        # Tailwind configuration
│   ├── vite.config.js            # Vite configuration
│   └── package.json
│
├── tests/                        # Backend tests
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── contract/                 # Contract tests
│
├── helm/                         # Kubernetes Helm charts
├── package.json                  # Backend dependencies
├── package-lock.json
└── README.md                     # Project documentation
```

---

## API Endpoints

### Health Check
```
GET /health
GET /ready
```

### Chat API
```
POST /api/v1/chat
Body: { "message": "user message" }
Response: { "status": "SUCCESS", "data": { ... } }
```

### Todo CRUD
```
POST /api/v1/todos
GET /api/v1/todos
PUT /api/v1/todos/:id
DELETE /api/v1/todos/:id
```

---

## Environment Variables

### Backend (.env یا process.env)
```bash
PORT=3000                    # Server port
NODE_ENV=development         # Environment
LOG_LEVEL=info              # Logging level
```

### Frontend (.env.local)
```bash
VITE_API_BASE_URL=http://localhost:3000
```

---

## Troubleshooting

### ❌ Problem: Port 3000 پہلے سے استعمال ہو رہا ہے

**حل:**
```bash
# Linux/Mac
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# یا مختلف port استعمال کریں:
PORT=3001 npm run dev
```

---

### ❌ Problem: npm install میں error آ رہا ہے

**حل:**
```bash
# Cache صاف کریں
npm cache clean --force

# Node modules delete کریں
rm -rf node_modules package-lock.json

# دوبارہ install کریں
npm install
```

---

### ❌ Problem: CORS error

**حل:**
- Backend اور Frontend دونوں چل رہے ہیں یقینی بنائیں
- CORS middleware صحیح طریقے سے configure ہے
- Frontend API URL صحیح ہے

---

### ❌ Problem: Frontend responsive UI نہیں دکھ رہا

**حل:**
- Browser DevTools میں Mobile view enable کریں
- Cache clear کریں (Ctrl+Shift+Delete)
- Tailwind CSS build دوبارہ compile ہو رہی ہے

---

## Development Workflow

### 1. Features شامل کریں
```bash
# نیا branch بنائیں
git checkout -b feature/your-feature-name

# Code لکھیں اور tests add کریں
# Changes test کریں
```

### 2. Code Format اور Lint کریں
```bash
# Backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### 3. Tests چلائیں
```bash
# Backend tests
npm test

# Frontend tests (اگر موجود ہو)
cd frontend
npm test
```

### 4. Commit اور Push کریں
```bash
git add .
git commit -m "feat: describe your changes"
git push origin feature/your-feature-name
```

---

## Production Deployment

### Backend Deployment
```bash
# Build کریں
npm run build   # اگر موجود ہو

# Production میں چلائیں
npm start
```

### Frontend Deployment
```bash
cd frontend

# Build کریں
npm run build

# Build output (dist/) کو serve کریں
npm run preview
```

---

## Docker Support

اگر Docker استعمال کر رہے ہیں:

```bash
# Docker image build کریں
docker build -t todo-chatbot .

# Container run کریں
docker run -p 3000:3000 -p 3002:3002 todo-chatbot
```

---

## Support اور Help

### Logs دیکھیں
```bash
# Backend logs
npm run dev   # logs directly console میں آئیں گی

# Frontend logs
cd frontend
npm run dev   # Vite logs دیکھیں گے
```

### مسائل Report کریں
1. Issue اپنے GitHub repository میں add کریں
2. Detailed logs اور reproduction steps دیں
3. Environment details mention کریں

---

## Performance Tips

### Frontend بہتری
- DevTools > Lighthouse چلائیں
- Bundle size check کریں: `npm run build -- --analyze`
- Lazy loading implement کریں

### Backend بہتری
- Database indexes add کریں
- Caching implement کریں
- API response time optimize کریں

---

## Next Steps

✅ Project چل رہا ہے! اب:

1. 📖 README.md پڑھیں تفصیلات کے لیے
2. 🧪 Tests چلائیں: `npm test`
3. 💻 Code explore کریں اور features add کریں
4. 🚀 Production deployment کے لیے تیاری کریں

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Guide](https://vitejs.dev)
- [Jest Testing](https://jestjs.io)

---

**Happy Coding! 🎉**

---

*Last Updated: 2025-12-25*
*Version: 1.0.0*
