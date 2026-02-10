# STARHAWK API Server

This is the backend API server for the STARHAWK Agricultural Insurance Platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (connection string provided)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with:
   ```env
   MONGODB_URI=mongodb+srv://uzasolutionsltd_db_user:f5worjQbrVkfraJ8@cluster0.bu0bdxj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   DATABASE_NAME=starhawk_db
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your-secret-key-here
   ```

3. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```

4. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run server:dev
   
   # Production mode
   npm run server
   
   # Start both frontend and backend
   npm run dev:full
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token

### Farmer Routes
- `GET /api/farmer/dashboard` - Farmer dashboard data
- `GET /api/farmer/policies` - Get farmer policies
- `POST /api/farmer/claims` - Create new claim
- `GET /api/farmer/claims` - Get farmer claims
- `GET /api/farmer/fields` - Get field data
- `PUT /api/farmer/profile` - Update profile

### Insurer Routes
- `GET /api/insurer/dashboard` - Insurer dashboard data
- `GET /api/insurer/policies` - Get all policies
- `PUT /api/insurer/policies/:id` - Update policy status
- `GET /api/insurer/claims` - Get all claims
- `PUT /api/insurer/claims/:id` - Update claim status

### Assessor Routes
- `GET /api/assessor/dashboard` - Assessor dashboard data
- `GET /api/assessor/assessments/pending` - Get pending assessments
- `POST /api/assessor/assessments` - Create new assessment
- `PUT /api/assessor/assessments/:id` - Update assessment
- `GET /api/assessor/assessments` - Get assessment history

### Government Routes
- `GET /api/government/dashboard` - Government dashboard data
- `GET /api/government/reports` - Get national reports
- `POST /api/government/reports/generate` - Generate new report
- `GET /api/government/analytics/regional` - Get regional analytics

### Admin Routes
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user status
- `GET /api/admin/logs` - Get system logs
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings

## 🗄️ Database Collections

- **users** - User accounts and authentication
- **farmers** - Farmer profiles and information
- **insurers** - Insurer company information
- **assessors** - Field assessor information
- **policies** - Insurance policies
- **claims** - Insurance claims
- **assessments** - Field assessments
- **fields** - Farm field information
- **reports** - Generated reports
- **notifications** - System notifications

## 🔐 Sample Login Credentials

After running the seed script, you can use these credentials:

- **Farmer:** farmer@example.com / password123
- **Insurer:** insurer@example.com / password123
- **Assessor:** assessor@example.com / password123
- **Government:** government@example.com / password123
- **Admin:** admin@example.com / password123

## 🛠️ Development

### Project Structure
```
server/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── farmer.js            # Farmer-specific routes
│   ├── insurer.js           # Insurer-specific routes
│   ├── assessor.js          # Assessor-specific routes
│   ├── government.js        # Government-specific routes
│   └── admin.js             # Admin-specific routes
├── server.js                # Main server file
├── seed.js                  # Database seeding script
└── README.md                # This file
```

### Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `DATABASE_NAME` - Database name
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT signing secret

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Verify the connection string is correct
   - Check if your IP is whitelisted in MongoDB Atlas
   - Ensure the database user has proper permissions

2. **Port Already in Use:**
   - Change the PORT in your .env file
   - Kill any processes using port 3001

3. **JWT Token Issues:**
   - Ensure JWT_SECRET is set in environment variables
   - Check token expiration (default: 24 hours)

## 📝 Notes

- This is a development setup with sample data
- JWT tokens expire after 24 hours
- Password hashing uses bcrypt with salt rounds of 12
- CORS is configured for localhost:5173 (Vite dev server)
- All routes are protected except health check and auth endpoints
