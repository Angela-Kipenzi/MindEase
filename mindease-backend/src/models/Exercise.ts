import mongoose, { Schema, Document } from 'mongoose';

export interface IExercise extends Document {
  title: string;
  description: string;
  duration: string;
  category: string;
  instructions: string[];
  benefits: string[];
  createdAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    instructions: [{
      type: String,
    }],
    benefits: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IExercise>('Exercise', ExerciseSchema);
