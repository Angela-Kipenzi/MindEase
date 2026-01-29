import { Router, Request, Response } from 'express';
import JournalEntry from '../models/JournalEntry';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all journal entries
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const entries = await JournalEntry.find({ userId: req.user!._id }).sort({ date: -1 });
    res.json(entries);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get journal entry by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    res.json(entry);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create journal entry
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const entry = await JournalEntry.create({
      ...req.body,
      userId: req.user!._id,
    });
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update journal entry
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      req.body,
      { new: true }
    );
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    res.json(entry);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete journal entry
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const entry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
    });
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    res.json({ message: 'Journal entry deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;