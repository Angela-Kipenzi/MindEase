import { Router, Request, Response } from 'express';
import Message from '../models/Message';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get messages for a session
router.get('/:sessionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const messages = await Message.find({ sessionId: req.params.sessionId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message (typically done via Socket.io, but API fallback)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const message = await Message.create({
      ...req.body,
      senderId: req.user!._id,
      senderType: req.user!.role,
    });
    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;