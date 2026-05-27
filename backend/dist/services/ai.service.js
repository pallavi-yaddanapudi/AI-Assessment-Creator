"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const genai_1 = require("@google/genai");
// Simple helper to guess topic from title
function guessTopic(title) {
    const t = title.toLowerCase();
    if (t.includes('network') || t.includes('web') || t.includes('internet') || t.includes('http') || t.includes('osi'))
        return 'networking';
    if (t.includes('database') || t.includes('sql') || t.includes('mongo') || t.includes('dbms'))
        return 'databases';
    if (t.includes('math') || t.includes('algebra') || t.includes('calculus') || t.includes('geometry') || t.includes('number'))
        return 'math';
    if (t.includes('history') || t.includes('war') || t.includes('revolution') || t.includes('empire'))
        return 'history';
    if (t.includes('programming') || t.includes('javascript') || t.includes('python') || t.includes('code') || t.includes('react'))
        return 'programming';
    return 'general';
}
const QUESTION_BANK = {
    networking: {
        mcq: [
            { text: "Which layer of the OSI model is responsible for routing packets?", options: ["A) Physical Layer", "B) Data Link Layer", "C) Network Layer", "D) Transport Layer"], answer: "C" },
            { text: "What is the default port number for secure HTTP (HTTPS)?", options: ["A) 80", "B) 8080", "C) 21", "D) 443"], answer: "D" },
            { text: "Which protocol is used to dynamically assign IP addresses to devices?", options: ["A) DNS", "B) DHCP", "C) FTP", "D) SMTP"], answer: "B" },
            { text: "What is the main difference between TCP and UDP?", options: ["A) TCP is connectionless", "B) UDP guarantees delivery", "C) TCP is connection-oriented", "D) UDP is slower"], answer: "C" },
            { text: "Which device operates primarily at the Data Link layer?", options: ["A) Router", "B) Switch", "C) Hub", "D) Repeater"], answer: "B" }
        ],
        short: [
            "Explain the purpose of the Domain Name System (DNS).",
            "What is a subnet mask and how is it used in IP addressing?",
            "Briefly define latency, bandwidth, and throughput.",
            "What is the function of the Address Resolution Protocol (ARP)?"
        ],
        long: [
            "Detail the seven layers of the OSI model, describing the core function and key protocols of each layer.",
            "Compare and contrast IPv4 and IPv6. Discuss the header differences and the migration necessity.",
            "Explain the TCP three-way handshake mechanism and how connection teardown is achieved."
        ]
    },
    databases: {
        mcq: [
            { text: "Which SQL clause is used to filter group results after aggregation?", options: ["A) WHERE", "B) HAVING", "C) ORDER BY", "D) GROUP BY"], answer: "B" },
            { text: "What type of relationship exists between an Author and their Books?", options: ["A) One-to-One", "B) One-to-Many", "C) Many-to-Many", "D) None of the above"], answer: "B" },
            { text: "In database normalization, which form eliminates partial dependencies?", options: ["A) 1NF", "B) 2NF", "C) 3NF", "D) BCNF"], answer: "B" },
            { text: "Which database system is considered a NoSQL document database?", options: ["A) PostgreSQL", "B) MySQL", "C) MongoDB", "D) SQLite"], answer: "C" }
        ],
        short: [
            "Explain the ACID properties of database transactions.",
            "What is the difference between an INNER JOIN and a LEFT JOIN?",
            "Explain what database indexing is and how it improves query performance.",
            "What is a primary key and how does it differ from a unique key?"
        ],
        long: [
            "Explain the concept of database normalization from 1NF through 3NF. Provide examples of anomalies that normalization resolves.",
            "Compare SQL (relational) and NoSQL (non-relational) databases. Analyze when to choose one over the other based on scalability, schema flexibility, and transactional requirements."
        ]
    },
    math: {
        mcq: [
            { text: "What is the derivative of x^2 with respect to x?", options: ["A) x", "B) 2x", "C) x^2 / 2", "D) 2"], answer: "B" },
            { text: "What is the value of log(100) to base 10?", options: ["A) 1", "B) 2", "C) 10", "D) 0"], answer: "B" },
            { text: "If 3x + 5 = 20, what is the value of x?", options: ["A) 5", "B) 15", "C) 3", "D) 6"], answer: "A" },
            { text: "What is the sum of angles in a hexagon?", options: ["A) 360°", "B) 540°", "C) 720°", "D) 900°"], answer: "C" }
        ],
        short: [
            "Solve for x: x^2 - 5x + 6 = 0.",
            "Explain the Pythagorean theorem and state its formula.",
            "Find the limit of (x^2 - 1)/(x - 1) as x approaches 1.",
            "Explain what a prime number is and list the first five prime numbers."
        ],
        long: [
            "Explain the Fundamental Theorem of Calculus. Show how it connects differentiation and integration, and provide a practical example of its application.",
            "Describe the concept of Euler's Identity (e^(i*pi) + 1 = 0). Discuss the five fundamental mathematical constants combined in this equation and their historical contexts."
        ]
    },
    programming: {
        mcq: [
            { text: "Which of the following is NOT a primitive data type in JavaScript?", options: ["A) String", "B) Object", "C) Boolean", "D) Number"], answer: "B" },
            { text: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?", options: ["A) O(1)", "B) O(n)", "C) O(log n)", "D) O(n log n)"], answer: "C" },
            { text: "Which keyword is used to declare a block-scoped variable in modern JavaScript?", options: ["A) var", "B) let", "C) function", "D) global"], answer: "B" },
            { text: "What is the main purpose of React Virtual DOM?", options: ["A) Bypass HTML parsing", "B) Direct manipulation of browser window", "C) Efficiently batch UI updates and minimize reflows", "D) Provide styles directly to components"], answer: "C" }
        ],
        short: [
            "Explain the concept of 'closures' in JavaScript.",
            "What is the difference between synchronous and asynchronous code execution?",
            "Define recursion and provide a basic example (such as calculating factorials).",
            "What is a REST API and what are its standard HTTP methods?"
        ],
        long: [
            "Explain the concepts of Object-Oriented Programming (OOP) vs Functional Programming (FP). Discuss inheritance, encapsulation, pure functions, and immutability.",
            "Analyze the differences between Client-Side Rendering (CSR) and Server-Side Rendering (SSR). Discuss the SEO, performance, and user experience tradeoffs of both approaches in modern web apps."
        ]
    },
    history: {
        mcq: [
            { text: "In which year did World War I begin?", options: ["A) 1912", "B) 1914", "C) 1918", "D) 1939"], answer: "B" },
            { text: "Who was the first President of the United States?", options: ["A) Thomas Jefferson", "B) Abraham Lincoln", "C) George Washington", "D) John Adams"], answer: "C" },
            { text: "Which ancient civilization constructed the Colosseum in Rome?", options: ["A) Ancient Greeks", "B) Ancient Egyptians", "C) Ancient Romans", "D) Mesopotamians"], answer: "C" }
        ],
        short: [
            "What were the primary causes of the French Revolution?",
            "Describe the significance of the Magna Carta signed in 1215.",
            "Briefly explain the impact of the Industrial Revolution on urbanization.",
            "Who was Mahatma Gandhi and what was his role in India's independence movement?"
        ],
        long: [
            "Discuss the causes, key alliances, and ultimate global consequences of World War II, detailing how it reshaped the map of Europe and led to the Cold War.",
            "Trace the rise and fall of the Roman Empire, analyzing the economic, military, and political factors that contributed to its eventual decline."
        ]
    },
    general: {
        mcq: [
            { text: "Which planet is known as the Red Planet?", options: ["A) Venus", "B) Jupiter", "C) Mars", "D) Saturn"], answer: "C" },
            { text: "What is the chemical symbol for water?", options: ["A) CO2", "B) H2O", "C) NaCl", "D) O2"], answer: "B" },
            { text: "What is the tallest mountain in the world?", options: ["A) K2", "B) Mount Kilimanjaro", "C) Mount Everest", "D) Mount Fuji"], answer: "C" },
            { text: "How many bones are there in an adult human body?", options: ["A) 108", "B) 206", "C) 305", "D) 180"], answer: "B" }
        ],
        short: [
            "What is photosynthesis and why is it crucial for life on Earth?",
            "Explain the difference between renewable and non-renewable energy sources.",
            "What is gravity and how does it govern planetary orbits?",
            "Briefly explain the water cycle phases (evaporation, condensation, precipitation)."
        ],
        long: [
            "Discuss the global threat of climate change, explaining the greenhouse effect, primary human causes, and potential strategies for global mitigation and renewable energy transition.",
            "Analyze the development and impact of the internet on modern communication, commerce, and human interaction over the past three decades."
        ]
    }
};
class AIService {
    ai = null;
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        const useMock = process.env.USE_MOCK_AI === 'true';
        if (apiKey && !useMock) {
            try {
                this.ai = new genai_1.GoogleGenAI({ apiKey });
                console.log('Gemini AI Client initialized successfully.');
            }
            catch (err) {
                console.error('Failed to initialize Gemini AI client:', err);
            }
        }
        else {
            console.log('Gemini API key not found or USE_MOCK_AI=true. Falling back to dynamic mock generator.');
        }
    }
    async generateQuestions(params) {
        if (this.ai) {
            try {
                return await this.generateWithGemini(params);
            }
            catch (err) {
                console.error('Error generating with Gemini API, falling back to mock generator:', err);
                return this.generateMockQuestions(params);
            }
        }
        else {
            // Simulate network delay for mock generator to make UI interaction realistic
            await new Promise(resolve => setTimeout(resolve, 4000));
            return this.generateMockQuestions(params);
        }
    }
    async generateWithGemini(params) {
        if (!this.ai)
            throw new Error('AI client not initialized');
        const typeDescription = params.questionTypes.map(t => {
            if (t === 'mcq')
                return 'Multiple Choice Questions (mcq)';
            if (t === 'short')
                return 'Short Answer Questions (short)';
            if (t === 'long')
                return 'Long Answer / Essay Questions (long)';
            return t;
        }).join(', ');
        const prompt = `
      Create a structured examination question paper with the following parameters:
      - Title/Topic: ${params.title}
      - Target Question Types to include: ${typeDescription}
      - Total Number of Questions to generate: ${params.numQuestions}
      - Marks per Question: ${params.marksPerQuestion}
      - Overall Difficulty target: ${params.difficulty} (Values for questions should be 'Easy', 'Moderate', or 'Hard' depending on this setting)
      ${params.additionalInstructions ? `- Additional Instructions: ${params.additionalInstructions}` : ''}
      ${params.fileContent ? `- Source Context File Content: \n"""\n${params.fileContent}\n"""` : ''}

      INSTRUCTIONS:
      1. Group the questions into logical sections based on their question types (e.g. "Section A: Multiple Choice Questions", "Section B: Short Answer Questions").
      2. Provide a clear instruction for each section (e.g. "Answer all multiple-choice questions. Select the single best option.").
      3. For Multiple Choice Questions, provide exactly 4 options.
      4. Make sure each question has a difficulty value ('Easy', 'Moderate', or 'Hard') and the correct marks value of ${params.marksPerQuestion} marks.
      5. The output MUST strictly follow the JSON schema.
    `;
        // Define JSON schema for Gemini response
        const schema = {
            type: genai_1.Type.OBJECT,
            properties: {
                sections: {
                    type: genai_1.Type.ARRAY,
                    description: "List of sections in the question paper",
                    items: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            title: { type: genai_1.Type.STRING, description: "E.g. Section A: Multiple Choice Questions" },
                            instruction: { type: genai_1.Type.STRING, description: "Instructions for this specific section, e.g. Attempt all questions" },
                            questions: {
                                type: genai_1.Type.ARRAY,
                                items: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        text: { type: genai_1.Type.STRING, description: "The text of the question" },
                                        options: {
                                            type: genai_1.Type.ARRAY,
                                            items: { type: genai_1.Type.STRING },
                                            description: "List of options if MCQ, omit or leave empty for short/long answers"
                                        },
                                        difficulty: { type: genai_1.Type.STRING, description: "Difficulty level: Easy, Moderate, or Hard" },
                                        marks: { type: genai_1.Type.INTEGER, description: "Marks allocated for this question" }
                                    },
                                    required: ["text", "difficulty", "marks"]
                                }
                            }
                        },
                        required: ["title", "instruction", "questions"]
                    }
                }
            },
            required: ["sections"]
        };
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.2
            }
        });
        const textResponse = response.text;
        if (!textResponse)
            throw new Error('Empty response from Gemini AI');
        const parsed = JSON.parse(textResponse);
        return parsed.sections || [];
    }
    generateMockQuestions(params) {
        const topic = guessTopic(params.title);
        const bank = QUESTION_BANK[topic] || QUESTION_BANK.general;
        const sections = [];
        // Calculate how many questions to put in each type
        const activeTypes = params.questionTypes.filter(t => ['mcq', 'short', 'long'].includes(t));
        if (activeTypes.length === 0)
            activeTypes.push('short'); // Fallback
        let remainingQuestions = params.numQuestions;
        const questionsPerType = {};
        activeTypes.forEach((type, idx) => {
            if (idx === activeTypes.length - 1) {
                questionsPerType[type] = remainingQuestions;
            }
            else {
                const count = Math.max(1, Math.floor(params.numQuestions / activeTypes.length));
                questionsPerType[type] = count;
                remainingQuestions -= count;
            }
        });
        // Determine difficulty tags based on overall difficulty parameter
        const getDiffTag = (idx) => {
            if (params.difficulty === 'easy')
                return 'Easy';
            if (params.difficulty === 'medium')
                return 'Moderate';
            if (params.difficulty === 'hard')
                return 'Hard';
            // Mixed: distribute evenly
            if (idx % 3 === 0)
                return 'Easy';
            if (idx % 3 === 1)
                return 'Moderate';
            return 'Hard';
        };
        let qCounter = 0;
        if (questionsPerType.mcq > 0) {
            const mcqQuestions = [];
            const count = questionsPerType.mcq;
            for (let i = 0; i < count; i++) {
                const template = bank.mcq[i % bank.mcq.length];
                mcqQuestions.push({
                    text: template.text,
                    options: template.options,
                    difficulty: getDiffTag(qCounter++),
                    marks: params.marksPerQuestion
                });
            }
            sections.push({
                title: "Section A: Multiple Choice Questions",
                instruction: "Attempt all questions. Choose the correct alternative from the given options.",
                questions: mcqQuestions
            });
        }
        if (questionsPerType.short > 0) {
            const shortQuestions = [];
            const count = questionsPerType.short;
            for (let i = 0; i < count; i++) {
                const text = bank.short[i % bank.short.length];
                shortQuestions.push({
                    text,
                    difficulty: getDiffTag(qCounter++),
                    marks: params.marksPerQuestion
                });
            }
            sections.push({
                title: sections.length === 0 ? "Section A: Short Answer Questions" : "Section B: Short Answer Questions",
                instruction: "Answer the following questions in 2-3 sentences.",
                questions: shortQuestions
            });
        }
        if (questionsPerType.long > 0) {
            const longQuestions = [];
            const count = questionsPerType.long;
            for (let i = 0; i < count; i++) {
                const text = bank.long[i % bank.long.length];
                longQuestions.push({
                    text,
                    difficulty: getDiffTag(qCounter++),
                    marks: params.marksPerQuestion
                });
            }
            const sectionCode = sections.length === 0 ? "Section A" : sections.length === 1 ? "Section B" : "Section C";
            sections.push({
                title: `${sectionCode}: Long Answer Questions`,
                instruction: "Provide detailed and structured responses to the following questions. Illustrate with diagrams where necessary.",
                questions: longQuestions
            });
        }
        return sections;
    }
}
exports.AIService = AIService;
