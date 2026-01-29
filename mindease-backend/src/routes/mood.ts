import { Router, Request, Response } from 'express';
import MoodLog from '../models/MoodLog';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all mood logs
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const query: any = { userId: req.user!._id };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const moodLogs = await MoodLog.find(query).sort({ date: -1 });
    res.json(moodLogs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update mood log for today
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date, mood, note } = req.body;
    
    // Validate required fields
    if (!date || !mood || !note) {
      return res.status(400).json({ message: 'Date, mood, and note are required' });
    }
    
    // Validate mood value
    const validMoods = ['Great', 'Good', 'Okay', 'Not Great', 'Bad'];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ message: 'Invalid mood value' });
    }
    
    // Upsert - create or update for the specific date
    const moodLog = await MoodLog.findOneAndUpdate(
      { userId: req.user!._id, date },
      { mood, note },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.status(201).json(moodLog);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Mood log for this date already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Get mood statistics
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const moodLogs = await MoodLog.find({ userId: req.user!._id });
    
    const moodValues: Record<string, number> = {
      'Great': 5,
      'Good': 4,
      'Okay': 3,
      'Not Great': 2,
      'Bad': 1,
    };
    
    const totalLogs = moodLogs.length;
    const averageMood = totalLogs > 0
      ? moodLogs.reduce((sum, log) => sum + moodValues[log.mood], 0) / totalLogs
      : 0;
    
    const moodDistribution: Record<string, number> = {};
    moodLogs.forEach(log => {
      moodDistribution[log.mood] = (moodDistribution[log.mood] || 0) + 1;
    });
    
    res.json({
      averageMood,
      totalLogs,
      moodDistribution,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;