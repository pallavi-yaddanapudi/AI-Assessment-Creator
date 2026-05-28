import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { connectDB } from './config/db';
import { initSocket } from './sockets/socket';
import assignmentRoutes from './routes/assignment.routes';

const app = express();
const server = createServer(app);

// Configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-assessment-creator';

// Express Middlewares
app.use(cors({
  origin: '*', // Allow all origins for simplicity in local setups
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files (Optional static mapping)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes mapping
app.use('/api/assignments', assignmentRoutes);

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Express global error:', err.message);
  res.status(500).json({ error: err.message || 'Something went wrong' });
});

// Startup Sequence
const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB(MONGODB_URI);

    // 2. Initialize WebSockets
    initSocket(server);
    console.log('WebSocket system initialized.');

    // 3. (BullMQ background generation worker removed - now running in-process)

    // 4. Start HTTP Server
    server.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
