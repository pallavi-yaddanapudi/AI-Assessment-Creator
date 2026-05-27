"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables first
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
const db_1 = require("./config/db");
const socket_1 = require("./sockets/socket");
const queue_1 = require("./queues/queue");
const assignment_routes_1 = __importDefault(require("./routes/assignment.routes"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-assessment-creator';
// Express Middlewares
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins for simplicity in local setups
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve Uploaded Files (Optional static mapping)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API Routes mapping
app.use('/api/assignments', assignment_routes_1.default);
// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date() });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Express global error:', err.message);
    res.status(500).json({ error: err.message || 'Something went wrong' });
});
// Startup Sequence
const startServer = async () => {
    try {
        // 1. Connect MongoDB
        await (0, db_1.connectDB)(MONGODB_URI);
        // 2. Initialize WebSockets
        (0, socket_1.initSocket)(server);
        console.log('WebSocket system initialized.');
        // 3. Initialize BullMQ background job worker
        (0, queue_1.initWorker)();
        console.log('BullMQ Background generation worker started.');
        // 4. Start HTTP Server
        server.listen(PORT, () => {
            console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};
startServer();
