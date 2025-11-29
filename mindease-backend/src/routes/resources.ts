import express, { Response } from 'express';
import Resource from '../models/Resource';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all resources
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const resources = await Resource.find(query);
    res.json(resources);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;