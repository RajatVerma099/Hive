import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';

// Load environment variables
dotenv.config();

// Validate critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required');
  process.exit(1);
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_LOCAL_URL,
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.BACKEND_LOCAL_PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hive Backend is running!' });
});

// Import and use auth routes
import authRoutes from './routes/auth';
import conversationRoutes from './routes/conversations';
import messageRoutes from './routes/messages';
import fadeRoutes from './routes/fades';

app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/fades', fadeRoutes);

// Socket event handlers setup function
function setupSocketHandlers(socket: any) {
  // Join conversation room
  socket.on('join-conversation', async (conversationId: string) => {
    try {
      // Verify user has access to conversation
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId: socket.data.userId
        }
      });

      if (participant) {
        socket.join(`conversation-${conversationId}`);
        socket.emit('joined-conversation', conversationId);
        console.log(`User ${socket.data.user.email} joined conversation ${conversationId}`);
      } else {
        socket.emit('error', 'Not authorized to join this conversation');
      }
    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit('error', 'Failed to join conversation');
    }
  });

  // Leave conversation room
  socket.on('leave-conversation', (conversationId: string) => {
    socket.leave(`conversation-${conversationId}`);
    socket.emit('left-conversation', conversationId);
    console.log(`User ${socket.data.user.email} left conversation ${conversationId}`);
  });

  // Handle new message
  socket.on('send-message', async (data: {
    conversationId: string;
    content: string;
    userId: string;
  }) => {
    try {
      // Verify user is sending message for themselves
      if (data.userId !== socket.data.userId) {
        socket.emit('error', 'Unauthorized to send message');
        return;
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          content: data.content,
          conversationId: data.conversationId,
          userId: data.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      // Broadcast message to all users in the conversation
      io.to(`conversation-${data.conversationId}`).emit('new-message', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Handle typing indicator
  socket.on('typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
    // Verify user is sending typing for themselves
    if (data.userId !== socket.data.userId) {
      socket.emit('error', 'Unauthorized to send typing indicator');
      return;
    }

    socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.data.user?.email || 'unknown'} disconnected`);
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle authentication
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.log('Socket connection rejected: No token provided');
    socket.emit('error', 'Authentication required');
    socket.disconnect();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Verify user exists in database
    prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    }).then(user => {
      if (!user) {
        console.log('Socket connection rejected: User not found');
        socket.emit('error', 'User not found');
        socket.disconnect();
        return;
      }
      
      socket.data.userId = decoded.userId;
      socket.data.user = user;
      console.log('User authenticated:', user.email);
      
      // Set up socket event handlers after authentication
      setupSocketHandlers(socket);
    }).catch(error => {
      console.error('Database error during socket authentication:', error);
      socket.emit('error', 'Authentication failed');
      socket.disconnect();
    });
  } catch (error) {
    console.log('Socket connection rejected: Invalid token');
    socket.emit('error', 'Invalid token');
    socket.disconnect();
    return;
  }

});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Test database connection
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log(`🗄️  Database: Connected successfully`);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Hive Backend running on port ${PORT}`);
      console.log(`📡 Socket.io server ready for real-time connections`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_LOCAL_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export { app, io, prisma };
