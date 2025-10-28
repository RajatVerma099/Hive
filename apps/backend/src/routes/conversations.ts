import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Get all public conversations for discovery (doesn't require being a participant)
router.get('/public', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        visibility: 'PUBLIC',
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatar: true
          }
        },
        participants: {
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
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
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
        },
        _count: {
          select: {
            participants: true,
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching public conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all conversations for the authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: req.user!.id
          }
        },
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatar: true
          }
        },
        participants: {
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
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
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
        },
        _count: {
          select: {
            participants: true,
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a conversation - MUST be before /:id route
router.get('/:conversationId/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { conversationId } = req.params;
    const { limit, offset } = req.query;

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

    const messages = await prisma.message.findMany({
      where: {
        conversationId
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
      },
      orderBy: {
        createdAt: 'asc'
      },
      ...(limit && { take: parseInt(limit as string) }),
      ...(offset && parseInt(offset as string) > 0 && { skip: parseInt(offset as string) })
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific conversation by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId: req.user!.id
          }
        },
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatar: true
          }
        },
        participants: {
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
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            participants: true,
            messages: true
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new conversation
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, topics, visibility, participantIds } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Conversation name is required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Conversation name must be at least 2 characters long' });
    }

    // Validate topics array
    if (topics && !Array.isArray(topics)) {
      return res.status(400).json({ error: 'Topics must be an array' });
    }

    // Validate visibility
    const validVisibilities = ['PUBLIC', 'PRIVATE', 'UNLISTED'];
    if (visibility && !validVisibilities.includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value' });
    }

    // Create conversation with participants
    const conversation = await prisma.conversation.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        topics: topics || [],
        visibility: visibility || 'PUBLIC',
        creatorId: req.user!.id,
        participants: {
          create: [
            // Add creator as HOST
            {
              userId: req.user!.id,
              role: 'HOST'
            },
            // Add other participants as CONVERSER
            ...(participantIds || []).map((id: string) => ({
              userId: id,
              role: 'CONVERSER'
            }))
          ]
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatar: true
          }
        },
        participants: {
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
        },
        _count: {
          select: {
            participants: true,
            messages: true
          }
        }
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update conversation
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, topics, visibility } = req.body;

    // Check if user is the creator or has permission to update
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        id,
        creatorId: req.user!.id,
        isActive: true
      }
    });

    if (!existingConversation) {
      return res.status(404).json({ error: 'Conversation not found or you do not have permission to update it' });
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Conversation name cannot be empty' });
      }
      if (name.trim().length < 2) {
        return res.status(400).json({ error: 'Conversation name must be at least 2 characters long' });
      }
    }

    // Validate topics if provided
    if (topics !== undefined && !Array.isArray(topics)) {
      return res.status(400).json({ error: 'Topics must be an array' });
    }

    // Validate visibility if provided
    if (visibility !== undefined) {
      const validVisibilities = ['PUBLIC', 'PRIVATE', 'UNLISTED'];
      if (!validVisibilities.includes(visibility)) {
        return res.status(400).json({ error: 'Invalid visibility value' });
      }
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(topics && { topics }),
        ...(visibility && { visibility })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatar: true
          }
        },
        participants: {
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
        },
        _count: {
          select: {
            participants: true,
            messages: true
          }
        }
      }
    });

    res.json(updatedConversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete conversation (soft delete by setting isActive to false)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user is the creator
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        id,
        creatorId: req.user!.id,
        isActive: true
      }
    });

    if (!existingConversation) {
      return res.status(404).json({ error: 'Conversation not found or you do not have permission to delete it' });
    }

    // Soft delete by setting isActive to false
    await prisma.conversation.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join conversation
router.post('/:id/join', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if conversation exists and is active
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        isActive: true,
        visibility: 'PUBLIC' // Only public conversations can be joined
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or not joinable' });
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: req.user!.id
      }
    });

    if (existingParticipant) {
      return res.status(409).json({ error: 'You are already a participant in this conversation' });
    }

    // Add user as participant
    await prisma.conversationParticipant.create({
      data: {
        conversationId: id,
        userId: req.user!.id,
        role: 'CONVERSER'
      }
    });

    res.json({ message: 'Successfully joined conversation' });
  } catch (error) {
    console.error('Error joining conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave conversation
router.post('/:id/leave', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: req.user!.id
      }
    });

    if (!participant) {
      return res.status(404).json({ error: 'You are not a participant in this conversation' });
    }

    // Remove user from conversation
    await prisma.conversationParticipant.delete({
      where: {
        id: participant.id
      }
    });

    res.json({ message: 'Successfully left conversation' });
  } catch (error) {
    console.error('Error leaving conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


