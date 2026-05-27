'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../store';
import { loginSuccess } from '../store/authSlice';
import styles from '../styles/login.module.css';
import {
  BookOpen,
  Sparkles,
  Lock,
  ArrowRight,
  UserCheck,
  Award,
  BookOpenCheck
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  // Authentication mode tabs: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  
  // Student specific inputs
  const [rollNo, setRollNo] = useState('');
  const [section, setSection] = useState('');

  // Local validation error
  const [error, setError] = useState<string | null>(null);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Helper to extract a clean name from email
  const getNameFromEmail = (emailStr: string): string => {
    const username = emailStr.split('@')[0];
    const nameParts = username.split(/[._-]/);
    return nameParts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  };

  // Form submission handler
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Please provide your name.');
      return;
    }

    const payloadName = mode === 'register' ? name.trim() : getNameFromEmail(email.trim());
    
    const userPayload = {
      name: payloadName,
      email: email.trim(),
      role,
      ...(role === 'student' ? {
        rollNo: rollNo.trim() || 'CS-4102',
        section: section.trim() || 'B'
      } : {})
    };

    dispatch(loginSuccess(userPayload));
    router.push('/dashboard');
  };

  // Demo Login Quick-Triggers
  const triggerDemoTeacher = () => {
    const teacherPayload = {
      name: 'Pratik Patil',
      email: 'teacher@veda.ai',
      role: 'teacher' as const
    };
    dispatch(loginSuccess(teacherPayload));
    router.push('/dashboard');
  };

  const triggerDemoStudent = () => {
    const studentPayload = {
      name: 'Aman Sharma',
      email: 'student@veda.ai',
      role: 'student' as const,
      rollNo: 'CS-4102',
      section: 'B'
    };
    dispatch(loginSuccess(studentPayload));
    router.push('/dashboard');
  };

  if (!isInitialized) {
    return (
      <div className="loadingScreen">
        <div className="spinner"></div>
        <span className="loadingText">VedaAI Loading...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.portalCard}>
        
        {/* Left Side: VedaAI Brand Banner */}
        <section className={styles.brandBanner}>
          <div className={styles.brandHeader}>
            <BookOpen className={styles.brandLogo} size={28} />
            <span className={styles.brandTitle}>VedaAI</span>
          </div>

          <div className={styles.brandHeroText}>
            <h1 className={styles.heroHeading}>
              Academic assessments, <span>reinvented.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Create structured, syllabus-aligned exam question papers from reference documents using artificial intelligence in under a minute.
            </p>
          </div>

          <div className={styles.brandFooter}>
            <Sparkles size={14} className="text-orange-400" />
            <span>Powering Next-Gen Classrooms</span>
          </div>
        </section>

        {/* Right Side: Log In Card & Forms */}
        <section className={styles.formSide}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Welcome to VedaAI</h2>
            <p className={styles.formSubtitle}>Sign in to access your classroom assessment panel.</p>
          </div>

          {/* Mode Switch Tabs */}
          <div className={styles.tabs}>
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`${styles.tabBtn} ${mode === 'login' ? styles.tabBtnActive : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`${styles.tabBtn} ${mode === 'register' ? styles.tabBtnActive : ''}`}
            >
              Register
            </button>
          </div>

          {error && <div className={styles.validationError}>{error}</div>}

          <form onSubmit={handleAuthSubmit} className={styles.form}>
            <div className={styles.formFields}>
              {/* Conditional Name Input (Register Only) */}
              {mode === 'register' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>FULL NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Aman Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Email Address */}
              <div className={styles.formGroup}>
                <label className={styles.label}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className={styles.formGroup}>
                <label className={styles.label}>PASSWORD</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Account Role Selector */}
              <div className={styles.formGroup}>
                <label className={styles.label}>SELECT ROLE</label>
                <div className={styles.roleSelector}>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`${styles.roleBtn} ${role === 'teacher' ? styles.roleBtnActive : ''}`}
                  >
                    Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`${styles.roleBtn} ${role === 'student' ? styles.roleBtnActive : ''}`}
                  >
                    Student
                  </button>
                </div>
              </div>

              {/* Conditional Student Fields (Register + Student Role Only) */}
              {mode === 'register' && role === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>ROLL NUMBER</label>
                    <input
                      type="text"
                      placeholder="e.g. CS-4102"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>SECTION</label>
                    <input
                      type="text"
                      placeholder="e.g. B"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className={styles.submitBtn}>
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className={styles.demoSection}>
            <span className={styles.demoTitle}>One-Click Demo Portals</span>
            <div className={styles.demoGrid}>
              <button onClick={triggerDemoTeacher} className={styles.demoBtn}>
                <span>Demo: Teacher Account</span>
              </button>
              <button onClick={triggerDemoStudent} className={styles.demoBtn}>
                <span>Demo: Student Account</span>
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
