import { Router, Request, Response } from 'express';
import Exercise from '../models/Exercise';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all exercises
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const exercises = await Exercise.find(query);
    res.json(exercises);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;