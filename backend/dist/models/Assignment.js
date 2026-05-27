"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assignment = exports.QuestionPaper = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const QuestionSchema = new mongoose_1.Schema({
    text: { type: String, required: true },
    options: [{ type: String }],
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
    marks: { type: Number, required: true }
});
const SectionSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: [QuestionSchema]
});
const QuestionPaperSchema = new mongoose_1.Schema({
    assignmentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    sections: [SectionSchema]
}, { timestamps: true });
const AssignmentSchema = new mongoose_1.Schema({
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
    questionPaperId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'QuestionPaper' }
}, { timestamps: true });
exports.QuestionPaper = mongoose_1.default.model('QuestionPaper', QuestionPaperSchema);
exports.Assignment = mongoose_1.default.model('Assignment', AssignmentSchema);
