import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;        
  password: string;
  anonymousName?: string;   // Optional - only for users
  role: 'user' | 'therapist';
  email?: string;
  name?: string;           
  fullName?: string;       // For therapists (real name)
  phone?: string;
  licenseNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  isActive: boolean;
  isVerified: boolean;
  profileImage?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    anonymousName: {
      type: String,
      required: false, // Make it optional
      unique: true,
      sparse: true, // Allow null for therapists
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'therapist'],
      default: 'user',
      required: true,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    name: String,           
    fullName: {
      type: String,
      required: false, // Make it optional for now to avoid breaking existing users
      trim: true,
    },       
    phone: String,
    licenseNumber: String,
    specialization: String,
    yearsOfExperience: Number,
    bio: String,
    profileImage: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add custom validation for user roles
UserSchema.pre('save', function(next) {
  if (this.role === 'user' && !this.anonymousName) {
    next(new Error('Anonymous name is required for users'));
  } else if (this.role === 'therapist' && !this.fullName) {
    next(new Error('Full name is required for therapists'));
  } else {
    next();
  }
});

export default mongoose.model<IUser>('User', UserSchema);