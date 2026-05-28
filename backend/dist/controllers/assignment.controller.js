"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadPDF = exports.regenerateQuestionPaper = exports.updateQuestionPaper = exports.getQuestionPaper = exports.getAssignmentById = exports.getAssignments = exports.createAssignment = void 0;
const Assignment_1 = require("../models/Assignment");
const generator_1 = require("../services/generator");
const pdf_service_1 = require("../services/pdf.service");
const createAssignment = async (req, res) => {
    try {
        const { title, dueDate, questionTypes, numQuestions, marksPerQuestion, difficulty, additionalInstructions } = req.body;
        // --- Validation ---
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!dueDate) {
            return res.status(400).json({ error: 'Due date is required' });
        }
        if (new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
            return res.status(400).json({ error: 'Due date cannot be in the past' });
        }
        // Parse questionTypes
        let parsedTypes = [];
        if (typeof questionTypes === 'string') {
            parsedTypes = questionTypes.split(',').map(t => t.trim());
        }
        else if (Array.isArray(questionTypes)) {
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
        const assignment = new Assignment_1.Assignment({
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
        // --- Generate Assignment In-Process Asynchronously ---
        const assignmentIdStr = assignment._id.toString();
        setImmediate(async () => {
            try {
                await (0, generator_1.generateAssignment)(assignmentIdStr);
            }
            catch (err) {
                console.error('In-process generation failed:', err);
            }
        });
        return res.status(201).json(assignment);
    }
    catch (error) {
        console.error('Error creating assignment:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.createAssignment = createAssignment;
const getAssignments = async (req, res) => {
    try {
        const assignments = await Assignment_1.Assignment.find().sort({ createdAt: -1 });
        return res.status(200).json(assignments);
    }
    catch (error) {
        console.error('Error fetching assignments:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getAssignments = getAssignments;
const getAssignmentById = async (req, res) => {
    try {
        const assignment = await Assignment_1.Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        return res.status(200).json(assignment);
    }
    catch (error) {
        console.error('Error fetching assignment:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getAssignmentById = getAssignmentById;
const getQuestionPaper = async (req, res) => {
    try {
        const paper = await Assignment_1.QuestionPaper.findOne({ assignmentId: req.params.id });
        if (!paper) {
            return res.status(404).json({ error: 'Question paper not found for this assignment' });
        }
        return res.status(200).json(paper);
    }
    catch (error) {
        console.error('Error fetching question paper:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getQuestionPaper = getQuestionPaper;
const updateQuestionPaper = async (req, res) => {
    try {
        const { sections } = req.body;
        if (!sections || !Array.isArray(sections)) {
            return res.status(400).json({ error: 'Sections array is required for update' });
        }
        const paper = await Assignment_1.QuestionPaper.findOne({ assignmentId: req.params.id });
        if (!paper) {
            return res.status(404).json({ error: 'Question paper not found' });
        }
        paper.sections = sections;
        await paper.save();
        return res.status(200).json(paper);
    }
    catch (error) {
        console.error('Error updating question paper:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.updateQuestionPaper = updateQuestionPaper;
const regenerateQuestionPaper = async (req, res) => {
    try {
        const assignment = await Assignment_1.Assignment.findById(req.params.id);
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
        await Assignment_1.QuestionPaper.deleteOne({ assignmentId: assignment._id });
        // --- Generate Assignment In-Process Asynchronously ---
        const assignmentIdStr = assignment._id.toString();
        setImmediate(async () => {
            try {
                await (0, generator_1.generateAssignment)(assignmentIdStr);
            }
            catch (err) {
                console.error('In-process regeneration failed:', err);
            }
        });
        return res.status(200).json(assignment);
    }
    catch (error) {
        console.error('Error regenerating question paper:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.regenerateQuestionPaper = regenerateQuestionPaper;
const downloadPDF = async (req, res) => {
    try {
        const assignment = await Assignment_1.Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        const paper = await Assignment_1.QuestionPaper.findOne({ assignmentId: req.params.id });
        if (!paper) {
            return res.status(404).json({ error: 'Question paper not generated yet or missing' });
        }
        const pdfBuffer = await pdf_service_1.PDFService.generateQuestionPaperPDF(assignment, paper);
        // Set headers
        const sanitizedTitle = assignment.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="exam_${sanitizedTitle}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer);
    }
    catch (error) {
        console.error('Error downloading PDF:', error);
        return res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
exports.downloadPDF = downloadPDF;
