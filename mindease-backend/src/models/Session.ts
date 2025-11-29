import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  therapistId: mongoose.Types.ObjectId;
  therapistName: string;
  therapistInitials: string;
  
  // User data fields for therapist display
  userAnonymousName: string;
  userInitials: string;
  
  date: string;
  time: string;
  sessionType: 'chat' | 'audio';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  rating?: number;
  duration?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
    },
    therapistName: {
      type: String,
      required: true,
    },
    therapistInitials: {
      type: String,
      required: true,
    },
    
    // User data fields
    userAnonymousName: {
      type: String,
      required: true,
    },
    userInitials: {
      type: String,
      required: true,
    },
    
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    sessionType: {
      type: String,
      enum: ['chat', 'audio'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'confirmed',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    duration: {
      type: String,
      default: '50 minutes',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to check if session is in the past
SessionSchema.methods.isPastSession = function(): boolean {
  const now = new Date();
  try {
    // Parse the session time (format: "HH:MM AM/PM")
    const [timePart, modifier] = this.time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    // Convert to 24-hour format
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const sessionDate = new Date(this.date);
    sessionDate.setHours(hours, minutes, 0, 0);
    
    return sessionDate < now;
  } catch (error) {
    console.error('Error parsing session time:', error);
    return true; // If we can't parse, assume it's past
  }
};

// Helper method to check if session can be joined
SessionSchema.methods.canJoinSession = function(): boolean {
  if (this.status !== 'confirmed') return false;
  
  const now = new Date();
  try {
    // Parse the session time
    const [timePart, modifier] = this.time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    // Convert to 24-hour format
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const sessionDateTime = new Date(this.date);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    
    // Allow joining 15 minutes before session start and up to session end (50 minutes)
    const fifteenMinutesBefore = new Date(sessionDateTime.getTime() - 15 * 60 * 1000);
    const sessionEnd = new Date(sessionDateTime.getTime() + 50 * 60 * 1000);
    
    return now >= fifteenMinutesBefore && now <= sessionEnd;
  } catch (error) {
    console.error('Error checking session joinability:', error);
    return false;
  }
};

// Index for better query performance
SessionSchema.index({ userId: 1, date: 1 });
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ therapistId: 1, date: 1 });

export default mongoose.model<ISession>('Session', SessionSchema);