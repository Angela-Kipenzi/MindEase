import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import Therapist from '../models/Therapist';

const router = express.Router();

// Generate JWT token with consistent user data
const generateToken = (user: IUser): string => {
  const payload = {
    userId: user._id,
    username: user.username,
    anonymousName: user.anonymousName,
    role: user.role,
    email: user.email,
    name: user.name,
    fullName: user.fullName
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// Helper function to get consistent user response
const getUserResponse = (user: IUser) => ({
  id: String(user._id),
  username: user.username,
  anonymousName: user.anonymousName,
  role: user.role,
  email: user.email,
  name: user.name,
  fullName: user.fullName,
  bio: user.bio,
  specialization: user.specialization,
  yearsOfExperience: user.yearsOfExperience,
  isVerified: user.isVerified,
});

// Check if anonymous name is available (for users only)
router.post('/check-anonymous-name', async (req: Request, res: Response) => {
  try {
    const { anonymousName } = req.body;

    if (!anonymousName || anonymousName.trim() === '') {
      return res.status(400).json({ 
        available: false, 
        message: 'Anonymous name is required' 
      });
    }

    // Check if name is already taken
    const existingUser = await User.findOne({ anonymousName });
    
    if (existingUser) {
      return res.json({ 
        available: false, 
        message: 'This anonymous name is already taken. Please choose another one.' 
      });
    }

    res.json({ 
      available: true, 
      message: 'This anonymous name is available!' 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email (username field now contains email)
    const user = await User.findOne({ 
      email: username.toLowerCase().trim(),
      role: role || { $in: ['user', 'therapist'] }
    }) as IUser | null;
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Generate token with consistent data
    const token = generateToken(user);

    console.log('User logged in successfully:', {
      id: user._id,
      email: user.email,
      anonymousName: user.anonymousName,
      role: user.role
    });

    res.json({
      token,
      user: getUserResponse(user),
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Signup route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      password, 
      role, 
      credentials, 
      fullName,       
      phone, 
      licenseNumber, 
      specialization, 
      yearsOfExperience,
      bio,
      languages,
      anonymousName
    } = req.body;
    
    console.log('Signup request:', { email, role, anonymousName });

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    //  Anonymous name required for users
    if (role === 'user') {
      if (!anonymousName || anonymousName.trim() === '') {
        return res.status(400).json({ message: 'Please choose an anonymous name' });
      }

      // Check if anonymous name is already taken
      const existingAnonymousName = await User.findOne({ 
        anonymousName: anonymousName.trim() 
      });
      if (existingAnonymousName) {
        return res.status(400).json({ message: 'This anonymous name is already taken. Please choose another one.' });
      }
    }

    // THERAPIST-SPECIFIC: Validation
    if (role === 'therapist') {
      if (!fullName || fullName.trim() === '') {
        return res.status(400).json({ message: 'Full name is required for therapists' });
      }
      if (!bio || bio.trim() === '') {
        return res.status(400).json({ message: 'Professional bio is required for therapists' });
      }
      if (!languages || !Array.isArray(languages) || languages.length === 0) {
        return res.status(400).json({ message: 'Please select at least one language' });
      }
      if (!specialization || specialization.trim() === '') {
        return res.status(400).json({ message: 'Specialization is required for therapists' });
      }
      if (!licenseNumber || licenseNumber.trim() === '') {
        return res.status(400).json({ message: 'License number is required for therapists' });
      }
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim()
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with appropriate fields
    const userData: any = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'user',
    };

    // USER-SPECIFIC: Add user-provided anonymous name
    if (role === 'user' && anonymousName) {
      userData.anonymousName = anonymousName.trim();
      userData.username = `user_${Date.now()}`;
    }

   
    //No anonymousName for therapists
    if (role === 'therapist') {
      userData.fullName = fullName.trim();
      userData.username = email.toLowerCase().trim();
      userData.bio = bio.trim();
      userData.specialization = specialization.trim();
      userData.licenseNumber = licenseNumber.trim();
      userData.anonymousName = undefined; // Explicitly set to undefined
      if (yearsOfExperience) userData.yearsOfExperience = parseInt(yearsOfExperience);
      if (phone) userData.phone = phone.trim();
    }

    console.log('Creating user with data:', userData);

    const user: IUser = await User.create(userData);

    // If therapist, create therapist profile
    if (role === 'therapist') {
      const displayName = fullName || 'Professional Therapist';
      const initials = displayName
        .split(' ')
        .map((n: string) => n[0]) 
        .join('')
        .toUpperCase()
        .slice(0, 2);

      await Therapist.create({
        userId: user._id,
        name: displayName,
        realName: fullName || displayName,
        initials,
        specialty: specialization ? [specialization] : ['General Therapy'],
        credentials: credentials || `Licensed Therapist - ${specialization || 'General'}`,
        about: bio || 'Experienced therapist dedicated to helping you.',
        experience: yearsOfExperience || 0,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        email: email,
        phone: phone,
        licenseNumber: licenseNumber,
        languages: languages || ['English'],
        bio: bio,
      });
    }

    // Generate token with consistent data
    const token = generateToken(user);

    console.log('User created successfully:', {
      id: user._id,
      email: user.email,
      anonymousName: user.anonymousName,
      role: user.role
    });

    res.status(201).json({
      token,
      user: getUserResponse(user),
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'anonymousName') {
        return res.status(400).json({ message: 'Anonymous name already taken' });
      }
      if (field === 'email') {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// Get current user endpoint
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: getUserResponse(user),
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;