import express, { Response } from 'express';
import mongoose from 'mongoose';
import Session from '../models/Session';
import Therapist from '../models/Therapist';
import { authenticateToken, AuthRequest, authorizeRole } from '../middleware/auth';

const router = express.Router();

// Validation function for session date/time
const validateSessionDateTime = (date: string, time: string): { isValid: boolean; message?: string } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sessionDate = new Date(date);
  
  // If session date is in the past, it's invalid
  if (sessionDate < today) {
    return { 
      isValid: false, 
      message: 'Cannot book session in the past. Please select a future date.' 
    };
  }
  
  // If session date is today, check if time is in the future
  if (sessionDate.toDateString() === today.toDateString()) {
    const [timeStr, modifier] = time.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);
    
    // Convert to 24-hour format
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    
    if (sessionDateTime <= now) {
      return { 
        isValid: false, 
        message: 'Cannot book session in the past. Please select a future time.' 
      };
    }
  }
  
  return { isValid: true };
};

// Get all sessions for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await Session.find({ userId: req.user!._id }).sort({ date: -1 });
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming sessions for user
router.get('/upcoming', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sessions = await Session.find({
      userId: req.user!._id,
      date: { $gte: today.toISOString().split('T')[0] },
      status: { $in: ['pending', 'confirmed'] },
    }).sort({ date: 1, time: 1 });
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get joinable sessions for user
router.get('/joinable', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all confirmed sessions that are today or future
    const sessions = await Session.find({
      userId: req.user!._id,
      status: 'confirmed',
      $or: [
        { date: { $gt: today } },
        { date: today }
      ]
    }).sort({ date: 1, time: 1 });
    
    // Filter sessions that can be joined using the model method
    const joinableSessions = sessions.filter(session => {
      const canJoin = (session as any).canJoinSession();
      return canJoin === true; // Explicitly check for true to avoid null/undefined
    });
    
    res.json(joinableSessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get past sessions for user
router.get('/past', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get sessions that are either completed OR in the past (even if still confirmed)
    const sessions = await Session.find({
      userId: req.user!._id,
      $or: [
        { status: 'completed' },
        { 
          status: { $in: ['confirmed', 'pending'] },
          date: { $lt: today }
        }
      ]
    }).sort({ date: -1 });
    
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get therapist's past sessions
router.get('/therapist/past', 
  authenticateToken, 
  authorizeRole('therapist'),
  async (req: AuthRequest, res: Response) => {
  try {
    const therapist = await Therapist.findOne({ userId: req.user!._id });
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist profile not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    const sessions = await Session.find({
      therapistId: (therapist as any)._id,
      $or: [
        { status: 'completed' },
        { 
          status: { $in: ['confirmed', 'pending'] },
          date: { $lt: today }
        }
      ]
    }).sort({ date: -1 });
    
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
// Get joinable sessions for therapist
router.get('/therapist/joinable', 
  authenticateToken, 
  authorizeRole('therapist'),
  async (req: AuthRequest, res: Response) => {
  try {
    const therapist = await Therapist.findOne({ userId: req.user!._id });
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist profile not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Get all confirmed sessions that are today or future
    const sessions = await Session.find({
      therapistId: (therapist as any)._id,
      status: 'confirmed',
      $or: [
        { date: { $gt: today } },
        { date: today }
      ]
    }).sort({ date: 1, time: 1 });
    
    // Filter sessions that can be joined using the model method
    const joinableSessions = sessions.filter(session => {
      const canJoin = (session as any).canJoinSession();
      return canJoin === true; // Explicitly check for true to avoid null/undefined
    });
    
    res.json(joinableSessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all therapist sessions
router.get('/therapist/sessions', 
  authenticateToken, 
  authorizeRole('therapist'),
  async (req: AuthRequest, res: Response) => {
  try {
    const therapist = await Therapist.findOne({ userId: req.user!._id });
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist profile not found' });
    }

    const sessions = await Session.find({
      therapistId: (therapist as any)._id,
    }).sort({ date: -1 });
    
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Check if session can be joined
router.get('/:id/can-join', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Check if user owns this session or is the therapist
    const isOwner = session.userId.toString() === req.user!._id.toString();
    let isTherapist = false;
    
    if (req.user!.role === 'therapist') {
      const therapist = await Therapist.findOne({ userId: req.user!._id });
      isTherapist = !!therapist && session.therapistId.toString() === (therapist as any)._id.toString();


    }
    
    if (!isOwner && !isTherapist) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const canJoin = (session as any).canJoinSession();
    
    res.json({
      canJoin: canJoin === true, // Ensure boolean value
      reason: canJoin ? 'Session is joinable' : 'Session cannot be joined (may be in the past, not yet started, or already ended)',
      sessionTime: `${session.date} ${session.time}`,
      currentTime: new Date().toISOString(),
      status: session.status
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create session
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { date, time, therapistId, therapistName, therapistInitials, sessionType } = req.body;
    
    console.log('=== SESSION CREATION DEBUG ===');
    console.log('Received date from frontend:', date);
    console.log('Received time from frontend:', time);
    console.log('User making request:', req.user);
    console.log('Therapist ID received:', therapistId);
    console.log('=== END DEBUG ===');
    
    // Validate required fields
    if (!date || !time || !therapistId || !therapistName || !therapistInitials || !sessionType) {
      return res.status(400).json({ 
        message: 'Missing required fields: date, time, therapistId, therapistName, therapistInitials, sessionType' 
      });
    }
    
    // Validate session date/time
    const validation = validateSessionDateTime(date, time);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: validation.message 
      });
    }

    // Check for conflicting sessions
    const existingSession = await Session.findOne({
      userId: req.user!._id,
      date,
      time,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingSession) {
      return res.status(409).json({
        message: 'You already have a session booked at this date and time. Please choose a different time.'
      });
    }

    // Generate user initials from anonymous name
    const userAnonymousName = req.user!.anonymousName || 'Anonymous User';
    const userInitials = userAnonymousName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Create the session with COMPLETE user data
    const sessionData = {
      date,
      time,
      therapistId: new mongoose.Types.ObjectId(therapistId),
      therapistName,
      therapistInitials,
      sessionType,
      userId: req.user!._id,
      userAnonymousName,
      userInitials,
      status: 'confirmed',
      duration: '50 minutes'
    };

    console.log('Creating session with data:', sessionData);

    const session = await Session.create(sessionData);

    console.log('Session created successfully:', {
      id: session._id,
      userAnonymousName: session.userAnonymousName,
      therapistName: session.therapistName
    });

    res.status(201).json({
      _id: session._id,
      therapistId: session.therapistId,
      therapistName: session.therapistName,
      therapistInitials: session.therapistInitials,
      userAnonymousName: session.userAnonymousName,
      userInitials: session.userInitials,
      date: session.date,
      time: session.time,
      sessionType: session.sessionType,
      status: session.status,
      duration: session.duration,
      createdAt: session.createdAt
    });
  } catch (error: any) {
    console.error('Session creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update session
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { date, time } = req.body;
    
    if (date && time) {
      const validation = validateSessionDateTime(date, time);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: validation.message 
        });
      }
    }

    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      req.body,
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete session
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { status: 'cancelled' },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json({ message: 'Session cancelled' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Rate session
router.post('/:id/rate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { rating },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Auto-complete past sessions (cron job endpoint)
router.post('/auto-complete-past', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const result = await Session.updateMany(
      {
        status: 'confirmed',
        $expr: {
          $lt: [
            {
              $dateFromString: {
                dateString: {
                  $concat: [
                    '$date', 
                    'T', 
                    {
                      $switch: {
                        branches: [
                          {
                            case: { $regexMatch: { input: '$time', regex: /AM|PM/ } },
                            then: '$time'
                          }
                        ],
                        default: { $concat: ['$time', ' AM'] }
                      }
                    }
                  ]
                },
                format: '%Y-%m-%dT%h:%M %p'
              }
            },
            new Date(now.getTime() - 60 * 60 * 1000) // Sessions that ended more than 1 hour ago
          ]
        }
      },
      { 
        $set: { 
          status: 'completed',
          updatedAt: now
        } 
      }
    );
    
    res.json({
      message: `Auto-completed ${result.modifiedCount} past sessions`,
      completedCount: result.modifiedCount
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;