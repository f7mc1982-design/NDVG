import React, { useState, useEffect } from 'react';
import { dbService } from './services/mockDatabase';
import { User, UserRole } from './types';
import { HomePage } from './components/public/HomePage';
import { PublicVerificationPage } from './components/public/PublicVerificationPage';
import { AuthModal } from './components/public/AuthModal';
import { ApplicantPortal } from './components/applicant/ApplicantPortal';
import { InstitutionPortal } from './components/institution/InstitutionPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import {
  ShieldCheck,
  Search,
  UserCheck,
  Building2,
  Lock,
  LogOut,
  LogIn,
  Home,
  HelpCircle,
  QrCode,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

type AppView = 'HOME' | 'PUBLIC_VERIFY' | 'PORTAL';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('HOME');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [verifyInitialCode, setVerifyInitialCode] = useState<string>('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Sync current user on load and subscribe to updates
  useEffect(() => {
    const user = dbService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    const unsubscribe = dbService.subscribe(() => {
      const updatedUser = dbService.getCurrentUser();
      setCurrentUser(updatedUser);
    });
    return unsubscribe;
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('PORTAL');
  };

  const handleLogout = () => {
    dbService.logoutUser();
    setCurrentUser(null);
    setCurrentView('HOME');
  };

  const handleNavigateToVerify = (initialCode?: string) => {
    if (initialCode) {
      setVerifyInitialCode(initialCode);
    }
    setCurrentView('PUBLIC_VERIFY');
  };

  const handleNavigateToPortal = (role?: string) => {
    if (currentUser) {
      setCurrentView('PORTAL');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleQuickSwitchUser = (email: string) => {
    const user = dbService.loginUser(email);
    if (user) {
      setCurrentUser(user);
      setCurrentView('PORTAL');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Frosted Glass Ambient Lighting Orbs */}
      <div className="fixed top-[-120px] left-[-120px] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-150px] right-[-120px] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="fixed top-1/3 right-[-100px] w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-1/4 left-[-100px] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* Top Test Bench Role Switcher Ribbon - Frosted Glass Bar */}
      <div className="relative z-50 bg-black/30 backdrop-blur-xl border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/30 font-semibold shadow-sm">
            Gateway Node v2.4
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline font-medium">
            Quick Persona Switcher:
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleQuickSwitchUser('applicant@ndvg.gov.pk')}
            className={`px-3 py-1 rounded-xl text-[11px] font-medium transition-all backdrop-blur-md border cursor-pointer ${
              currentUser?.role === 'APPLICANT' && currentView === 'PORTAL'
                ? 'bg-indigo-600/40 border-indigo-400 text-white font-semibold shadow-lg shadow-indigo-500/20'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Applicant (Zeeshan Tariq)
          </button>

          <button
            onClick={() => handleQuickSwitchUser('ayesha.fatima@techcorp.pk')}
            className={`px-3 py-1 rounded-xl text-[11px] font-medium transition-all backdrop-blur-md border cursor-pointer ${
              currentUser?.role === 'INSTITUTION_USER' && currentView === 'PORTAL'
                ? 'bg-cyan-600/40 border-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Institution (Ayesha Fatima)
          </button>

          <button
            onClick={() => handleQuickSwitchUser('consular.attest@embassy.gov.pk')}
            className={`px-3 py-1 rounded-xl text-[11px] font-medium transition-all backdrop-blur-md border cursor-pointer ${
              currentUser?.role === 'INSTITUTION_ADMIN' && currentView === 'PORTAL'
                ? 'bg-purple-600/40 border-purple-400 text-white font-semibold shadow-lg shadow-purple-500/20'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Embassy Admin (Shahid Malik)
          </button>

          <button
            onClick={() => handleQuickSwitchUser('admin.root@ndvg.gov.pk')}
            className={`px-3 py-1 rounded-xl text-[11px] font-medium transition-all backdrop-blur-md border cursor-pointer ${
              currentUser?.role === 'SYSTEM_ADMIN' && currentView === 'PORTAL'
                ? 'bg-emerald-600/40 border-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            System Admin (Dr. Khurram)
          </button>
        </div>
      </div>

      {/* Main App Navigation Bar - Frosted Glass */}
      <header className="sticky top-0 z-40 bg-slate-950/40 backdrop-blur-2xl border-b border-white/10 px-4 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            onClick={() => setCurrentView('HOME')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-all shadow-lg shadow-indigo-500/20 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white group-hover:text-indigo-300 transition">
                  National Document Verification Gateway
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-400/30">
                  GOV.PK
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Ministry of Information Technology & Telecom • NITB National Node
              </p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2">
            <button
              id="btn-nav-home"
              onClick={() => setCurrentView('HOME')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all backdrop-blur-md flex items-center gap-1.5 border ${
                currentView === 'HOME'
                  ? 'bg-white/15 border-white/20 text-white font-semibold shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </button>

            <button
              id="btn-nav-public-verify"
              onClick={() => handleNavigateToVerify()}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all backdrop-blur-md flex items-center gap-1.5 border ${
                currentView === 'PUBLIC_VERIFY'
                  ? 'bg-indigo-600/30 border-indigo-400/50 text-indigo-200 font-semibold shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Public Verification</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <button
                  id="btn-nav-portal-active"
                  onClick={() => setCurrentView('PORTAL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all backdrop-blur-md flex items-center gap-1.5 border ${
                    currentView === 'PORTAL'
                      ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400/40 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>My Portal ({currentUser.role.replace('_', ' ')})</span>
                </button>

                <button
                  id="btn-nav-logout"
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-all border border-white/5"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-nav-login"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal Sign In</span>
              </button>
            )}

            <button
              onClick={() => setIsInfoModalOpen(true)}
              title="System Information & Security Architecture"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all border border-white/5"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 relative z-10">
        {currentView === 'HOME' && (
          <HomePage
            onNavigateToVerify={handleNavigateToVerify}
            onNavigateToPortal={handleNavigateToPortal}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentView === 'PUBLIC_VERIFY' && (
          <PublicVerificationPage initialCode={verifyInitialCode} />
        )}

        {currentView === 'PORTAL' && currentUser && (
          <>
            {currentUser.role === 'APPLICANT' && (
              <ApplicantPortal
                user={currentUser}
                onNavigateToPublicVerify={handleNavigateToVerify}
              />
            )}

            {(currentUser.role === 'INSTITUTION_USER' ||
              currentUser.role === 'INSTITUTION_ADMIN') && (
              <InstitutionPortal
                user={currentUser}
                onNavigateToPublicVerify={handleNavigateToVerify}
              />
            )}

            {currentUser.role === 'SYSTEM_ADMIN' && (
              <AdminPortal
                user={currentUser}
                onNavigateToPublicVerify={handleNavigateToVerify}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950/40 backdrop-blur-xl border-t border-white/10 py-6 px-4 text-center text-xs text-slate-400 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 font-mono text-[11px]">
          <span>Secure Connection: TLS 1.3 / AES-256</span>
          <span>•</span>
          <span>Environment: Simulated Government Adapters v1.0.4</span>
          <span>•</span>
          <span>Digital Signature System: Ed25519 Verified</span>
        </div>
        <p className="text-[11px] text-slate-400">
          © 2026 National Document Verification Gateway. Official Republic Verifiable Credential Service.
        </p>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Architecture & Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900/85 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-2xl w-full p-6 shadow-2xl shadow-indigo-950/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Gateway Architecture & Security Compliance
                </h3>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans max-h-96 overflow-y-auto pr-2">
              <p>
                The <strong>National Document Verification Gateway</strong> enforces the 5-role
                security model and provides end-to-end verifiable credentials.
              </p>
              <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 font-mono text-[11px] space-y-2 text-slate-300">
                <p className="text-indigo-400 font-bold">CORE SECURITY IMPLEMENTATION:</p>
                <p>• <strong>Ed25519 Signing:</strong> Digital signatures generated for every credential payload with key rotation.</p>
                <p>• <strong>Tamper-Evident Ledger:</strong> SHA-256 previous-block hash chaining across all user actions.</p>
                <p>• <strong>State Machine:</strong> 9-step strict lifecycle transition validation.</p>
                <p>• <strong>Verification Adapters:</strong> Modular connector interfaces for Police, NADRA, HEC, and License databases.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                Close Architecture Brief
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
