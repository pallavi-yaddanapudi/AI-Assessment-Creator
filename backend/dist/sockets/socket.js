"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitProgress = exports.getSocketIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // Allow all origins for simplicity in local setups
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log(`Socket client connected: ${socket.id}`);
        // Join room for specific assignment
        socket.on('join-assignment', (assignmentId) => {
            socket.join(assignmentId);
            console.log(`Socket ${socket.id} joined room: ${assignmentId}`);
        });
        socket.on('disconnect', () => {
            console.log(`Socket client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getSocketIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized. Call initSocket first.');
    }
    return io;
};
exports.getSocketIO = getSocketIO;
const emitProgress = (assignmentId, data) => {
    if (io) {
        io.to(assignmentId).emit('progress', data);
        console.log(`Socket emit [progress] to room ${assignmentId}:`, data);
    }
};
exports.emitProgress = emitProgress;
