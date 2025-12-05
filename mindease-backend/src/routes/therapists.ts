import express, { Response } from 'express';
import Therapist from '../models/Therapist';
import User from '../models/User';
import { authenticateToken, AuthRequest, authorizeRole } from '../middleware/auth';

const router = express.Router();

// Get therapist profile for current user
router.get('/me', 
  authenticateToken, 
  authorizeRole('therapist'),
  async (req: AuthRequest, res: Response) => {
  try {
    const therapist = await Therapist.findOne({ userId: req.user!._id })
      .populate('userId', 'fullName email bio profileImage');
    
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist profile not found' });
    }
    
    res.json(therapist);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all verified therapists for discovery
router.get('/discover', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { specialization, minRating, maxRate, language } = req.query;
    
    let query: any = { 
      isVerified: true,
      isAvailable: true 
    };

    // Add filters if provided
    if (specialization) {
      query.specialty = { $in: [specialization] };
    }
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating as string) };
    }
    if (maxRate) {
      query.hourlyRate = { $lte: parseFloat(maxRate as string) };
    }
    if (language) {
      query.languages = { $in: [language] };
    }

    const therapists = await Therapist.find(query)
      .populate('userId', 'fullName email bio profileImage isVerified')
      .sort({ rating: -1, experience: -1 })
      .select('-__v');

    // Transform data for frontend
    const transformedTherapists = therapists.map(therapist => ({
      _id: therapist._id,
      userId: therapist.userId,
      realName: therapist.realName,
      name: therapist.name,
      initials: therapist.initials,
      specialty: therapist.specialty,
      rating: therapist.rating,
      reviews: therapist.reviews,
      experience: therapist.experience,
      about: therapist.about,
      bio: therapist.bio,
      credentials: therapist.credentials,
      color: therapist.color,
      hourlyRate: therapist.hourlyRate,
      languages: therapist.languages,
      totalSessions: therapist.totalSessions,
      availability: therapist.availability,
      isVerified: therapist.isVerified,
      profileImage: (therapist.userId as any)?.profileImage,
      email: therapist.email,
      phone: therapist.phone,
      licenseNumber: therapist.licenseNumber,
      specialization: therapist.specialization,
      yearsOfExperience: therapist.yearsOfExperience
    }));

    res.json(transformedTherapists);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all therapists (for admin)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const therapists = await Therapist.find({ isVerified: true })
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(therapists);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get therapist by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const therapist = await Therapist.findById(req.params.id)
      .populate('userId', 'fullName email bio profileImage');
    
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }
    res.json(therapist);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get therapist availability
router.get('/:id/availability', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const therapist = await Therapist.findById(req.params.id);
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }
    res.json(therapist.weeklyAvailability);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update therapist availability (therapist only)
router.put('/availability', 
  authenticateToken, 
  authorizeRole('therapist'),
  async (req: AuthRequest, res: Response) => {
  try {
    const therapist = await Therapist.findOneAndUpdate(
      { userId: req.user!._id },
      { weeklyAvailability: req.body.availability },
      { new: true }
    );
    
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist profile not found' });
    }
    
    res.json({ message: 'Availability updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;