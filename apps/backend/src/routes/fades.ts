import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Get all public fades for discovery (doesn't require being a participant)
router.get('/public', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const fades = await prisma.fade.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date() // Only show non-expired fades
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(fades);
  } catch (error) {
    console.error('Error fetching public fades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all fades for the authenticated user
// This must come after /public route
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const fades = await prisma.fade.findMany({
      where: {
        participants: {
          some: {
            userId: req.user!.id
          }
        },
        isActive: true,
        expiresAt: {
          gt: new Date() // Only show non-expired fades
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
        createdAt: 'desc'
      }
    });

    res.json(fades);
  } catch (error) {
    console.error('Error fetching fades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific fade by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const fade = await prisma.fade.findFirst({
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

    if (!fade) {
      return res.status(404).json({ error: 'Fade not found' });
    }

    res.json(fade);
  } catch (error) {
    console.error('Error fetching fade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new fade
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, topics, expiresAt } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Fade name is required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Fade name must be at least 2 characters long' });
    }

    if (!expiresAt) {
      return res.status(400).json({ error: 'Expiry date is required' });
    }

    // Validate expiry date
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (expiryDate <= now) {
      return res.status(400).json({ error: 'Expiry date must be in the future' });
    }

    if (expiryDate > oneWeekFromNow) {
      return res.status(400).json({ error: 'Expiry date cannot be more than 1 week from now' });
    }

    // Validate topics array
    if (topics && !Array.isArray(topics)) {
      return res.status(400).json({ error: 'Topics must be an array' });
    }

    // Create fade with participants
    const fade = await prisma.fade.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        topics: topics || [],
        expiresAt: expiryDate,
        creatorId: req.user!.id,
        participants: {
          create: {
            userId: req.user!.id,
            role: 'HOST'
          }
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

    res.status(201).json(fade);
  } catch (error) {
    console.error('Error creating fade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update fade
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, topics } = req.body;

    // Check if user is the creator
    const existingFade = await prisma.fade.findFirst({
      where: {
        id,
        creatorId: req.user!.id,
        isActive: true
      }
    });

    if (!existingFade) {
      return res.status(404).json({ error: 'Fade not found or you do not have permission to update it' });
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Fade name cannot be empty' });
      }
      if (name.trim().length < 2) {
        return res.status(400).json({ error: 'Fade name must be at least 2 characters long' });
      }
    }

    // Validate topics if provided
    if (topics !== undefined && !Array.isArray(topics)) {
      return res.status(400).json({ error: 'Topics must be an array' });
    }

    const updatedFade = await prisma.fade.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(topics && { topics })
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

    res.json(updatedFade);
  } catch (error) {
    console.error('Error updating fade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete fade (soft delete by setting isActive to false)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user is the creator
    const existingFade = await prisma.fade.findFirst({
      where: {
        id,
        creatorId: req.user!.id,
        isActive: true
      }
    });

    if (!existingFade) {
      return res.status(404).json({ error: 'Fade not found or you do not have permission to delete it' });
    }

    // Soft delete by setting isActive to false
    await prisma.fade.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Fade deleted successfully' });
  } catch (error) {
    console.error('Error deleting fade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join fade
router.post('/:id/join', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if fade exists and is active
    const fade = await prisma.fade.findFirst({
      where: {
        id,
        isActive: true,
        expiresAt: {
          gt: new Date() // Only allow joining non-expired fades
        }
      }
    });

    if (!fade) {
      return res.status(404).json({ error: 'Fade not found or has expired' });
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.fadeParticipant.findFirst({
      where: {
        fadeId: id,
        userId: req.user!.id
      }
    });

    if (existingParticipant) {
      return res.status(409).json({ error: 'You are already a participant in this fade' });
    }

    // Add user as participant
    await prisma.fadeParticipant.create({
      data: {
        fadeId: id,
        userId: req.user!.id,
        role: 'CONVERSER'
      }
    });

    res.json({ message: 'Successfully joined fade' });
  } catch (error) {
    console.error('Error joining fade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave fade
router.post('/:id/leave', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user is a participant
    const participant = await prisma.fadeParticipant.findFirst({
      where: {
        fadeId: id,
        userId: req.user!.id
      }
    });

    if (!participant) {
      return res.status(404).json({ error: 'You are not a participant in this fade' });
    }

    // Remove user from fade
    await prisma.fadeParticipant.delete({
      where: {
        id: participant.id
      }
    });

    res.json({ message: 'Successfully left fade' });
  } catch (error) {
    console.error('Error leaving fade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


