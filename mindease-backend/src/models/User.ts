import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;        
  password: string;
  anonymousName?: string;
  role: 'user' | 'therapist';
  email: string;
  name?: string;           
  fullName?: string;
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
      required: false,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    anonymousName: {
      type: String,
      required: function() {
        return this.role === 'user'; // Only required for users
      },
      sparse: true,
      trim: true,
      default: undefined,
    },
    role: {
      type: String,
      enum: ['user', 'therapist'],
      default: 'user',
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: String,           
    fullName: {
      type: String,
      required: false,
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

// Create a partial index for anonymousName - unique only for users
UserSchema.index({ anonymousName: 1 }, {
  unique: true,
  sparse: true,
  partialFilterExpression: { 
    role: 'user',
    anonymousName: { $exists: true, $ne: null }
  }
});

// Add custom validation for user roles
UserSchema.pre('save', function(next) {
  if (this.role === 'user') {
    if (!this.anonymousName || this.anonymousName.trim() === '') {
      next(new Error('Anonymous name is required for users'));
      return;
    }
  } else if (this.role === 'therapist') {
    // Therapists should not have anonymousName - explicitly set to undefined
    this.anonymousName = undefined;
    
    // Validate required therapist fields
    if (!this.fullName) {
      next(new Error('Full name is required for therapists'));
      return;
    }
    if (!this.bio) {
      next(new Error('Professional bio is required for therapists'));
      return;
    }
    if (!this.specialization) {
      next(new Error('Specialization is required for therapists'));
      return;
    }
    if (!this.licenseNumber) {
      next(new Error('License number is required for therapists'));
      return;
    }
  }
  next();
});

export default mongoose.model<IUser>('User', UserSchema);