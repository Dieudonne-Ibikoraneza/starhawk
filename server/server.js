import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import farmerRoutes from './routes/farmer.js';
import insurerRoutes from './routes/insurer.js';
import assessorRoutes from './routes/assessor.js';
import governmentRoutes from './routes/government.js';
import adminRoutes from './routes/admin.js';
import satelliteRoutes from './routes/satellite.js';

// Import middleware
import { authenticateToken, requireRole } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    'http://localhost:8080',
    'https://dashboard-blueprint-nexus.vercel.app',
    /\.vercel\.app$/ // Allow all Vercel preview deployments
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'STARHAWK API Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', authenticateToken, requireRole(['farmer']), farmerRoutes);
app.use('/api/insurer', authenticateToken, requireRole(['insurer']), insurerRoutes);
app.use('/api/assessor', authenticateToken, requireRole(['assessor']), assessorRoutes);
app.use('/api/government', authenticateToken, requireRole(['government']), governmentRoutes);
app.use('/api/admin', authenticateToken, requireRole(['admin']), adminRoutes);
app.use('/api/satellite', satelliteRoutes); // No auth required for satellite API proxy

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler - catch all routes that don't match above
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.path
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 STARHAWK API Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

startServer();
