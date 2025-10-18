import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Vently Backend is running!' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join conversation room
  socket.on('join-conversation', async (conversationId: string) => {
    try {
      // Verify user has access to conversation
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId: socket.data.userId // This would be set during authentication
        }
      });

      if (participant) {
        socket.join(`conversation-${conversationId}`);
        socket.emit('joined-conversation', conversationId);
        console.log(`User ${socket.id} joined conversation ${conversationId}`);
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
    console.log(`User ${socket.id} left conversation ${conversationId}`);
  });

  // Handle new message
  socket.on('send-message', async (data: {
    conversationId: string;
    content: string;
    userId: string;
  }) => {
    try {
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
    socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Vently Backend running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for real-time connections`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export { app, io, prisma };
