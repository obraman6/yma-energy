import React, { useState } from 'react';
import { X, User as UserIcon, Lock, Mail, Phone, UserPlus, LogIn, KeyRound, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { login, register, resetPassword, isLoading } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [resetMessage, setResetMessage] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'login') {
      if (!email.trim() || !password) {
        showToast({
          title: 'Taarifa Hazijakamilika',
          message: 'Tafadhali weka barua pepe na nenosiri (email na password).',
          type: 'warning',
        });
        return;
      }
      const result = await login(email.trim(), password);
      
      if (result.success && result.user) {
        showToast({
          title: 'Umeingia Mfomoni! 🔑',
          message: `Karibu tena, ${result.user.name} (${result.user.role})`,
          type: 'success',
        });
        onLoginSuccess?.(result.user.role);
        onClose();
      } else {
        showToast({
          title: 'Akaunti Haipatikani! ❌',
          message: result.message || 'Tafadhali kagua email au password na ujaribu tena.',
          type: 'warning',
        });
      }
    } else if (mode === 'forgot') {
      if (!email.trim()) {
        showToast({
          title: 'Barua Pepe Inatakiwa',
          message: 'Tafadhali ingiza barua pepe yako (email).',
          type: 'warning',
        });
        return;
      }
      const res = await resetPassword(email.trim());
      setResetMessage(res.message);
      showToast({
        title: 'Maelekezo Yametumwa! 📩',
        message: 'If an account with this email exists, a password reset link has been sent.',
        type: 'success',
      });
    } else {
      // REGISTER MODE
      if (!name.trim() || !email.trim()) {
        showToast({
          title: 'Taarifa Hazijakamilika',
          message: 'Tafadhali jaza Jina Kamili na Barua Pepe.',
          type: 'warning',
        });
        return;
      }

      if (password.length < 6) {
        showToast({
          title: 'Nenosiri Dhaifu',
          message: 'Nenosiri lazima liwe na angalau herufi au namba 6.',
          type: 'warning',
        });
        return;
      }

      if (password !== confirmPassword) {
        showToast({
          title: 'Nenosiri Halifanani!',
          message: 'Tafadhali hakikisha nenosiri na uthibitisho wa nenosiri vinafanana.',
          type: 'warning',
        });
        return;
      }

      // PUBLIC SIGNUP STRICTLY FORCES CUSTOMER ROLE ONLY
      const res = await register(
        name.trim(),
        email.trim(),
        phone.trim() || '+255 700 000 000',
        password
      );

      if (res.success && res.user) {
        showToast({
          title: 'Akaunti ya Mteja Imetengenezwa! 🔥',
          message: `Akaunti ya ${res.user.name} imehifadhiwa kikamilifu kwenye database. Role: Customer`,
          type: 'success',
        });
        onLoginSuccess?.('CUSTOMER');
        onClose();
      } else {
        showToast({
          title: 'Hitilafu ya Usajili ❌',
          message: res.message || 'Kuna tatizo katika kusajili akaunti.',
          type: 'warning',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {mode === 'login' ? (
              <LogIn className="w-5 h-5 text-amber-500" />
            ) : mode === 'forgot' ? (
              <KeyRound className="w-5 h-5 text-amber-500" />
            ) : (
              <UserPlus className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <h2 className="text-base font-bold">
                {mode === 'login'
                  ? 'YMA Energy Login'
                  : mode === 'forgot'
                  ? 'Kusahau Nenosiri (Forgot Password)'
                  : 'Fungua Akaunti Mpya'}
              </h2>
              <p className="text-[11px] text-slate-300">
                {mode === 'login'
                  ? 'Ingia katika mfumo wa YMA Energy'
                  : mode === 'forgot'
                  ? 'Weka email yako ili kupokea kiungo cha kubadilisha nenosiri'
                  : 'Usajili mpya wa wateja (Customer Account)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {mode === 'register' && (
            <>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Usajili wa Mteja Tu:</strong> Akaunti mpya inasajiliwa kiotomatiki kama <strong>Customer</strong>. Akaunti za Admin/Manager hutengenezwa tu na Utawala.
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Jina Kamili (Full Name) *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="mf. Hassan Juma"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Namba ya Simu (Phone Number)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255 754 000 111"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Barua Pepe (Email Address) *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mteja@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nenosiri (Password) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Thibitisha Nenosiri (Confirm Password) *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs hover:text-slate-900 dark:hover:text-white"
              >
                {rememberMe ? (
                  <CheckSquare className="w-4 h-4 text-amber-500" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Remember Me</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResetMessage('');
                  setMode('forgot');
                }}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {mode === 'forgot' && resetMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
              {resetMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Inashughulikia...</span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : mode === 'forgot' ? (
              'Send Reset Link'
            ) : (
              'Create Account'
            )}
          </button>

          <div className="text-center pt-2 space-y-2">
            {mode === 'login' && (
              <div className="text-slate-500 text-xs">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  Create Account
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div className="text-slate-500 text-xs">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  Sign In
                </button>
              </div>
            )}

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-600 dark:text-slate-400 font-bold hover:underline block w-full text-xs"
              >
                ← Back to Login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};


