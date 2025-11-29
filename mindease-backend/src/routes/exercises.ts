import express, { Response } from 'express';
import Exercise from '../models/Exercise';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all exercises
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
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