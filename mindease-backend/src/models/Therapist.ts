import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITherapist extends Document {
  userId: Types.ObjectId;
  name: string;
  realName: string;
  initials: string;
  specialty: string[];
  rating: number;
  reviews: number;
  availability: string;
  about: string;
  bio?: string;
  credentials: string;
  color: string;
  weeklyAvailability: Array<{
    dayOfWeek: string;
    timeSlots: string[];
  }>;
  isVerified: boolean;
  isAvailable: boolean;
  experience: number;
  languages: string[];
  hourlyRate: number;
  totalSessions: number;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TherapistSchema = new Schema<ITherapist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    realName: {
      type: String,
      required: true,
    },
    initials: {
      type: String,
      required: true,
    },
    specialty: [{
      type: String,
    }],
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    availability: {
      type: String,
      default: 'Available',
    },
    about: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    credentials: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    weeklyAvailability: [{
      dayOfWeek: String,
      timeSlots: [String],
    }],
    isVerified: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    experience: {
      type: Number,
      default: 0,
    },
    languages: {
      type: [String],
      default: ['English'],
      required: true,
    },
    hourlyRate: {
      type: Number,
      default: 150,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    email: String,
    phone: String,
    licenseNumber: String,
    specialization: String,
    yearsOfExperience: Number,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITherapist>('Therapist', TherapistSchema);