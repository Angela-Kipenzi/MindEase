import express, { Application, Request, Response, NextFunction } from 'express';
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

//  CORS CONFIGURATION 
const isDevelopment = process.env.NODE_ENV === 'development';

// Define allowed origins for different environments
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Always allow localhost for development
  origins.push('http://localhost:3000');
  origins.push('http://localhost:5173'); // Vite default
  
  // Add environment-specific origins
  if (isDevelopment) {
    // Add development origins from environment variable
    if (process.env.CORS_ORIGIN) {
      origins.push(process.env.CORS_ORIGIN);
    }
  } else {
    // Production: Add your Render frontend URL
    if (process.env.FRONTEND_URL) {
      origins.push(process.env.FRONTEND_URL);
    }
    
    // Also add CORS_ORIGIN if provided (for production)
    if (process.env.CORS_ORIGIN) {
      origins.push(process.env.CORS_ORIGIN);
    }
  }
  
  // Remove duplicates and return
  return [...new Set(origins)];
};

const corsOptions: cors.CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) {
      console.log('No origin provided, allowing request');
      return callback(null, true);
    }
    
    // Allow all origins in development (for easier testing)
    if (isDevelopment) {
      console.log(`Development: Allowing CORS for origin: ${origin}`);
      return callback(null, true);
    }
    
    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Exact match
      if (origin === allowedOrigin) return true;
      
      // Handle subdomain variations
      if (origin.startsWith(allowedOrigin)) return true;
      
      // Handle HTTP to HTTPS redirect
      if (allowedOrigin.startsWith('https://') && origin === allowedOrigin.replace('https://', 'http://')) {
        return true;
      }
      
      // Handle localhost with different ports
      if (allowedOrigin.includes('localhost') && origin.includes('localhost')) {
        return true;
      }
      
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked for origin: ${origin}`);
      console.log(`Allowed origins: ${JSON.stringify(allowedOrigins)}`);
      callback(new Error(`Not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

const io = new SocketIOServer(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Apply CORS middleware
app.use(cors(corsOptions));

//  MIDDLEWARE 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin || 'No origin');
  console.log('User-Agent:', req.headers['user-agent']?.substring(0, 50) + '...');
  next();
});

//  ROUTES 
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/resources', resourceRoutes);

//  HEALTH & DEBUG ENDPOINTS 

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <html>
      <head><title>MindEase Backend</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>MindEase Backend is Running!</h1>
        <p>Environment: <strong>${process.env.NODE_ENV || 'development'}</strong></p>
        <p>API Base URL: <code>/api</code></p>
        <p>Test endpoints:</p>
        <ul>
          <li><a href="/api/health">/api/health</a> - Health check</li>
          <li><a href="/api/debug">/api/debug</a> - Debug info</li>
          <li><a href="/api/test">/api/test</a> - Test endpoint</li>
        </ul>
        <p>Allowed CORS Origins:</p>
        <pre>${JSON.stringify(getAllowedOrigins(), null, 2)}</pre>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'MindEase API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    service: 'MindEase Backend API'
  });
});

// Debug endpoint
app.get('/api/debug', (req: Request, res: Response) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: getAllowedOrigins(),
    frontendUrl: process.env.FRONTEND_URL || 'Not set',
    corsOrigin: process.env.CORS_ORIGIN || 'Not set',
    nodeEnv: process.env.NODE_ENV || 'Not set',
    request: {
      origin: req.headers.origin,
      host: req.headers.host,
      ip: req.ip,
      method: req.method,
      url: req.url
    },
    server: {
      port: process.env.PORT || 5000,
      time: new Date().toISOString()
    }
  });
});

// Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'Test endpoint is working!',
    status: 'success',
    timestamp: new Date().toISOString(),
    note: 'If you can see this, the backend is accessible'
  });
});

// Test POST endpoint (for login testing)
app.post('/api/test/login', (req: Request, res: Response) => {
  console.log('Test login request body:', req.body);
  res.json({ 
    message: 'Test login endpoint is accessible!',
    receivedData: req.body,
    timestamp: new Date().toISOString(),
    note: 'This is just a test endpoint'
  });
});

//  ERROR HANDLING 

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/' || req.path.startsWith('/api/')) {
    // If it's an API route we didn't catch, return 404
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method,
      availableRoutes: [
        '/api/auth/*',
        '/api/sessions/*',
        '/api/therapists/*',
        '/api/mood/*',
        '/api/journal/*',
        '/api/messages/*',
        '/api/exercises/*',
        '/api/resources/*',
        '/api/health',
        '/api/debug',
        '/api/test'
      ]
    });
  } else {
    // For non-API routes, send simple message
    res.status(404).send('404 - Not Found');
  }
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

//  SOCKET.IO SETUP 
setupSocketHandlers(io);

//  SERVER STARTUP 
const PORT = process.env.PORT || 5000;

connectDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(' MindEase Backend Server Started');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://0.0.0.0:${PORT}`);
    console.log(`CORS Origins: ${JSON.stringify(getAllowedOrigins())}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
    console.log(`CORS Origin: ${process.env.CORS_ORIGIN || 'Not configured'}`);
    console.log('API Endpoints:');
    console.log(` Health: http://localhost:${PORT}/api/health`);
    console.log(`Debug: http://localhost:${PORT}/api/debug`);
    console.log(`Test: http://localhost:${PORT}/api/test`);
    console.log('Socket.io is ready for real-time connections');
    
  });
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});