import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  getQuestionPaper,
  updateQuestionPaper,
  regenerateQuestionPaper,
  downloadPDF
} from '../controllers/assignment.controller';

const router = Router();

// Configure multer storage
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|txt|md|json/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/pdf' || file.mimetype === 'text/plain';

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files (.pdf, .txt, .md, .json) are allowed'));
    }
  }
});

// Routes configuration
router.post('/', upload.single('file'), createAssignment);
router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.get('/:id/paper', getQuestionPaper);
router.put('/:id/paper', updateQuestionPaper);
router.post('/:id/regenerate', regenerateQuestionPaper);
router.get('/:id/pdf', downloadPDF);

export default router;
