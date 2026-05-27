import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Assignment, QuestionPaper } from '../models/Assignment';
import { assessmentQueue } from '../queues/queue';
import { PDFService } from '../services/pdf.service';

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const {
      title,
      dueDate,
      questionTypes,
      numQuestions,
      marksPerQuestion,
      difficulty,
      additionalInstructions
    } = req.body;

    // --- Validation ---
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!dueDate) {
      return res.status(400).json({ error: 'Due date is required' });
    }
    if (new Date(dueDate) < new Date(new Date().setHours(0,0,0,0))) {
      return res.status(400).json({ error: 'Due date cannot be in the past' });
    }
    
    // Parse questionTypes
    let parsedTypes: string[] = [];
    if (typeof questionTypes === 'string') {
      parsedTypes = questionTypes.split(',').map(t => t.trim());
    } else if (Array.isArray(questionTypes)) {
      parsedTypes = questionTypes;
    }
    if (parsedTypes.length === 0) {
      return res.status(400).json({ error: 'At least one question type must be selected' });
    }

    const nQuestions = parseInt(numQuestions, 10);
    if (isNaN(nQuestions) || nQuestions <= 0) {
      return res.status(400).json({ error: 'Number of questions must be a positive integer' });
    }

    const marks = parseFloat(marksPerQuestion);
    if (isNaN(marks) || marks <= 0) {
      return res.status(400).json({ error: 'Marks per question must be a positive number' });
    }

    if (!['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level selected' });
    }

    // Handle uploaded file
    let fileUrl = undefined;
    let fileName = undefined;
    if (req.file) {
      fileUrl = req.file.path;
      fileName = req.file.originalname;
    }

    // --- Create Assignment ---
    const assignment = new Assignment({
      title: title.trim(),
      dueDate: new Date(dueDate),
      questionTypes: parsedTypes,
      numQuestions: nQuestions,
      marksPerQuestion: marks,
      difficulty,
      additionalInstructions: additionalInstructions?.trim() || '',
      status: 'pending',
      progress: 0,
      statusMessage: 'Queueing generation task...',
      fileUrl,
      fileName
    });

    await assignment.save();

    // --- Queue BullMQ Job ---
    await assessmentQueue.add('generate-assessment', {
      assignmentId: (assignment._id as any).toString()
    });

    return res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    return res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    return res.status(200).json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getQuestionPaper = async (req: Request, res: Response) => {
  try {
    const paper = await QuestionPaper.findOne({ assignmentId: req.params.id });
    if (!paper) {
      return res.status(404).json({ error: 'Question paper not found for this assignment' });
    }
    return res.status(200).json(paper);
  } catch (error) {
    console.error('Error fetching question paper:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateQuestionPaper = async (req: Request, res: Response) => {
  try {
    const { sections } = req.body;
    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'Sections array is required for update' });
    }

    const paper = await QuestionPaper.findOne({ assignmentId: req.params.id });
    if (!paper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }

    paper.sections = sections;
    await paper.save();

    return res.status(200).json(paper);
  } catch (error) {
    console.error('Error updating question paper:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const regenerateQuestionPaper = async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Reset status and progress
    assignment.status = 'pending';
    assignment.progress = 0;
    assignment.statusMessage = 'Queueing generation task...';
    // Remove old question paper link
    assignment.questionPaperId = undefined;
    await assignment.save();

    // Delete old question paper if exists
    await QuestionPaper.deleteOne({ assignmentId: assignment._id });

    // Add back to queue
    await assessmentQueue.add('generate-assessment', {
      assignmentId: (assignment._id as any).toString()
    });

    return res.status(200).json(assignment);
  } catch (error) {
    console.error('Error regenerating question paper:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const downloadPDF = async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const paper = await QuestionPaper.findOne({ assignmentId: req.params.id });
    if (!paper) {
      return res.status(404).json({ error: 'Question paper not generated yet or missing' });
    }

    const pdfBuffer = await PDFService.generateQuestionPaperPDF(assignment, paper);
    
    // Set headers
    const sanitizedTitle = assignment.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="exam_${sanitizedTitle}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.end(pdfBuffer);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
