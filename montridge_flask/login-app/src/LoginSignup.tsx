import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';

// Use relative URL so it works whether accessed via localhost or 127.0.0.1
const API_URL = '';

// Mouse tracking hook
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return mousePosition;
};

// Dark techy animated background
const EnhancedBackground = () => {
  const mousePosition = useMousePosition();

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Static radial glow centered */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,180,216,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Primary mouse glow */}
      <motion.div
        animate={{ left: mousePosition.x, top: mousePosition.y }}
        transition={{ type: 'spring', stiffness: 25, damping: 20, mass: 1 }}
        className="absolute w-96 h-96 -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle, rgba(0,180,216,0.08) 0%, rgba(0,180,216,0.02) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Secondary glow */}
      <motion.div
        animate={{ left: mousePosition.x, top: mousePosition.y }}
        transition={{ type: 'spring', stiffness: 40, damping: 25, mass: 0.8 }}
        className="absolute w-64 h-64 -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle, rgba(0,136,168,0.06) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Subtle grid pattern */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(0,180,216,0.03)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          animate={{
            y: ['0vh', '100vh'],
            x: Math.sin(i * 0.5) * 100,
            opacity: [0, 0.5, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 12 + Math.random() * 12,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 8,
          }}
          style={{
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            background:
              i % 2 === 0
                ? 'rgba(0,180,216,0.45)'
                : 'rgba(0,136,168,0.3)',
            left: `${(i * 5) % 100}%`,
          }}
        />
      ))}

      {/* Corner orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.04, 0.1, 0.04] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 -left-40 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,180,216,0.25), transparent)',
          filter: 'blur(100px)',
        }}
      />
      <motion.div
        animate={{ scale: [1.3, 1, 1.3], opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-0 -right-40 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,136,168,0.2), transparent)',
          filter: 'blur(120px)',
        }}
      />

      {/* Pulsing rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ring-${i}`}
          animate={{ scale: [1, 2.5], opacity: [0.15, 0] }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.6,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '100px',
            height: '100px',
            border: '1px solid rgba(0,180,216,0.2)',
          }}
        />
      ))}
    </div>
  );
};

// Password strength helper
const getPasswordStrength = (pw: string): { level: number; label: string; color: string } => {
  if (pw.length === 0) return { level: 0, label: '', color: '' };
  if (pw.length < 8) return { level: 1, label: 'Weak', color: '#EF4444' };
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (score <= 2) return { level: 2, label: 'Medium', color: '#F59E0B' };
  return { level: 3, label: 'Strong', color: '#00B4D8' };
};

export default function LoginSignup() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // TODO: wire to backend if name field added to users table
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Field-level errors for signup client-side validation
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const passwordStrength = getPasswordStrength(password);

  const switchMode = (tab: 'login' | 'signup') => {
    setMode(tab);
    setError('');
    setSuccess('');
    setFieldErrors({});
  };

  const validateSignup = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!email.includes('@')) errors.email = 'Enter a valid email address.';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signup' && !validateSignup()) return;

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload =
        mode === 'login' ? { email, password } : { email, password, name };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Incorrect email or password.');
        } else if (response.status === 409) {
          setError('An account with this email already exists.');
        } else if (response.status === 400) {
          setError(data.error || 'Invalid request. Please check your details.');
        } else {
          setError(data.error || 'An error occurred. Please try again.');
        }
        return;
      }

      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('email', data.email);
      localStorage.removeItem('guestMode');

      setSuccess('Success! Redirecting...');
      setTimeout(() => {
        window.location.href = mode === 'signup' ? '/onboarding' : '/dashboard';
      }, 1200);
    } catch {
      setError('Unable to connect. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem('guestMode', 'true');
    localStorage.removeItem('jwt_token');
    window.location.href = '/dashboard';
  };

  // Shared input style factory
  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '8px',
    padding: '12px 12px 12px 40px',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'box-shadow 0.2s, border-color 0.2s',
  };

  const inputFocusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,180,216,0.3)';
      e.currentTarget.style.borderColor = '#00B4D8';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = '#1a1a1a';
    },
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: '#000000' }}
    >
      <EnhancedBackground />

      {/* Back link */}
      <a
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        style={{
          backgroundColor: 'rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: '#94A3B8',
          backdropFilter: 'blur(16px)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = '#00B4D8';
          (e.currentTarget as HTMLAnchorElement).style.borderColor =
            'rgba(0,180,216,0.3)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8';
          (e.currentTarget as HTMLAnchorElement).style.borderColor =
            'rgba(255,255,255,0.06)';
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back
      </a>

      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Card */}
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            {/* Top accent line */}
            <div
              style={{
                height: '2px',
                background: 'linear-gradient(to right, transparent, #00B4D8, transparent)',
              }}
            />

            <div className="p-8 md:p-9">
              {/* Logo + Wordmark */}
              <div className="flex flex-col items-center mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                      <path d="M 15 65 V 15 L 40 40 L 65 15 V 65" fill="white" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span
                    style={{
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '1rem',
                      letterSpacing: '0.12em',
                    }}
                  >
                    MONTRIDGE
                  </span>
                </motion.div>

                {/* Mode heading */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode + '-heading'}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-center mt-6"
                  >
                    <h1
                      style={{
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        marginBottom: '4px',
                      }}
                    >
                      {mode === 'login' ? 'Welcome back' : 'Create your account'}
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
                      {mode === 'login'
                        ? 'Sign in to your account'
                        : 'Join Montridge for free'}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Tab switcher */}
              <div
                className="flex mb-6 p-1 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {(['login', 'signup'] as const).map((tab) => (
                  <motion.button
                    key={tab}
                    onClick={() => switchMode(tab)}
                    className="flex-1 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all"
                    style={{
                      backgroundColor:
                        mode === tab ? '#00B4D8' : 'transparent',
                      color: mode === tab ? '#FFFFFF' : '#94A3B8',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tab === 'login' ? 'Sign In' : 'Sign Up'}
                  </motion.button>
                ))}
              </div>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={mode}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Error banner */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg flex gap-2 items-start"
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                      }}
                    >
                      <AlertCircle
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: '#EF4444' }}
                      />
                      <p style={{ color: '#FCA5A5', fontSize: '0.8rem' }}>{error}</p>
                    </motion.div>
                  )}

                  {/* Success banner */}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg flex gap-2 items-start"
                      style={{
                        backgroundColor: 'rgba(0,180,216,0.1)',
                        border: '1px solid rgba(0,180,216,0.3)',
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#00B4D8' }} />
                      <p style={{ color: '#00B4D8', fontSize: '0.8rem' }}>{success}</p>
                    </motion.div>
                  )}

                  {/* Full Name — signup only */}
                  {mode === 'signup' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <label
                        className="block mb-1.5 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#94A3B8' }}
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                          style={{ color: '#94A3B8' }}
                        />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          style={{ ...inputStyle }}
                          {...inputFocusHandlers}
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Email */}
                  <div>
                    <label
                      className="block mb-1.5 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#94A3B8' }}
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: '#94A3B8' }}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={{ ...inputStyle }}
                        {...inputFocusHandlers}
                        required
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#94A3B8' }}
                      >
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          className="text-xs font-medium transition-colors"
                          style={{ color: '#00B4D8' }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.color = '#0088A8')
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.color = '#00B4D8')
                          }
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: '#94A3B8' }}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ ...inputStyle, paddingRight: '40px' }}
                        {...inputFocusHandlers}
                        required
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#94A3B8' }}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.button>
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>
                        {fieldErrors.password}
                      </p>
                    )}
                    {/* Password strength bar — signup only */}
                    {mode === 'signup' && password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3].map((seg) => (
                            <div
                              key={seg}
                              className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor:
                                  passwordStrength.level >= seg
                                    ? passwordStrength.color
                                    : 'rgba(255,255,255,0.08)',
                              }}
                            />
                          ))}
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: passwordStrength.color }}
                        >
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password — signup only */}
                  {mode === 'signup' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <label
                        className="block mb-1.5 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#94A3B8' }}
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                          style={{ color: '#94A3B8' }}
                        />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          style={{ ...inputStyle, paddingRight: '40px' }}
                          {...inputFocusHandlers}
                          required
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: '#94A3B8' }}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                      {fieldErrors.confirmPassword && (
                        <p className="mt-1 text-xs" style={{ color: '#EF4444' }}>
                          {fieldErrors.confirmPassword}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Primary submit button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: '#00B4D8',
                      color: '#FFFFFF',
                      padding: '12px',
                      fontSize: '0.9rem',
                      opacity: loading ? 0.7 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginTop: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading)
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          '#0088A8';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        '#00B4D8';
                    }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : mode === 'login' ? (
                      'Sign In'
                    ) : (
                      'Create Account'
                    )}
                  </motion.button>

                  {/* Divider */}
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div
                        className="w-full"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                      />
                    </div>
                    <div className="relative flex justify-center">
                      <span
                        className="px-3 text-xs"
                        style={{ backgroundColor: 'rgba(0,0,0,0.9)', color: '#94A3B8' }}
                      >
                        or
                      </span>
                    </div>
                  </div>

                  {/* Guest button */}
                  <motion.button
                    type="button"
                    onClick={handleContinueAsGuest}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #1a1a1a',
                      color: '#94A3B8',
                      padding: '12px',
                      fontSize: '0.9rem',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        'rgba(0,180,216,0.3)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        '#1a1a1a';
                      (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
                    }}
                  >
                    Continue as Guest
                  </motion.button>
                </motion.form>
              </AnimatePresence>

              {/* Mode switch link */}
              <p
                className="text-xs text-center mt-5"
                style={{ color: '#94A3B8' }}
              >
                {mode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <motion.button
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  whileHover={{ scale: 1.05 }}
                  className="font-semibold transition-colors"
                  style={{ color: '#00B4D8' }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color = '#0088A8')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color = '#00B4D8')
                  }
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </motion.button>
              </p>
            </div>

            {/* Bottom accent line */}
            <div
              style={{
                height: '1px',
                background:
                  'linear-gradient(to right, transparent, rgba(0,180,216,0.2), transparent)',
              }}
            />
          </div>

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs flex items-center justify-center gap-2 mt-6"
            style={{ color: '#94A3B8' }}
          >
            <CheckCircle2 className="w-4 h-4" style={{ color: '#00B4D8' }} />
            Enterprise-grade encryption
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
