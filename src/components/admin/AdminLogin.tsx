import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, X, CheckCircle2, ShieldAlert, ArrowLeft, KeyRound, Send, Inbox, ExternalLink, RefreshCw } from 'lucide-react';
import { HERO_ASSETS } from '../../data/bakeryData';
import { getSupabaseClient, initSupabaseFromRemote } from '../../lib/supabase';

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
  onReturnToStore: () => void;
}

type AuthViewMode = 'login' | 'forgot_password' | 'email_sent' | 'set_new_password';

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onReturnToStore }) => {
  const [viewMode, setViewMode] = useState<AuthViewMode>('login');
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset / Forgot Password fields
  const [resetEmail, setResetEmail] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // New Password definition fields (after clicking email link)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // --- Handlers ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      await initSupabaseFromRemote();
      const supabase = getSupabaseClient();

      if (!supabase) {
        throw new Error('Supabase client is not connected. Please verify your Supabase configuration.');
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (authError) {
        throw authError;
      }

      if (data?.user || data?.session) {
        onLoginSuccess(data.user?.email || cleanEmail);
      } else {
        throw new Error('Authentication failed. No active session returned.');
      }
    } catch (err: any) {
      console.error('Supabase authentication error:', err);
      const errMsg = err?.message || 'Invalid administrative credentials. Please verify your email and password.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);

    const cleanResetEmail = resetEmail.trim();
    if (!cleanResetEmail || !cleanResetEmail.includes('@')) {
      setSendError('Please enter a valid administrative email address.');
      return;
    }

    setSendLoading(true);

    try {
      await initSupabaseFromRemote();
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client is not connected.');
      }

      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/?admin_reset=true` : undefined;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanResetEmail, {
        redirectTo
      });

      if (resetErr) {
        throw resetErr;
      }

      setViewMode('email_sent');
      setResendCooldown(30);
    } catch (err: any) {
      console.error('Supabase password reset error:', err);
      setSendError(err?.message || 'Failed to send password reset email. Please verify the email address.');
    } finally {
      setSendLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !resetEmail.trim()) return;
    setSendLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/?admin_reset=true` : undefined;
        await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo });
      }
      setResendCooldown(30);
    } catch (err) {
      console.error('Failed to resend reset email:', err);
    } finally {
      setSendLoading(false);
    }
  };

  const handleSimulateClickEmailLink = () => {
    // When user checks their email and clicks the reset link:
    setResetError(null);
    setResetSuccess(false);
    setNewPassword('');
    setConfirmPassword('');
    setViewMode('set_new_password');
  };

  const handleSetNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('New password and confirmation password do not match.');
      return;
    }

    setResetLoading(true);

    try {
      await initSupabaseFromRemote();
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client is not connected.');
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword.trim()
      });

      if (updateErr) {
        throw updateErr;
      }

      setResetSuccess(true);
      setPassword(newPassword); // Pre-populate for immediate sign-in convenience
    } catch (err: any) {
      console.error('Supabase password update error:', err);
      setResetError(err?.message || 'Failed to update password.');
    } finally {
      setResetLoading(false);
    }
  };

  const switchToForgotPassword = () => {
    setError(null);
    setSendError(null);
    setResetError(null);
    setResetSuccess(false);
    setViewMode('forgot_password');
  };

  const switchToLogin = () => {
    setError(null);
    setSendError(null);
    setResetError(null);
    setViewMode('login');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-white text-[#4a170a]" id="admin-auth-screen">
      
      {/* ========================================================================= */}
      {/* LEFT SECTION: Split Screen Image Banner */}
      {/* ========================================================================= */}
      <div 
        className="relative w-full lg:w-1/2 min-h-[340px] sm:min-h-[420px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 text-white overflow-hidden bg-[#1f0904]"
        id="admin-auth-left-banner"
      >
        {/* Background Image */}
        <img
          src={HERO_ASSETS.heroShowcase}
          alt="Freshly baked artisan breads and pastries at Shey's Bakery"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Gradient Overlay for high-contrast legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f0904] via-[#2d0e06]/85 to-[#1f0904]/75 pointer-events-none" />

        {/* Top Header on Left Panel: Brand */}
        <div className="relative z-10 flex items-center">
          <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-amber-200/90">
            Shey's Bakery &bull; Artisan Kitchen Ops
          </span>
        </div>

        {/* Center / Hero Typography: Dynamic based on mode */}
        <div className="relative z-10 my-auto py-8 sm:py-12 max-w-lg">
          {viewMode === 'login' && (
            <>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                Welcome Admin
              </h1>
              <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-normal">
                Access real-time oven capacity planning, kitchen order dispatch, artisan recipe inventory, and store analytics.
              </p>
            </>
          )}

          {viewMode === 'forgot_password' && (
            <>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                Account Recovery
              </h1>
              <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-normal">
                Enter your administrative email to receive an instant, secure password reset link directly in your inbox.
              </p>
            </>
          )}

          {viewMode === 'email_sent' && (
            <>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                Check Your Inbox
              </h1>
              <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-normal">
                We've dispatched a secure reset link. Open your email message and click the link to define your new master password.
              </p>
            </>
          )}

          {viewMode === 'set_new_password' && (
            <>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                Set New Password
              </h1>
              <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-normal">
                Choose a strong master password to protect your bakery management dashboard and administrative controls.
              </p>
            </>
          )}
        </div>

        {/* Bottom Left Footer Tag */}
        <div className="relative z-10 text-[11px] text-amber-200/60 flex items-center justify-between">
          <span>Pasig City Kitchen Hub #1</span>
          <span>Supabase Auth Ready &bull; v2.4</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION: Flat Surface (Consistent layout across all auth states) */}
      {/* ========================================================================= */}
      <div 
        className="relative w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14"
        id="admin-auth-right-section"
      >
        {/* Far Right Top Close (X) Button */}
        <button
          onClick={onReturnToStore}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 p-2 rounded-full text-stone-400 hover:text-[#4a170a] hover:bg-stone-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d94d2f]/20 z-20"
          aria-label="Close Admin Login and Return to Store"
          title="Return to Storefront"
          id="admin-close-auth-btn"
        >
          <X className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* =================================================================== */}
        {/* VIEW 1: SIGN IN FORM */}
        {/* =================================================================== */}
        {viewMode === 'login' && (
          <div className="w-full max-w-md mx-auto my-auto animate-fadeIn" id="admin-credentials-flat-surface">
            
            <div className="mb-9">
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#4a170a] mb-2.5 tracking-tight">
                Sign In to Your Dashboard
              </h2>
              <p className="text-sm text-stone-500">
                Please enter your administrative credentials below to proceed.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-6" id="admin-login-form">
              
              <div className="space-y-2.5">
                <label 
                  htmlFor="admin-email-input" 
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d94d2f] focus:ring-2 focus:ring-[#d94d2f]/15 transition-all text-[#4a170a] bg-stone-50/70 hover:bg-stone-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label 
                  htmlFor="admin-password-input" 
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d94d2f] focus:ring-2 focus:ring-[#d94d2f]/15 transition-all text-[#4a170a] bg-stone-50/70 hover:bg-stone-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1.5 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    id="admin-toggle-password-visibility-btn"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={switchToForgotPassword}
                    className="text-xs font-bold text-[#d94d2f] hover:text-[#c03d21] hover:underline cursor-pointer"
                    id="admin-forgot-password-btn"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  id="admin-submit-login-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-center cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: FORGOT PASSWORD (STEP 1: Input Email to receive link) */}
        {/* =================================================================== */}
        {viewMode === 'forgot_password' && (
          <div className="w-full max-w-md mx-auto my-auto animate-fadeIn" id="admin-forgot-step1-surface">
            
            <div className="mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#4a170a] mb-2.5 tracking-tight">
                Reset Admin Password
              </h2>
              <p className="text-sm text-stone-500">
                Enter your admin email to reset your password.
              </p>
            </div>

            {sendError && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{sendError}</span>
              </div>
            )}

            <form onSubmit={handleSendResetEmail} className="space-y-5" id="admin-send-reset-email-form">
              
              <div className="space-y-2">
                <label 
                  htmlFor="admin-reset-email-input" 
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-reset-email-input"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d94d2f] focus:ring-2 focus:ring-[#d94d2f]/15 transition-all text-[#4a170a] bg-stone-50/70 hover:bg-stone-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="admin-send-reset-link-btn"
                  type="submit"
                  disabled={sendLoading}
                  className="w-full bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-center cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-75"
                >
                  {sendLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Link</span>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-xs font-bold text-stone-500 hover:text-[#4a170a] cursor-pointer"
                  id="admin-cancel-forgot-btn"
                >
                  Return to Sign-In
                </button>
              </div>

            </form>

          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 3: EMAIL DISPATCHED (STEP 2: Instructions & Click Link) */}
        {/* =================================================================== */}
        {viewMode === 'email_sent' && (
          <div className="w-full max-w-md mx-auto my-auto animate-fadeIn space-y-6" id="admin-email-sent-surface">
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-[#d94d2f] rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <Inbox className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight">
                Check Your Email
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
                We've sent a password reset link to <br/>
                <strong className="text-[#4a170a] font-bold">{resetEmail}</strong>
              </p>
            </div>

            {/* Email Message Preview / Simulator Card */}
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Incoming Admin Email
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">Just now</span>
              </div>

              <div className="text-xs text-stone-700 space-y-2">
                <p className="font-semibold text-stone-900">
                  Subject: Reset Your Shey's Bakery Admin Password
                </p>
                <p className="text-stone-600 leading-relaxed">
                  You requested to reset your password. Click the verification button below to set a new password:
                </p>
              </div>

              {/* Action Button: Click to simulate opening the email reset link */}
              <button
                type="button"
                onClick={handleSimulateClickEmailLink}
                className="w-full bg-[#4a170a] hover:bg-[#340f06] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                id="admin-open-email-link-btn"
              >
                <span>Click Here to Reset Password</span>
                <ExternalLink className="w-4 h-4 text-amber-200" />
              </button>

              <p className="text-[11px] text-stone-400 text-center italic">
                (Clicking above simulates opening the link from your email inbox)
              </p>
            </div>

            {/* Resend & Return Links */}
            <div className="space-y-3 pt-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-stone-500">Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={sendLoading}
                  className="text-xs font-bold text-[#d94d2f] hover:text-[#c03d21] hover:underline cursor-pointer inline-flex items-center gap-1"
                  id="admin-resend-reset-email-btn"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sendLoading ? 'animate-spin' : ''}`} />
                  <span>Resend Email</span>
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-xs font-bold text-stone-500 hover:text-[#4a170a] cursor-pointer inline-flex items-center gap-1"
                  id="admin-return-to-signin-link"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 4: SET NEW PASSWORD (STEP 3: When reset link is clicked) */}
        {/* =================================================================== */}
        {viewMode === 'set_new_password' && (
          <div className="w-full max-w-md mx-auto my-auto animate-fadeIn" id="admin-set-new-password-surface">
            
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Token for {resetEmail}</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#4a170a] mb-2.5 tracking-tight">
                Create New Password
              </h2>
              <p className="text-sm text-stone-500">
                Please enter and confirm your new master admin password below.
              </p>
            </div>

            {resetError && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2.5">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-black text-base text-emerald-950">Password Updated Successfully!</h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Your new admin password has been set. You can now proceed to your administrative dashboard.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={switchToLogin}
                  className="w-full bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-center cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.99]"
                  id="admin-proceed-to-login-btn"
                >
                  <span>Proceed to Sign In</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSetNewPasswordSubmit} className="space-y-5" id="admin-set-new-password-form">
                
                {/* New Password */}
                <div className="space-y-2">
                  <label 
                    htmlFor="admin-new-password-input" 
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700"
                  >
                    New Password
                  </label>

                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-new-password-input"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d94d2f] focus:ring-2 focus:ring-[#d94d2f]/15 transition-all text-[#4a170a] bg-stone-50/70 hover:bg-stone-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1.5 transition-colors"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      id="admin-toggle-new-pwd-btn"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label 
                    htmlFor="admin-confirm-password-input" 
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700"
                  >
                    Confirm New Password
                  </label>

                  <div className="relative">
                    <Lock className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-confirm-password-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d94d2f] focus:ring-2 focus:ring-[#d94d2f]/15 transition-all text-[#4a170a] bg-stone-50/70 hover:bg-stone-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1.5 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      id="admin-toggle-confirm-pwd-btn"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Reset Button */}
                <div className="pt-2">
                  <button
                    id="admin-submit-new-pwd-btn"
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-center cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-75"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password & Save</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Back Link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-xs font-bold text-stone-500 hover:text-[#4a170a] cursor-pointer"
                    id="admin-cancel-new-pwd-btn"
                  >
                    Return to Sign-In
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
