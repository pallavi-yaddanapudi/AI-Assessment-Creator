"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWorker = exports.processAssignment = exports.isRedisConnected = exports.assessmentQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Assignment_1 = require("../models/Assignment");
const ai_service_1 = require("../services/ai.service");
const socket_1 = require("../sockets/socket");
const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const connection = redisUrl
    ? new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null })
    : new ioredis_1.default({
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: null // Required by BullMQ
    });
// Catch connection errors silently to prevent Node process from crashing
connection.on('error', (err) => {
    console.warn('Redis Connection Warn:', err.message);
});
// Initialize AI Service
const aiService = new ai_service_1.AIService();
exports.assessmentQueue = new bullmq_1.Queue('assessment-generation', { connection });
const isRedisConnected = () => {
    return connection.status === 'ready';
};
exports.isRedisConnected = isRedisConnected;
const processAssignment = async (assignmentId) => {
    console.log(`Processing assignment generation for: ${assignmentId}`);
    const assignment = await Assignment_1.Assignment.findById(assignmentId);
    if (!assignment) {
        throw new Error(`Assignment with ID ${assignmentId} not found`);
    }
    try {
        // 2. Start Processing
        assignment.status = 'processing';
        assignment.progress = 10;
        assignment.statusMessage = 'Reading assignment configuration...';
        await assignment.save();
        (0, socket_1.emitProgress)(assignmentId, {
            progress: 10,
            status: 'processing',
            message: 'Reading assignment configuration...'
        });
        // 3. Process File Content if available
        let fileContent = '';
        if (assignment.fileUrl) {
            // If a file is uploaded, simulate parsing or read it if text
            assignment.progress = 30;
            assignment.statusMessage = `Parsing uploaded file: ${assignment.fileName || 'document'}...`;
            await assignment.save();
            (0, socket_1.emitProgress)(assignmentId, {
                progress: 30,
                status: 'processing',
                message: `Parsing uploaded file: ${assignment.fileName}...`
            });
            // Simulate brief parsing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Resolve absolute path to the uploaded file
            const absoluteFilePath = path_1.default.resolve(assignment.fileUrl);
            if (fs_1.default.existsSync(absoluteFilePath)) {
                const ext = path_1.default.extname(absoluteFilePath).toLowerCase();
                if (ext === '.txt' || ext === '.json' || ext === '.md') {
                    fileContent = fs_1.default.readFileSync(absoluteFilePath, 'utf-8');
                }
                else {
                    // For binary/PDF file type, we mock the extracted text since full PDF parsing is complex.
                    // We describe the metadata to include in the context prompt.
                    fileContent = `[Source File Name: ${assignment.fileName}. A document related to ${assignment.title}. Generate questions directly from the topic of ${assignment.title}.]`;
                }
            }
        }
        // 4. Invoke AI Generation
        assignment.progress = 55;
        assignment.statusMessage = 'Generating questions using AI engine...';
        await assignment.save();
        (0, socket_1.emitProgress)(assignmentId, {
            progress: 55,
            status: 'processing',
            message: 'Generating questions using AI engine...'
        });
        const sections = await aiService.generateQuestions({
            title: assignment.title,
            dueDate: assignment.dueDate,
            questionTypes: assignment.questionTypes,
            numQuestions: assignment.numQuestions,
            marksPerQuestion: assignment.marksPerQuestion,
            difficulty: assignment.difficulty,
            additionalInstructions: assignment.additionalInstructions,
            fileContent
        });
        // 5. Structure and Save Question Paper
        assignment.progress = 85;
        assignment.statusMessage = 'Formatting question paper and saving to database...';
        await assignment.save();
        (0, socket_1.emitProgress)(assignmentId, {
            progress: 85,
            status: 'processing',
            message: 'Formatting question paper and saving to database...'
        });
        const questionPaper = new Assignment_1.QuestionPaper({
            assignmentId: assignment._id,
            sections
        });
        await questionPaper.save();
        // 6. Complete Job
        assignment.status = 'completed';
        assignment.progress = 100;
        assignment.statusMessage = 'Assessment generated successfully!';
        assignment.questionPaperId = questionPaper._id;
        await assignment.save();
        (0, socket_1.emitProgress)(assignmentId, {
            progress: 100,
            status: 'completed',
            message: 'Assessment generated successfully!',
            paperId: questionPaper._id.toString()
        });
        console.log(`Job completed for assignment ${assignmentId}. Paper created: ${questionPaper._id}`);
    }
    catch (error) {
        console.error(`Error processing assignment ${assignmentId}:`, error);
        assignment.status = 'failed';
        assignment.progress = 100;
        assignment.statusMessage = error.message || 'Generation failed due to an unexpected error';
        await assignment.save();
        (0, socket_1.emitProgress)(assignmentId, {
            progress: 100,
            status: 'failed',
            message: assignment.statusMessage
        });
        throw error;
    }
};
exports.processAssignment = processAssignment;
const initWorker = () => {
    const worker = new bullmq_1.Worker('assessment-generation', async (job) => {
        const { assignmentId } = job.data;
        console.log(`Processing background job ${job.id} for assignment ${assignmentId}`);
        await (0, exports.processAssignment)(assignmentId);
    }, { connection });
    worker.on('active', (job) => {
        console.log(`Job ${job.id} has started processing`);
    });
    worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed successfully`);
    });
    worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed:`, err);
    });
    return worker;
};
exports.initWorker = initWorker;
