import React, { useState } from 'react';
import { dbService } from '../../services/mockDatabase';
import { User, UserRole } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  Lock,
  Mail,
  KeyRound,
  User as UserIcon,
  Phone,
  CreditCard,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');

  // Login form
  const [loginEmail, setLoginEmail] = useState('applicant@ndvg.gov.pk');
  const [loginPassword, setLoginPassword] = useState('GovSecPassword2026!');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNationalId, setRegNationalId] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Password reset
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const user = dbService.loginUser(loginEmail);
    if (user) {
      onLoginSuccess(user);
      onClose();
    } else {
      setErrorMessage('User with specified email address was not found in registry.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!regName || !regEmail || !regNationalId) {
      setErrorMessage('Please fill in all mandatory applicant details.');
      return;
    }
    const newUser = dbService.registerApplicant(regName, regEmail, regNationalId, regPhone);
    onLoginSuccess(newUser);
    onClose();
  };

  const handleQuickPersona = (email: string) => {
    const user = dbService.loginUser(email);
    if (user) {
      onLoginSuccess(user);
      onClose();
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl shadow-indigo-950/60 flex flex-col">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl px-7 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/20 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gateway Authentication</h3>
              <p className="text-[11px] text-slate-300 font-mono">National Citizen & Agency Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-white/10 bg-black/20 p-1.5 text-xs font-semibold">
          <button
            onClick={() => {
              setTab('LOGIN');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 rounded-2xl transition-all cursor-pointer ${
              tab === 'LOGIN' ? 'bg-white/15 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Portal Login
          </button>
          <button
            onClick={() => {
              setTab('REGISTER');
              setErrorMessage('');
            }}
            className={`flex-1 py-2.5 rounded-2xl transition-all cursor-pointer ${
              tab === 'REGISTER' ? 'bg-white/15 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Applicant Registration
          </button>
          <button
            onClick={() => {
              setTab('FORGOT');
              setErrorMessage('');
              setResetSent(false);
            }}
            className={`flex-1 py-2.5 rounded-2xl transition-all cursor-pointer ${
              tab === 'FORGOT' ? 'bg-white/15 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Password Reset
          </button>
        </div>

        <div className="p-7 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-300" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Persona Switcher Bar for Seamless Testing */}
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider block mb-2 font-semibold">
              Instant 1-Click Role Switcher (Test Personas):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPersona('applicant@ndvg.gov.pk')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/40 text-left transition-all text-xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-semibold text-white truncate text-[11px]">Applicant</p>
                  <p className="text-[10px] text-slate-300 truncate">Muhammad Zeeshan Tariq</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('ayesha.fatima@techcorp.pk')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-left transition-all text-xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-semibold text-white truncate text-[11px]">Institution User</p>
                  <p className="text-[10px] text-slate-300 truncate">Syeda Ayesha (Systems Ltd)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('consular.attest@embassy.gov.pk')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-400/40 text-left transition-all text-xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-semibold text-white truncate text-[11px]">Embassy Admin</p>
                  <p className="text-[10px] text-slate-300 truncate">Shahid Malik (Consular)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPersona('admin.root@ndvg.gov.pk')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 text-left transition-all text-xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-semibold text-white truncate text-[11px]">System Admin</p>
                  <p className="text-[10px] text-slate-300 truncate">Dr. Khurram (NITB SecOps)</p>
                </div>
              </button>
            </div>
          </div>

          {/* Login Form */}
          {tab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
              >
                <span>Authenticate & Open Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Registration Form */}
          {tab === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Legal Name (as on CNIC / Smart Card)</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Zeeshan Tariq"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="applicant@domain.pk"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">National ID / CNIC</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="35201-7894561-3"
                      value={regNationalId}
                      onChange={(e) => setRegNationalId(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-white font-mono focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mobile Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      placeholder="+92 (300) 845-9214"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Create Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
              >
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Password Reset */}
          {tab === 'FORGOT' && (
            <div className="space-y-3.5 text-xs">
              {resetSent ? (
                <div className="p-5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-center space-y-2 backdrop-blur-md">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="font-semibold text-sm text-white">Reset Instructions Dispatched</h4>
                  <p className="text-xs text-slate-300">
                    A secure password recovery link has been sent to your registered email address.
                  </p>
                  <button
                    onClick={() => setTab('LOGIN')}
                    className="mt-2 text-xs text-indigo-300 font-semibold underline cursor-pointer"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <p className="text-slate-300 text-xs">
                    Enter your registered email address to receive a secure one-time password reset token.
                  </p>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">Registered Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-white font-mono focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all cursor-pointer"
                  >
                    Send Password Reset Link
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
