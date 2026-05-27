"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
class PDFService {
    static async generateQuestionPaperPDF(assignment, paper) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({
                margin: 50,
                size: 'A4',
                bufferPages: true
            });
            const buffers = [];
            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', err => reject(err));
            // Calculate total marks
            let totalMarks = 0;
            paper.sections.forEach(sec => {
                sec.questions.forEach(q => {
                    totalMarks += q.marks;
                });
            });
            // --- 1. Institutional Header ---
            doc.fontSize(10).font('Helvetica-Bold').text('ACADEMIC ASSESSMENT CELL', { align: 'center' });
            doc.fontSize(16).font('Helvetica-Bold').text(assignment.title.toUpperCase(), { align: 'center', paragraphGap: 5 });
            // Subtitle / Metadata
            const formattedDate = new Date(assignment.dueDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            doc.fontSize(10).font('Helvetica').text(`Due Date: ${formattedDate}  |  Total Questions: ${assignment.numQuestions}  |  Max Marks: ${totalMarks}`, { align: 'center' });
            doc.moveDown(0.5);
            // Header Double Border Line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1.5).stroke();
            doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).lineWidth(0.5).stroke();
            doc.moveDown(1);
            // --- 2. Student Info Section ---
            const infoBoxY = doc.y;
            doc.rect(50, infoBoxY, 495, 35).lineWidth(0.5).stroke();
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('CANDIDATE NAME: ___________________________', 60, infoBoxY + 12);
            doc.text('ROLL NO: ___________', 330, infoBoxY + 12);
            doc.text('SEC: ______', 475, infoBoxY + 12);
            doc.y = infoBoxY + 45; // Reset y position below the box
            doc.moveDown(0.5);
            // --- 3. Instructions & Guidelines ---
            if (assignment.additionalInstructions) {
                doc.fontSize(10).font('Helvetica-Bold').text('General Instructions:');
                doc.fontSize(9).font('Helvetica-Oblique').text(assignment.additionalInstructions, {
                    width: 495,
                    align: 'justify'
                });
                doc.moveDown(1.5);
            }
            // --- 4. Render Sections & Questions ---
            let questionIndex = 1;
            paper.sections.forEach((section, secIdx) => {
                // Section Header Banner
                const sectionStartY = doc.y;
                doc.rect(50, sectionStartY, 495, 20).fillColor('#f0f4f8').fill();
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11);
                doc.text(section.title.toUpperCase(), 55, sectionStartY + 5);
                doc.moveDown(0.5);
                // Section Instructions
                doc.font('Helvetica-Oblique').fontSize(9).text(`Instructions: ${section.instruction}`, 50, doc.y, { width: 495 });
                doc.moveDown(1);
                // Questions Loop
                section.questions.forEach((q) => {
                    // Check if we need to add a page to prevent orphan questions
                    if (doc.y > 700) {
                        doc.addPage();
                        // Re-draw small header on new pages
                        doc.fontSize(8).font('Helvetica-Oblique').text(`${assignment.title.toUpperCase()} - QUESTION PAPER`, 50, 30);
                        doc.moveTo(50, 42).lineTo(545, 42).lineWidth(0.5).stroke();
                        doc.y = 55;
                    }
                    const questionY = doc.y;
                    // Question Number and Text
                    doc.font('Helvetica-Bold').fontSize(10).text(`${questionIndex}.`, 50, questionY);
                    // Question body text
                    doc.font('Helvetica').fontSize(10).text(q.text, 70, questionY, {
                        width: 400,
                        align: 'justify'
                    });
                    // Marks and Difficulty Badge align to right
                    const rightText = `(${q.marks} Marks) [${q.difficulty}]`;
                    doc.font('Helvetica-Bold').fontSize(9).text(rightText, 440, questionY, {
                        width: 105,
                        align: 'right'
                    });
                    doc.moveDown(0.5);
                    // MCQ Options rendering
                    if (q.options && q.options.length > 0) {
                        // Render in 2 columns
                        const optionsY = doc.y;
                        q.options.forEach((opt, optIdx) => {
                            const col = optIdx % 2;
                            const row = Math.floor(optIdx / 2);
                            const xPos = col === 0 ? 80 : 300;
                            const yPos = optionsY + (row * 15);
                            doc.font('Helvetica').fontSize(9.5).text(opt, xPos, yPos, { width: 200 });
                        });
                        doc.moveDown(Math.ceil(q.options.length / 2) * 0.7);
                        doc.moveDown(0.5);
                    }
                    doc.moveDown(0.5);
                    questionIndex++;
                });
                doc.moveDown(1.5);
            });
            // --- 5. Footer Page Numbers ---
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).font('Helvetica').fillColor('#666666');
                doc.text(`Page ${i + 1} of ${pages.count}`, 50, 785, { align: 'center', width: 495 });
            }
            doc.end();
        });
    }
}
exports.PDFService = PDFService;
