'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setAssignments,
  addAssignment,
  setCurrentAssignment,
  setLoading
} from '../../store/assignmentSlice';
import { updateProfile, logout } from '../../store/authSlice';
import styles from '../../styles/dashboard.module.css';
import {
  Plus,
  BookOpen,
  Calendar,
  FileText,
  FileUp,
  Sparkles,
  AlertCircle,
  X,
  Search,
  Bell,
  Settings,
  HelpCircle,
  Eye,
  Download,
  Award,
  LogOut,
  Edit2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux Store State
  const { assignments, loading } = useAppSelector((state) => state.assignments);
  const { user, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Visibility State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Student Profile Edit State
  const [editName, setEditName] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editSection, setEditSection] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['mcq', 'short']);
  const [numQuestions, setNumQuestions] = useState('10');
  const [marksPerQuestion, setMarksPerQuestion] = useState('5');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Validation / Error States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guard: Redirect to login page if unauthenticated
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated || !user) {
      router.push('/');
    } else {
      // Prefill profile edit state
      setEditName(user.name);
      setEditRollNo(user.rollNo || '');
      setEditSection(user.section || '');
    }
  }, [isInitialized, isAuthenticated, user, router]);

  // Fetch Assignments on Mount
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAssignments = async () => {
      dispatch(setLoading(true));
      try {
        const res = await fetch(`${API_URL}/api/assignments`);
        if (res.ok) {
          const data = await res.json();
          dispatch(setAssignments(data));
        } else {
          console.error('Failed to fetch assignments');
        }
      } catch (err) {
        console.error('Error fetching assignments:', err);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchAssignments();
  }, [dispatch, isAuthenticated]);

  // Click outside handler for profile dropdown
  useEffect(() => {
    const handleOutsideClick = () => {
      setIsDropdownOpen(false);
    };
    if (isDropdownOpen) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  // Handle Question Types toggle
  const handleTypeToggle = (type: string) => {
    if (questionTypes.includes(type)) {
      setQuestionTypes(questionTypes.filter((t) => t !== type));
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  // Drag & Drop handlers
  const [isDragActive, setIsDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validExtensions = ['.pdf', '.txt', '.md', '.json'];
      const fileExt = droppedFile.name.substring(droppedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (validExtensions.includes(fileExt)) {
        setFile(droppedFile);
        setErrors((prev) => ({ ...prev, file: '' }));
      } else {
        setErrors((prev) => ({ ...prev, file: 'Only PDF, TXT, MD, or JSON files are allowed' }));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  // Stepper helper handlers for Number of Questions and Marks
  const adjustQuestions = (amount: number) => {
    const current = parseInt(numQuestions, 10) || 0;
    const next = Math.max(1, current + amount);
    setNumQuestions(next.toString());
  };

  const adjustMarks = (amount: number) => {
    const current = parseFloat(marksPerQuestion) || 0;
    const next = Math.max(0.5, current + amount);
    setMarksPerQuestion(next.toString());
  };

  // Validate form
  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    if (!title.trim()) tempErrors.title = 'Title is required';
    if (!dueDate) tempErrors.dueDate = 'Due date is required';
    else {
      const selectDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectDate < today) {
        tempErrors.dueDate = 'Due date cannot be in the past';
      }
    }
    if (questionTypes.length === 0) {
      tempErrors.questionTypes = 'Select at least one question type';
    }
    
    const nQ = parseInt(numQuestions, 10);
    if (isNaN(nQ) || nQ <= 0) {
      tempErrors.numQuestions = 'Must be a positive number';
    }
    
    const marks = parseFloat(marksPerQuestion);
    if (isNaN(marks) || marks <= 0) {
      tempErrors.marksPerQuestion = 'Must be a positive number';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    dispatch(setLoading(true));

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('dueDate', dueDate);
      formData.append('questionTypes', questionTypes.join(','));
      formData.append('numQuestions', numQuestions);
      formData.append('marksPerQuestion', marksPerQuestion);
      formData.append('difficulty', difficulty);
      formData.append('additionalInstructions', additionalInstructions);
      
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch(`${API_URL}/api/assignments`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to initiate assignment generation');
      }

      const newAssign = await res.json();
      dispatch(addAssignment(newAssign));
      dispatch(setCurrentAssignment(newAssign));
      setIsFormOpen(false);

      // Redirect to progress page
      router.push(`/generate?id=${newAssign._id}`);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'An error occurred. Please try again.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Profile Edit Save
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      dispatch(updateProfile({
        name: editName.trim(),
        rollNo: editRollNo.trim(),
        section: editSection.trim()
      }));
      setIsProfileOpen(false);
    }
  };

  const handleSidebarItemClick = (assignment: any) => {
    dispatch(setCurrentAssignment(assignment));
    if (assignment.status === 'completed' && assignment.questionPaperId) {
      router.push(`/assessment/${assignment._id}`);
    } else {
      if (user?.role === 'teacher') {
        router.push(`/generate?id=${assignment._id}`);
      } else {
        alert('This assignment paper is currently being generated. Please check back shortly!');
      }
    }
  };

  const handleDownloadPDF = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    window.open(`${API_URL}/api/assignments/${id}/pdf`, '_blank');
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  // Filter assignments based on search query
  const filteredAssignments = assignments.filter((assign) =>
    assign.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isInitialized || !isAuthenticated || !user) {
    return (
      <div className="loadingScreen">
        <div className="spinner"></div>
        <span className="loadingText">Authenticating...</span>
      </div>
    );
  }

  const isTeacher = user.role === 'teacher';
  const userInitials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={styles.container}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logoArea}>
            <BookOpen className={styles.logoIcon} size={24} />
            <span className={styles.logoText}>VedaAI</span>
          </div>

          {/* Conditional Create Button: Hidden for Students */}
          {isTeacher && (
            <button onClick={() => setIsFormOpen(true)} className={styles.newButton}>
              <Plus size={16} />
              <span>Create Assignment</span>
            </button>
          )}

          <h3 className={styles.historyTitle}>Available Assessments</h3>
          
          <ul className={styles.historyList}>
            {assignments.map((assignment) => (
              <li
                key={assignment._id}
                onClick={() => handleSidebarItemClick(assignment)}
                className={styles.historyItem}
              >
                <span className={styles.historyItemTitle}>{assignment.title}</span>
                <div className={styles.historyMeta}>
                  <span>{new Date(assignment.createdAt).toLocaleDateString()}</span>
                  <span
                    className={`${styles.badge} ${
                      assignment.status === 'completed'
                        ? styles.badgeCompleted
                        : assignment.status === 'processing'
                        ? styles.badgeProcessing
                        : assignment.status === 'failed'
                        ? styles.badgeFailed
                        : styles.badgePending
                    }`}
                  >
                    {assignment.status}
                  </span>
                </div>
              </li>
            ))}
            {assignments.length === 0 && (
              <div className="text-center text-xs text-gray-400 py-6">No assessments found</div>
            )}
          </ul>
        </div>

        {/* User profile card at bottom */}
        <div className={styles.profilePanel}>
          <div
            className={styles.profileHeader}
            onClick={() => setIsProfileOpen(true)}
          >
            <div className={styles.avatar}>{userInitials || 'U'}</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>
                {isTeacher ? 'Teacher Profile' : `Student • ${user.rollNo || 'No Roll'}`}
              </span>
            </div>
          </div>
          
          <div className={styles.profileActions}>
            <button
              onClick={() => setIsProfileOpen(true)}
              className={`${styles.actionButton} ${styles.settingsActionButton}`}
              title="Edit Profile"
            >
              <Settings size={13} />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className={`${styles.actionButton} ${styles.logoutActionButton}`}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          {isTeacher ? (
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={16} />
              <input
                type="text"
                placeholder="Search assessments..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          ) : (
            <div className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <span>Welcome,</span>
              <span className="text-orange-600 font-bold">{user.name}</span>
              <span>👋</span>
            </div>
          )}

          <div className={styles.topbarActions}>
            <button className={styles.actionIconBtn} title="Notifications">
              <Bell size={18} />
              <div className={styles.notificationDot} />
            </button>
            <button className={styles.actionIconBtn} title="Help">
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        {/* Dynamic Workspace */}
        <div className={styles.workspace}>
          <div
            className={styles.workspaceHeader}
            style={{ marginBottom: isTeacher ? '24px' : '48px' }} // Added extra spacing after Assignments heading for students
          >
            <h2 className={styles.pageTitle}>Assignments Dashboard</h2>
          </div>

          {/* Empty State */}
          {assignments.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyGraphic}>
                <AlertCircle size={48} />
              </div>
              <h3 className={styles.emptyTitle}>No Assessments Created</h3>
              <p className={styles.emptySubtitle}>
                {isTeacher
                  ? 'Create your very first AI assessment. Fill out the parameters, upload documents, and generate papers instantly.'
                  : 'Welcome! No active assignments are currently allocated by the instructors. Please check back shortly.'}
              </p>
              {isTeacher && (
                <button onClick={() => setIsFormOpen(true)} className={styles.emptyBtn}>
                  <Plus size={16} />
                  <span>Create Assessment</span>
                </button>
              )}
            </div>
          ) : (
            /* Grid View: Card display list */
            <div className={styles.grid}>
              {filteredAssignments.map((assignment) => {
                const hasPaper = assignment.status === 'completed' && assignment.questionPaperId;
                
                return (
                  <div
                    key={assignment._id}
                    className={styles.card}
                    onClick={() => handleSidebarItemClick(assignment)}
                  >
                    <div className={styles.cardHeader}>
                      <h4 className={styles.cardTitle}>{assignment.title}</h4>
                      <span
                        className={`${styles.badge} ${
                          assignment.status === 'completed'
                            ? styles.badgeCompleted
                            : assignment.status === 'processing'
                            ? styles.badgeProcessing
                            : assignment.status === 'failed'
                            ? styles.badgeFailed
                            : styles.badgePending
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </div>

                    <div className={styles.cardDetails}>
                      <div className={styles.cardRow}>
                        <Calendar size={13} className={styles.cardIcon} />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <FileText size={13} className={styles.cardIcon} />
                        <span>Questions: {assignment.numQuestions} items</span>
                      </div>
                      <div className={styles.cardRow}>
                        <Award size={13} className={styles.cardIcon} />
                        <span>Unit Value: {assignment.marksPerQuestion} Marks</span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <button
                        className={`${styles.cardBtn} ${hasPaper ? styles.cardBtnPrimary : ''}`}
                        onClick={() => handleSidebarItemClick(assignment)}
                      >
                        <Eye size={12} />
                        <span>View Paper</span>
                      </button>
                      
                      {hasPaper && (
                        <button
                          className={styles.cardBtn}
                          onClick={(e) => handleDownloadPDF(e, assignment._id)}
                        >
                          <Download size={12} />
                          <span>PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Creator Form Modal Overlay (Teachers Only) */}
      {isFormOpen && isTeacher && (
        <div className={styles.modalOverlay} onClick={() => setIsFormOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New Assignment</h3>
              <button onClick={() => setIsFormOpen(false)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            {submitError && (
              <div className={styles.formError}>
                <AlertCircle size={16} className="inline mr-2" />
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Title */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Assignment Title<span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Operating Systems Mid-Term"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                {errors.title && <span className={styles.validationError}>{errors.title}</span>}
              </div>

              {/* Drag & Drop File Upload */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Source Reference File (Optional)</label>
                {!file ? (
                  <div
                    className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.txt,.md,.json"
                      style={{ display: 'none' }}
                    />
                    <FileUp className={styles.uploadIcon} size={24} />
                    <span className={styles.uploadText}>
                      Drag and drop files or <span className="text-orange-500 font-semibold">browse</span>
                    </span>
                    <span className={styles.uploadHint}>Supports PDF, TXT, MD (Max 10MB)</span>
                  </div>
                ) : (
                  <div className={styles.selectedFileCard}>
                    <div className={styles.fileName}>
                      <FileText size={16} className="text-orange-500" />
                      <span>{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className={styles.removeFileBtn}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {errors.file && <span className={styles.validationError}>{errors.file}</span>}
              </div>

              {/* Due Date & Difficulty pills */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Due Date<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  {errors.dueDate && <span className={styles.validationError}>{errors.dueDate}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Difficulty Level</label>
                  <div className={styles.pillGroup}>
                    {(['easy', 'medium', 'hard', 'mixed'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`${styles.pillButton} ${
                          difficulty === level ? styles.pillButtonActive : ''
                        }`}
                      >
                        {level === 'easy'
                          ? 'Easy'
                          : level === 'medium'
                          ? 'Mod'
                          : level === 'hard'
                          ? 'Hard'
                          : 'Mix'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Steppers for Question Count & Marks */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Number of Questions</label>
                  <div className={styles.stepperWrapper}>
                    <button
                      type="button"
                      onClick={() => adjustQuestions(-1)}
                      className={styles.stepperBtn}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(e.target.value.replace(/\D/g, ''))}
                      className={styles.stepperInput}
                    />
                    <button
                      type="button"
                      onClick={() => adjustQuestions(1)}
                      className={styles.stepperBtn}
                    >
                      +
                    </button>
                  </div>
                  {errors.numQuestions && (
                    <span className={styles.validationError}>{errors.numQuestions}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Marks per Question</label>
                  <div className={styles.stepperWrapper}>
                    <button
                      type="button"
                      onClick={() => adjustMarks(-0.5)}
                      className={styles.stepperBtn}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={marksPerQuestion}
                      onChange={(e) => setMarksPerQuestion(e.target.value.replace(/[^\d.]/g, ''))}
                      className={styles.stepperInput}
                    />
                    <button
                      type="button"
                      onClick={() => adjustMarks(0.5)}
                      className={styles.stepperBtn}
                    >
                      +
                    </button>
                  </div>
                  {errors.marksPerQuestion && (
                    <span className={styles.validationError}>{errors.marksPerQuestion}</span>
                  )}
                </div>
              </div>

              {/* Question Types checkboxes */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Question Types<span className={styles.required}>*</span>
                </label>
                <div className={styles.checkboxGroup}>
                  <label
                    className={`${styles.checkboxLabel} ${
                      questionTypes.includes('mcq') ? styles.checkboxChecked : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={questionTypes.includes('mcq')}
                      onChange={() => handleTypeToggle('mcq')}
                      className={styles.checkboxInput}
                    />
                    Multiple Choice
                  </label>

                  <label
                    className={`${styles.checkboxLabel} ${
                      questionTypes.includes('short') ? styles.checkboxChecked : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={questionTypes.includes('short')}
                      onChange={() => handleTypeToggle('short')}
                      className={styles.checkboxInput}
                    />
                    Short Answer
                  </label>

                  <label
                    className={`${styles.checkboxLabel} ${
                      questionTypes.includes('long') ? styles.checkboxChecked : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={questionTypes.includes('long')}
                      onChange={() => handleTypeToggle('long')}
                      className={styles.checkboxInput}
                    />
                    Long Essay
                  </label>
                </div>
                {errors.questionTypes && (
                  <span className={styles.validationError}>{errors.questionTypes}</span>
                )}
              </div>

              {/* Additional Instructions */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Additional Instructions (Optional)</label>
                <textarea
                  placeholder="Include specific focus areas, structure limits, or styles..."
                  rows={3}
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  maxLength={500}
                />
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                <Sparkles size={16} />
                <span>Generate Assessment</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal Overlay (All Users) */}
      {isProfileOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsProfileOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Profile Settings</h3>
              <button onClick={() => setIsProfileOpen(false)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProfileSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Aman Sharma"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Account Role</label>
                <input
                  type="text"
                  value={isTeacher ? 'Teacher' : 'Student'}
                  className="bg-gray-100 text-gray-500 font-bold"
                  disabled
                />
              </div>

              {/* Conditional Candidate fields (Students Only) */}
              {!isTeacher && (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Roll Number</label>
                    <input
                      type="text"
                      value={editRollNo}
                      onChange={(e) => setEditRollNo(e.target.value)}
                      placeholder="e.g. CS-4102"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Section</label>
                    <input
                      type="text"
                      value={editSection}
                      onChange={(e) => setEditSection(e.target.value)}
                      placeholder="e.g. B"
                    />
                  </div>
                </div>
              )}

              <button type="submit" className={styles.submitBtn}>
                <Edit2 size={16} />
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
