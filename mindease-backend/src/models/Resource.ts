import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
  title: string;
  description: string;
  category: string;
  url?: string;
  content?: string;
  type: 'article' | 'video' | 'podcast' | 'guide';
  createdAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    url: String,
    content: String,
    type: {
      type: String,
      enum: ['article', 'video', 'podcast', 'guide'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IResource>('Resource', ResourceSchema);
