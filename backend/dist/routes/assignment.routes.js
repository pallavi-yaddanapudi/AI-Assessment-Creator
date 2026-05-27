"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const assignment_controller_1 = require("../controllers/assignment.controller");
const router = (0, express_1.Router)();
// Configure multer storage
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf|txt|md|json/;
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/pdf' || file.mimetype === 'text/plain';
        if (extname && mimetype) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only document files (.pdf, .txt, .md, .json) are allowed'));
        }
    }
});
// Routes configuration
router.post('/', upload.single('file'), assignment_controller_1.createAssignment);
router.get('/', assignment_controller_1.getAssignments);
router.get('/:id', assignment_controller_1.getAssignmentById);
router.get('/:id/paper', assignment_controller_1.getQuestionPaper);
router.put('/:id/paper', assignment_controller_1.updateQuestionPaper);
router.post('/:id/regenerate', assignment_controller_1.regenerateQuestionPaper);
router.get('/:id/pdf', assignment_controller_1.downloadPDF);
exports.default = router;
