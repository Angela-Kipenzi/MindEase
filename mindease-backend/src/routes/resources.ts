import { Router, Request, Response } from 'express';
import Resource from '../models/Resource';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all resources
router.get('/', authenticateToken, async (req: Request, res: Response) => {
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