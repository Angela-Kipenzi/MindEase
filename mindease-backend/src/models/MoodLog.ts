import mongoose, { Schema, Document } from 'mongoose';

export interface IMoodLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;
  mood: 'Great' | 'Good' | 'Okay' | 'Not Great' | 'Bad';
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const MoodLogSchema = new Schema<IMoodLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      enum: ['Great', 'Good', 'Okay', 'Not Great', 'Bad'],
      required: true,
    },
    note: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance - one entry per user per day
MoodLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IMoodLog>('MoodLog', MoodLogSchema);