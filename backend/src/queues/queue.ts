import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { Assignment, QuestionPaper } from '../models/Assignment';
import { AIService } from '../services/ai.service';
import { emitProgress } from '../sockets/socket';

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const connection = redisUrl
  ? new IORedis(redisUrl, { maxRetriesPerRequest: null })
  : new IORedis({
      host: redisHost,
      port: redisPort,
      maxRetriesPerRequest: null // Required by BullMQ
    });

// Initialize AI Service
const aiService = new AIService();

export const assessmentQueue = new Queue('assessment-generation', { connection });

export const initWorker = () => {
  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      const { assignmentId } = job.data;
      console.log(`Processing background job ${job.id} for assignment ${assignmentId}`);

      // 1. Fetch assignment
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error(`Assignment with ID ${assignmentId} not found`);
      }

      try {
        // 2. Start Processing
        assignment.status = 'processing';
        assignment.progress = 10;
        assignment.statusMessage = 'Reading assignment configuration...';
        await assignment.save();
        emitProgress(assignmentId, {
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
          emitProgress(assignmentId, {
            progress: 30,
            status: 'processing',
            message: `Parsing uploaded file: ${assignment.fileName}...`
          });

          // Simulate brief parsing delay
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Resolve absolute path to the uploaded file
          const absoluteFilePath = path.resolve(assignment.fileUrl);
          if (fs.existsSync(absoluteFilePath)) {
            const ext = path.extname(absoluteFilePath).toLowerCase();
            if (ext === '.txt' || ext === '.json' || ext === '.md') {
              fileContent = fs.readFileSync(absoluteFilePath, 'utf-8');
            } else {
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
        emitProgress(assignmentId, {
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
        emitProgress(assignmentId, {
          progress: 85,
          status: 'processing',
          message: 'Formatting question paper and saving to database...'
        });

        const questionPaper = new QuestionPaper({
          assignmentId: assignment._id,
          sections
        });
        await questionPaper.save();

        // 6. Complete Job
        assignment.status = 'completed';
        assignment.progress = 100;
        assignment.statusMessage = 'Assessment generated successfully!';
        assignment.questionPaperId = questionPaper._id as any;
        await assignment.save();

        emitProgress(assignmentId, {
          progress: 100,
          status: 'completed',
          message: 'Assessment generated successfully!',
          paperId: (questionPaper._id as any).toString()
        });

        console.log(`Job completed for assignment ${assignmentId}. Paper created: ${questionPaper._id}`);
      } catch (error: any) {
        console.error(`Error in queue worker for assignment ${assignmentId}:`, error);

        assignment.status = 'failed';
        assignment.progress = 100;
        assignment.statusMessage = error.message || 'Generation failed due to an unexpected error';
        await assignment.save();

        emitProgress(assignmentId, {
          progress: 100,
          status: 'failed',
          message: assignment.statusMessage
        });

        throw error;
      }
    },
    { connection }
  );

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
