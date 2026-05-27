import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  text: string;
  options?: string[];
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IQuestionPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  sections: ISection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignment extends Document {
  title: string;
  dueDate: Date;
  questionTypes: string[];
  numQuestions: number;
  marksPerQuestion: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  additionalInstructions?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  statusMessage: string;
  fileUrl?: string;
  fileName?: string;
  questionPaperId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  options: [{ type: String }],
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true }
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema]
});

const QuestionPaperSchema = new Schema<IQuestionPaper>({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  sections: [SectionSchema]
}, { timestamps: true });

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  dueDate: { type: Date, required: true },
  questionTypes: [{ type: String, required: true }],
  numQuestions: { type: Number, required: true },
  marksPerQuestion: { type: Number, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], required: true },
  additionalInstructions: { type: String },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  progress: { type: Number, default: 0 },
  statusMessage: { type: String, default: 'Assignment queued' },
  fileUrl: { type: String },
  fileName: { type: String },
  questionPaperId: { type: Schema.Types.ObjectId, ref: 'QuestionPaper' }
}, { timestamps: true });

export const QuestionPaper = mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
