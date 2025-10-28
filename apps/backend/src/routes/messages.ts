import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Send a message to a conversation
router.post('/conversations/:conversationId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { conversationId } = req.params;
    const { content, replyToId } = req.body;

    // Validate required fields
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({ error: 'Message content is too long (max 2000 characters)' });
    }

    // Check if user is a participant in the conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: req.user!.id
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    // Check if conversation exists and is active
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        isActive: true
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Validate replyToId if provided
    if (replyToId) {
      const replyToMessage = await prisma.message.findFirst({
        where: {
          id: replyToId,
          conversationId
        }
      });

      if (!replyToMessage) {
        return res.status(400).json({ error: 'Reply message not found' });
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        conversationId,
        userId: req.user!.id,
        replyToId: replyToId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatar: true
          }
        },
        replyTo: {
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
        }
      }
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;