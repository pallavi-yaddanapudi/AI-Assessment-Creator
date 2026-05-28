'use client';

export const dynamic = "force-dynamic";

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setGenerationProgress,
  setCurrentAssignment
} from '../../store/assignmentSlice';

import styles from '../../styles/generate.module.css';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft
} from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

interface LogItem {
  time: string;
  message: string;
  type: 'info' | 'completed' | 'failed';
}

function GenerateProgressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const assignmentId = searchParams.get('id');

  const { currentAssignment, generationProgress } =
    useAppSelector((state) => state.assignments);

  const [logs, setLogs] = useState<LogItem[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [logs]);

  // Main Logic
  useEffect(() => {
    if (!assignmentId) {
      router.push('/');
      return;
    }

    const addLog = (
      message: string,
      type: 'info' | 'completed' | 'failed' = 'info'
    ) => {
      const time = new Date().toLocaleTimeString();

      setLogs((prev) => [
        ...prev,
        {
          time,
          message,
          type
        }
      ]);
    };

    const fetchAssignmentMeta = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/assignments/${assignmentId}`
        );

        if (!res.ok) {
          throw new Error('Assignment not found');
        }

        const data = await res.json();

        dispatch(setCurrentAssignment(data));

        // Already completed
        if (
          data.status === 'completed' &&
          data.questionPaperId
        ) {
          addLog(
            'Assignment already generated. Redirecting...',
            'completed'
          );

          setTimeout(() => {
            router.push(`/assessment/${assignmentId}`);
          }, 1500);

          return;
        }

        // Failed previously
        if (data.status === 'failed') {
          addLog(
            `Generation failed previously: ${data.statusMessage}`,
            'failed'
          );

          return;
        }

        setupWebSocket();
      } catch (err: any) {
        addLog(`Error: ${err.message}`, 'failed');
      }
    };

    const setupWebSocket = () => {
      addLog(
        'Establishing real-time connection with worker...',
        'info'
      );

      const socket = io(SOCKET_URL);

      socketRef.current = socket;

      socket.on('connect', () => {
        addLog(
          'Connected to worker! Listening for updates...',
          'info'
        );

        socket.emit('join-assignment', assignmentId);
      });

      socket.on(
        'progress',
        (data: {
          progress: number;
          status:
          | 'pending'
          | 'processing'
          | 'completed'
          | 'failed';
          message: string;
          paperId?: string;
        }) => {
          dispatch(setGenerationProgress(data));

          let type: 'info' | 'completed' | 'failed' =
            'info';

          if (data.status === 'completed') {
            type = 'completed';
          }

          if (data.status === 'failed') {
            type = 'failed';
          }

          addLog(
            `[${data.progress}%] ${data.message}`,
            type
          );

          if (
            data.status === 'completed' &&
            data.paperId
          ) {
            addLog(
              'Generating complete. Redirecting to paper editor...',
              'completed'
            );

            setTimeout(() => {
              router.push(`/assessment/${assignmentId}`);
            }, 1500);
          }
        }
      );

      socket.on('disconnect', () => {
        addLog(
          'Disconnected from worker service.',
          'info'
        );
      });

      socket.on('connect_error', () => {
        addLog(
          'Failed to connect to real-time socket. Retrying...',
          'info'
        );
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

  // Cancel Button
  const handleCancel = () => {
    router.push('/');
  };

  // Progress Circle
  const percentage =
    generationProgress?.progress || 0;

  const radius = 70;
  const strokeWidth = 10;

  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset =
    circumference -
    (percentage / 100) * circumference;

  const isCompleted =
    generationProgress?.status === 'completed';

  const isFailed =
    generationProgress?.status === 'failed';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div>
          <h1 className={styles.title}>
            {currentAssignment?.title ||
              'Preparing Generation'}
          </h1>

          <p className={styles.subtitle}>
            {isCompleted
              ? 'Assessment created successfully!'
              : isFailed
                ? 'Something went wrong.'
                : 'AI is generating questions and layout structure...'}
          </p>
        </div>

        {/* Progress Ring */}
        <div className={styles.progressRingContainer}>
          <svg
            className={styles.circleSvg}
            width="160"
            height="160"
          >
            <circle
              className={styles.circleBg}
              cx="80"
              cy="80"
              r={radius}
              strokeWidth={strokeWidth}
            />

            <circle
              className={`${styles.circleBar} ${isCompleted
                ? styles.circleBarCompleted
                : isFailed
                  ? styles.circleBarFailed
                  : ''
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
            <span className={styles.percentText}>
              {percentage}%
            </span>

            <span className={styles.statusIcon}>
              {isCompleted ? (
                <CheckCircle2
                  className="text-emerald-400"
                  size={24}
                />
              ) : isFailed ? (
                <XCircle
                  className="text-red-500"
                  size={24}
                />
              ) : (
                <Loader2
                  className="text-indigo-400 animate-spin"
                  size={24}
                />
              )}
            </span>
          </div>
        </div>

        {/* Logs */}
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
              <span className={styles.logTime}>
                [{log.time}]
              </span>

              <span className={styles.logMessage}>
                {log.message}
              </span>
            </div>
          ))}

          {logs.length === 0 && (
            <div className={styles.logLine}>
              <span className={styles.logTime}>
                ...
              </span>

              <span className={styles.logMessage}>
                Queueing job...
              </span>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Button */}
        <button
          onClick={handleCancel}
          className={styles.cancelBtn}
        >
          <ArrowLeft size={16} />

          <span>
            {isCompleted || isFailed
              ? 'Go Back'
              : 'Cancel Generation'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function GenerateProgress() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GenerateProgressContent />
    </Suspense>
  );
}