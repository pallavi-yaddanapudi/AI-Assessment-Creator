import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IQuestion {
  _id?: string;
  text: string;
  options?: string[];
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
}

export interface ISection {
  _id?: string;
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IQuestionPaper {
  _id: string;
  assignmentId: string;
  sections: ISection[];
  createdAt: string;
  updatedAt: string;
}

export interface IAssignment {
  _id: string;
  title: string;
  dueDate: string;
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
  questionPaperId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProgressState {
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  paperId?: string;
}

interface AssignmentState {
  assignments: IAssignment[];
  currentAssignment: IAssignment | null;
  currentPaper: IQuestionPaper | null;
  loading: boolean;
  error: string | null;
  generationProgress: ProgressState | null;
}

const initialState: AssignmentState = {
  assignments: [],
  currentAssignment: null,
  currentPaper: null,
  loading: false,
  error: null,
  generationProgress: null
};

const assignmentSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    setAssignments(state, action: PayloadAction<IAssignment[]>) {
      state.assignments = action.payload;
    },
    addAssignment(state, action: PayloadAction<IAssignment>) {
      state.assignments.unshift(action.payload);
    },
    setCurrentAssignment(state, action: PayloadAction<IAssignment | null>) {
      state.currentAssignment = action.payload;
      if (action.payload === null) {
        state.generationProgress = null;
      } else if (action.payload.status === 'processing') {
        state.generationProgress = {
          progress: action.payload.progress,
          status: action.payload.status,
          message: action.payload.statusMessage,
          paperId: action.payload.questionPaperId
        };
      }
    },
    setCurrentPaper(state, action: PayloadAction<IQuestionPaper | null>) {
      state.currentPaper = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setGenerationProgress(state, action: PayloadAction<ProgressState | null>) {
      state.generationProgress = action.payload;
      if (state.currentAssignment && action.payload) {
        state.currentAssignment.progress = action.payload.progress;
        state.currentAssignment.status = action.payload.status;
        state.currentAssignment.statusMessage = action.payload.message;
        if (action.payload.paperId) {
          state.currentAssignment.questionPaperId = action.payload.paperId;
        }
      }
    },
    updateQuestion(
      state,
      action: PayloadAction<{ sectionIndex: number; questionIndex: number; text: string }>
    ) {
      if (state.currentPaper) {
        const { sectionIndex, questionIndex, text } = action.payload;
        if (
          state.currentPaper.sections[sectionIndex] &&
          state.currentPaper.sections[sectionIndex].questions[questionIndex]
        ) {
          state.currentPaper.sections[sectionIndex].questions[questionIndex].text = text;
        }
      }
    },
    updateSectionInstruction(
      state,
      action: PayloadAction<{ sectionIndex: number; instruction: string }>
    ) {
      if (state.currentPaper) {
        const { sectionIndex, instruction } = action.payload;
        if (state.currentPaper.sections[sectionIndex]) {
          state.currentPaper.sections[sectionIndex].instruction = instruction;
        }
      }
    }
  }
});

export const {
  setAssignments,
  addAssignment,
  setCurrentAssignment,
  setCurrentPaper,
  setLoading,
  setError,
  setGenerationProgress,
  updateQuestion,
  updateSectionInstruction
} = assignmentSlice.actions;

export default assignmentSlice.reducer;
