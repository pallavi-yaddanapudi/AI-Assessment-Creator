'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  setCurrentAssignment,
  setCurrentPaper,
  setLoading,
  updateQuestion
} from '../../../store/assignmentSlice';
import styles from '../../../styles/assessment.module.css';
import {
  Download,
  RotateCw,
  ArrowLeft,
  Save,
  Check,
  Loader2,
  Calendar,
  Award
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AssessmentView({ params }: { params: { id: string } }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const assignmentId = params.id;

  // Redux store state selectors
  const { currentAssignment, currentPaper, loading } = useAppSelector(
    (state) => state.assignments
  );
  const { user, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  // Student details form state
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [section, setSection] = useState('');

  // Inline editing state
  const [editingIndex, setEditingIndex] = useState<{ secIdx: number; qIdx: number } | null>(null);
  const [editingText, setEditingText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Guard: Redirect to home login page if not logged in
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated || !user) {
      router.push('/');
    }
  }, [isInitialized, isAuthenticated, user, router]);

  // Fetch assignment & paper details
  useEffect(() => {
    if (!assignmentId || !isAuthenticated) return;

    const fetchAssessmentDetails = async () => {
      dispatch(setLoading(true));
      try {
        // Fetch assignment metadata
        const assignmentRes = await fetch(`${API_URL}/api/assignments/${assignmentId}`);
        if (!assignmentRes.ok) throw new Error('Assignment not found');
        const assignmentData = await assignmentRes.json();
        dispatch(setCurrentAssignment(assignmentData));

        // Fetch question paper
        const paperRes = await fetch(`${API_URL}/api/assignments/${assignmentId}/paper`);
        if (paperRes.ok) {
          const paperData = await paperRes.json();
          dispatch(setCurrentPaper(paperData));
        } else {
          console.error('Failed to fetch question paper');
        }
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchAssessmentDetails();
  }, [assignmentId, dispatch, isAuthenticated]);

  // Pre-fill student info based on user profile if student role is active
  useEffect(() => {
    if (user && user.role === 'student') {
      setStudentName(user.name);
      setRollNo(user.rollNo || '');
      setSection(user.section || '');
    }
  }, [user]);

  // Handle inline edit save (only allowed for teachers)
  const handleInlineSave = (secIdx: number, qIdx: number) => {
    if (editingText.trim()) {
      dispatch(updateQuestion({ sectionIndex: secIdx, questionIndex: qIdx, text: editingText }));
      setHasChanges(true);
    }
    setEditingIndex(null);
  };

  // Submit changes to backend
  const savePaperChanges = async () => {
    if (!currentPaper) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/paper`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: currentPaper.sections })
      });

      if (!res.ok) throw new Error('Failed to update question paper');
      
      const updatedPaper = await res.json();
      dispatch(setCurrentPaper(updatedPaper));
      setHasChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      alert('Error saving changes to server');
      setSaveStatus('idle');
    }
  };

  // Trigger PDF download
  const handleDownloadPDF = () => {
    if (!assignmentId) return;
    window.open(`${API_URL}/api/assignments/${assignmentId}/pdf`, '_blank');
  };

  // Trigger paper regeneration
  const handleRegenerate = async () => {
    if (!confirm('Are you sure you want to regenerate this question paper? This will delete the current questions and create a new set.')) {
      return;
    }
    
    dispatch(setLoading(true));
    try {
      const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/regenerate`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Failed to queue regeneration');
      const data = await res.json();
      dispatch(setCurrentAssignment(data));
      dispatch(setCurrentPaper(null));
      
      router.push(`/generate?id=${assignmentId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to trigger regeneration');
      dispatch(setLoading(false));
    }
  };

  if (!isInitialized || !isAuthenticated || !user) {
    return (
      <div className="loadingScreen">
        <div className="spinner"></div>
        <span className="loadingText">Authenticating...</span>
      </div>
    );
  }

  const isTeacher = user.role === 'teacher';

  if (loading && !currentPaper) {
    return (
      <div className={styles.container}>
        <div className="flex flex-col items-center gap-4 text-center mt-32">
          <Loader2 className="animate-spin text-orange-500" size={48} />
          <p className="text-gray-500 font-semibold">Loading assessment layout...</p>
        </div>
      </div>
    );
  }

  if (!currentPaper || !currentAssignment) {
    return (
      <div className={styles.container}>
        <div className="text-center mt-32 max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">Question Paper Not Found</h2>
          <p className="text-gray-500 mb-6">
            The requested assessment paper is not available. Please verify the URL or create a new assignment.
          </p>
          <button onClick={() => router.push('/dashboard')} className={styles.actionBtn}>
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate total paper marks
  let totalMarks = 0;
  currentPaper.sections.forEach((sec) => {
    sec.questions.forEach((q) => {
      totalMarks += q.marks;
    });
  });

  return (
    <div className={styles.container}>
      {/* Split Grid Layout mimicking Figma Screen 4 */}
      <div className={styles.splitLayout}>
        
        {/* Left Side: Crisp White A4 Paper Preview */}
        <div className={styles.paperWrapper}>
          <article className={styles.paperSheet}>
            {/* Academic Curved Dark Header Banner */}
            <header className={styles.institutionBanner}>
              <span className={styles.institution}>DELHI PUBLIC SCHOOL, SECTOR 4, DWARKA</span>
              <h1 className={styles.paperTitle}>{currentAssignment.title}</h1>
              <div className={styles.paperMeta}>
                <span className="flex items-center gap-1">
                  Time: 2 Hours
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  Max Marks: {totalMarks}
                </span>
              </div>
            </header>

            {/* Student Info Area (Print Style) */}
            <section className={styles.studentInfo}>
              <div className={styles.infoField}>
                <span>NAME:</span>
                <input
                  type="text"
                  className={styles.infoInput}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter candidate name"
                  disabled={!isTeacher} // Students profile pre-fills automatically
                />
              </div>
              <div className={styles.infoField}>
                <span>ROLL NO:</span>
                <input
                  type="text"
                  className={styles.infoInput}
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. CS2104"
                  disabled={!isTeacher}
                />
              </div>
              <div className={styles.infoField}>
                <span>SEC:</span>
                <input
                  type="text"
                  className={styles.infoInput}
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. A"
                  disabled={!isTeacher}
                />
              </div>
            </section>

            {/* Instructions box */}
            {currentAssignment.additionalInstructions && (
              <div className="text-xs text-gray-500 bg-slate-50 border border-slate-200 rounded-sm p-3">
                <span className="font-bold text-slate-700 block mb-1">Instructions to Candidates:</span>
                <p className="italic leading-relaxed">{currentAssignment.additionalInstructions}</p>
              </div>
            )}

            {/* Render sections & questions */}
            {currentPaper.sections.map((sec, secIdx) => (
              <section key={sec._id || secIdx} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{sec.title}</h2>
                  <p className={styles.sectionInstruction}>{sec.instruction}</p>
                </div>

                <div className={styles.questionList}>
                  {sec.questions.map((q, qIdx) => {
                    const isEditing = editingIndex?.secIdx === secIdx && editingIndex?.qIdx === qIdx;
                    
                    return (
                      <div
                        key={q._id || qIdx}
                        className={styles.questionCard}
                        onClick={() => {
                          // Inline editing is only triggered for teachers
                          if (!isEditing && isTeacher) {
                            setEditingIndex({ secIdx, qIdx });
                            setEditingText(q.text);
                          }
                        }}
                      >
                        <div className={styles.questionTop}>
                          <div className={styles.questionBody}>
                            <span className={styles.qIndex}>{qIdx + 1}.</span>
                            {!isEditing ? (
                              <p className={styles.qText}>{q.text}</p>
                            ) : (
                              <div
                                className={styles.editContainer}
                                onClick={(e) => e.stopPropagation()} // Prevent card click triggers
                              >
                                <textarea
                                  className={styles.editTextarea}
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  rows={3}
                                  autoFocus
                                />
                                <div className={styles.editActions}>
                                  <button
                                    onClick={() => handleInlineSave(secIdx, qIdx)}
                                    className={styles.saveBtnInline}
                                  >
                                    Done
                                  </button>
                                  <button
                                    onClick={() => setEditingIndex(null)}
                                    className={styles.cancelBtnInline}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className={styles.qMeta}>
                            <span
                              className={`${styles.diffBadge} ${
                                q.difficulty === 'Easy'
                                  ? styles.diffEasy
                                  : q.difficulty === 'Moderate'
                                  ? styles.diffModerate
                                  : styles.diffHard
                              }`}
                            >
                              {q.difficulty}
                            </span>
                            <span className={styles.marksBadge}>{q.marks}M</span>
                          </div>
                        </div>

                        {/* MCQ Options Rendering */}
                        {q.options && q.options.length > 0 && !isEditing && (
                          <div className={styles.optionsGrid}>
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className={styles.optionItem}>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </article>
        </div>

        {/* Right Side: Options Panel Sidebar */}
        <aside className={styles.sidebarPanel}>
          <h3 className={styles.panelTitle}>Assessment Editor</h3>
          
          <div className={styles.panelDetails}>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Status:</span>
              <span className="text-emerald-600 font-bold text-xs uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm inline-block w-fit">
                Completed
              </span>
            </div>
            
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Total Questions:</span>
              <span className={styles.panelValue}>{currentAssignment.numQuestions} Questions</span>
            </div>
            
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Total Unit Marks:</span>
              <span className={styles.panelValue}>{totalMarks} Marks</span>
            </div>

            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Due Date:</span>
              <span className={styles.panelValue}>
                {new Date(currentAssignment.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className={styles.actionsGroup}>
            {/* Conditional Controls based on user role */}
            {isTeacher && hasChanges && (
              <button
                onClick={savePaperChanges}
                disabled={saveStatus === 'saving'}
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              >
                <Save size={14} />
                <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}

            {isTeacher && saveStatus === 'success' && (
              <div className={styles.saveSuccessBadge}>
                <Check size={14} />
                <span>Saved successfully</span>
              </div>
            )}

            <button
              onClick={handleDownloadPDF}
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>

            {isTeacher && (
              <button onClick={handleRegenerate} className={styles.actionBtn}>
                <RotateCw size={14} />
                <span>Regenerate Paper</span>
              </button>
            )}

            <button onClick={() => router.push('/dashboard')} className={styles.actionBtn}>
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}
