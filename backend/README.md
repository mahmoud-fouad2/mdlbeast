# MDLBEAST Backend API

Backend API for MDLBEAST Archive & Communications System built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Installation
```bash
cd backend
npm install
```

### Environment Setup
```bash
cp .env.example .env
```

Configure required environment variables in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3001)
- `CF_R2_*` - Cloudflare R2 storage credentials

### Database Setup
```bash
node scripts/run_migration.js
```

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/         # Database and configuration
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, validation, error handling
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   ├── lib/            # Utilities and helpers
│   └── types/          # TypeScript type definitions
├── scripts/            # Database migrations
└── tests/              # Test suites
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents` - List all documents
- `POST /api/documents` - Create new document
- `GET /api/documents/:id` - Get document details
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Approvals
- `GET /api/approvals` - List pending approvals
- `POST /api/approvals/:id/approve` - Approve document
- `POST /api/approvals/:id/reject` - Reject document

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Request rate limiting
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 📦 Dependencies

- **express** - Web framework
- **pg** - PostgreSQL client
- **jsonwebtoken** - JWT authentication
- **bcrypt** - Password hashing
- **pdf-lib** - PDF manipulation
- **@aws-sdk/client-s3** - S3-compatible storage

## 🧪 Testing

```bash
npm test
```

## 📝 Version

Current Version: **2.0.0**

---

**Developer:** Mahmoud Fouad  
**Email:** mahmoud.a.fouad2@gmail.com
