'use client';
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../../store';
import { setGenerationProgress, setCurrentAssignment } from '../../store/assignmentSlice';
import styles from '../../styles/generate.module.css';
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

interface LogItem {
  time: string;
  message: string;
  type: 'info' | 'completed' | 'failed';
}

export default function GenerateProgress() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const assignmentId = searchParams.get('id');
  const { currentAssignment, generationProgress } = useAppSelector((state) => state.assignments);

  const [logs, setLogs] = useState<LogItem[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Load assignment meta and configure socket
  useEffect(() => {
    if (!assignmentId) {
      router.push('/');
      return;
    }

    const addLog = (message: string, type: 'info' | 'completed' | 'failed' = 'info') => {
      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, { time, message, type }]);
    };

    const fetchAssignmentMeta = async () => {
      try {
        const res = await fetch(`${API_URL}/api/assignments/${assignmentId}`);
        if (!res.ok) throw new Error('Assignment not found');

        const data = await res.json();
        dispatch(setCurrentAssignment(data));

        if (data.status === 'completed' && data.questionPaperId) {
          addLog('Assignment already generated. Redirecting...', 'completed');
          setTimeout(() => {
            router.push(`/assessment/${assignmentId}`);
          }, 1500);
          return;
        }

        if (data.status === 'failed') {
          addLog(`Generation failed previously: ${data.statusMessage}`, 'failed');
          return;
        }

        // Initialize websocket connection
        setupWebSocket(data);
      } catch (err: any) {
        addLog(`Error: ${err.message}`, 'failed');
      }
    };

    const setupWebSocket = (assignmentData: any) => {
      addLog('Establishing real-time connection with worker...', 'info');

      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      socket.on('connect', () => {
        addLog('Connected to worker! Listening for updates...', 'info');
        socket.emit('join-assignment', assignmentId);
      });

      socket.on('progress', (data: { progress: number; status: 'pending' | 'processing' | 'completed' | 'failed'; message: string; paperId?: string }) => {
        dispatch(setGenerationProgress(data));

        let type: 'info' | 'completed' | 'failed' = 'info';
        if (data.status === 'completed') type = 'completed';
        if (data.status === 'failed') type = 'failed';

        addLog(`[${data.progress}%] ${data.message}`, type);

        if (data.status === 'completed' && data.paperId) {
          addLog('Generating complete. Redirecting to paper editor...', 'completed');
          setTimeout(() => {
            router.push(`/assessment/${assignmentId}`);
          }, 1500);
        }
      });

      socket.on('disconnect', () => {
        addLog('Disconnected from worker service.', 'info');
      });

      socket.on('connect_error', () => {
        addLog('Failed to connect to real-time socket. Retrying in background...', 'info');
      });
    };

    fetchAssignmentMeta();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [assignmentId, dispatch, router]);

  // Handle Cancel / Go Back
  const handleCancel = () => {
    router.push('/');
  };

  // SVG calculations for Circular Progress
  const percentage = generationProgress?.progress || 0;
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isCompleted = generationProgress?.status === 'completed';
  const isFailed = generationProgress?.status === 'failed';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div>
          <h1 className={styles.title}>
            {currentAssignment?.title || 'Preparing Generation'}
          </h1>
          <p className={styles.subtitle}>
            {isCompleted
              ? 'Assessment created successfully!'
              : isFailed
                ? 'Something went wrong.'
                : 'AI is generating questions and layout structure...'}
          </p>
        </div>

        {/* Circular Progress Gauge */}
        <div className={styles.progressRingContainer}>
          <svg className={styles.circleSvg} width="160" height="160">
            <circle
              className={styles.circleBg}
              cx="80"
              cy="80"
              r={radius}
              strokeWidth={strokeWidth}
            />
            <circle
              className={`${styles.circleBar} ${isCompleted ? styles.circleBarCompleted : isFailed ? styles.circleBarFailed : ''
                }`}
              cx="80"
              cy="80"
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className={styles.innerPercentage}>
            <span className={styles.percentText}>{percentage}%</span>
            <span className={styles.statusIcon}>
              {isCompleted ? (
                <CheckCircle2 className="text-emerald-400" size={24} />
              ) : isFailed ? (
                <XCircle className="text-red-500" size={24} />
              ) : (
                <Loader2 className="text-indigo-400 animate-spin" size={24} />
              )}
            </span>
          </div>
        </div>

        {/* Log Window */}
        <div className={styles.terminal}>
          {logs.map((log, index) => (
            <div
              key={index}
              className={`${styles.logLine} ${log.type === 'completed'
                ? styles.logLineCompleted
                : log.type === 'failed'
                  ? styles.logLineFailed
                  : ''
                }`}
            >
              <span className={styles.logTime}>[{log.time}]</span>
              <span className={styles.logMessage}>{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className={styles.logLine}>
              <span className={styles.logTime}>...</span>
              <span className={styles.logMessage}>Queueing job...</span>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>

        <button onClick={handleCancel} className={styles.cancelBtn}>
          <ArrowLeft size={16} />
          <span>{isCompleted || isFailed ? 'Go Back' : 'Cancel Generation'}</span>
        </button>
      </div>
    </div>
  );
}
