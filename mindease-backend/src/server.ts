import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from './config/database';
import { setupSocketHandlers } from './socket/socketHandlers';

// Routes
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import therapistRoutes from './routes/therapists';
import moodRoutes from './routes/mood';
import journalRoutes from './routes/journal';
import messageRoutes from './routes/messages';
import exerciseRoutes from './routes/exercises';
import resourceRoutes from './routes/resources';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// Dynamic CORS configuration
const isDevelopment = process.env.NODE_ENV === 'development';

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow all origins in development
    if (isDevelopment) {
      console.log(`Development: Allowing CORS for origin: ${origin}`);
      return callback(null, true);
    }
    
    // In production, use configured origins
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : [];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

const io = new SocketIOServer(httpServer, {
  cors: corsOptions
});

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes - FIXED: Remove the problematic app.options('*')
// The cors middleware already handles OPTIONS requests automatically

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/resources', resourceRoutes);

// Backend running check
app.get('/', (req, res) => {
  res.send('MindEase backend is running...');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MindEase API is running',
    environment: process.env.NODE_ENV || 'development',
    cors: isDevelopment ? 'development (all origins allowed)' : 'production (restricted)'
  });
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

connectDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: Access via your machine's IP address`);
    console.log(`CORS: ${isDevelopment ? 'Development mode - All origins allowed' : 'Production mode - Restricted origins'}`);
    console.log(`Socket.io is ready for real-time connections`);
  });
});