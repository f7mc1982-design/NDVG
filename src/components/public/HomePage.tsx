import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  FileCheck2,
  Lock,
  QrCode,
  Building2,
  UserCheck,
  Cpu,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface HomePageProps {
  onNavigateToVerify: (initialCode?: string) => void;
  onNavigateToPortal: (role?: string) => void;
  onOpenAuth: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToVerify,
  onNavigateToPortal,
  onOpenAuth,
}) => {
  const [quickCode, setQuickCode] = useState('');

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim()) {
      onNavigateToVerify(quickCode.trim());
    } else {
      onNavigateToVerify();
    }
  };

  return (
    <div className="flex flex-col gap-10 py-8 px-4 max-w-6xl mx-auto">
      {/* Official Government Gateway Hero - Frosted Glass Container */}
      <div className="relative overflow-hidden rounded-[32px] bg-white/[0.04] backdrop-blur-2xl border border-white/10 p-8 md:p-14 shadow-2xl shadow-indigo-950/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 text-xs font-mono mb-6 shadow-sm backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Official National Document Verification Gateway • Tier A Secure Node</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            National Document <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-400">
              Verification Gateway
            </span>
          </h1>

          <p className="mt-4 text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
            A secure digital document verification platform enabling citizens to request official
            verification of police certificates and credentials from issuing authorities, obtain
            digitally signed verifiable credentials, and share authentic proof with named employers,
            embassies, and institutions.
          </p>

          {/* Quick Lookup Box */}
          <form
            onSubmit={handleQuickVerify}
            className="mt-8 w-full max-w-xl flex flex-col sm:flex-row items-center gap-2 p-2 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-2 px-3.5 flex-1 w-full">
              <Search className="w-5 h-5 text-indigo-300" />
              <input
                id="input-home-quick-verify"
                type="text"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value)}
                placeholder="Enter Reference Code (e.g. NDVG-8K2R-9M4Q)"
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none font-mono"
              />
            </div>
            <button
              id="btn-home-verify-submit"
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all cursor-pointer"
            >
              <span>Verify Credential</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Sample quick test tags */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="text-[11px] font-mono">Sample codes:</span>
            <button
              onClick={() => onNavigateToVerify('NDVG-8K2R-9M4Q')}
              className="font-mono text-[11px] px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-emerald-300 border border-emerald-500/30 transition-all backdrop-blur-md cursor-pointer"
            >
              NDVG-8K2R-9M4Q (Genuine - Police Clearance)
            </button>
            <button
              onClick={() => onNavigateToVerify('NDVG-4T7N-3W8L')}
              className="font-mono text-[11px] px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-cyan-300 border border-cyan-500/30 transition-all backdrop-blur-md cursor-pointer"
            >
              NDVG-4T7N-3W8L (Genuine - HEC Attested Degree)
            </button>
            <button
              onClick={() => onNavigateToVerify('NDVG-2X9P-1F5M')}
              className="font-mono text-[11px] px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-rose-300 border border-rose-500/30 transition-all backdrop-blur-md cursor-pointer"
            >
              NDVG-2X9P-1F5M (Not Genuine)
            </button>
            <button
              onClick={() => onNavigateToVerify('NDVG-5L8K-7Y2Z')}
              className="font-mono text-[11px] px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-amber-300 border border-amber-500/30 transition-all backdrop-blur-md cursor-pointer"
            >
              NDVG-5L8K-7Y2Z (Revoked - Court Order)
            </button>
            <button
              onClick={() => onNavigateToVerify('NDVG-9E3X-4P7Q')}
              className="font-mono text-[11px] px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 border border-white/20 transition-all backdrop-blur-md cursor-pointer"
            >
              NDVG-9E3X-4P7Q (Expired)
            </button>
          </div>
        </div>
      </div>

      {/* 3 Core Roles Access Cards - Frosted Glass Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Applicant Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/25 hover:bg-white/[0.07] transition-all group shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">For Applicants</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Request official police character clearance and government document attestation.
              Complete simulated biometric identity confirmation, make payment, and receive digitally
              signed credentials with QR codes.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-indigo-300 font-mono">9-Step Fast Track</span>
            <button
              id="btn-card-applicant-portal"
              onClick={() => onNavigateToPortal('APPLICANT')}
              className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              Applicant Portal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Institution / Recipient Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/25 hover:bg-white/[0.07] transition-all group shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">For Institutions</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Employers, embassies, and universities can review candidate verification submissions,
              manage organization members, monitor digital signature validity, and receive automated
              verification manifests.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-cyan-300 font-mono">Employer & Embassy Portal</span>
            <button
              id="btn-card-institution-portal"
              onClick={() => onNavigateToPortal('INSTITUTION_USER')}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              Institution Portal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Public Verifiers */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/25 hover:bg-white/[0.07] transition-all group shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-purple-500/20">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Public Verification</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Recipients can verify credentials instantly via reference code or QR code scan without
              creating an account. No confidential government internal records are leaked.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-purple-300 font-mono">No Account Required</span>
            <button
              id="btn-card-public-verify"
              onClick={() => onNavigateToVerify()}
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              Public Lookup <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* System Security Features & Compliance */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-[28px] p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              Cryptographic Architecture & Security Standards
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Built strictly to the National Document Verification Gateway Security Specification.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-medium backdrop-blur-md">
              Ed25519 Signed
            </span>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-mono font-medium backdrop-blur-md">
              SHA-256 Hash Chain
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <div className="text-indigo-300 flex items-center gap-1.5 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ed25519 Digital Signatures
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every issued credential is cryptographically signed. Any alteration of names, dates, or
              outcomes immediately breaks signature verification.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <div className="text-indigo-300 flex items-center gap-1.5 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tamper-Evident Audit Ledger
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              All events are linked in a strict cryptographic hash chain. Admin tools allow instant
              verification of chain integrity and anomaly detection.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <div className="text-indigo-300 flex items-center gap-1.5 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero Raw Biometric Retention
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Live biometric liveness verification extracts zero raw biometric templates, ensuring
              full citizen privacy and regulatory compliance.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <div className="text-indigo-300 flex items-center gap-1.5 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Plug-and-Play Adapters
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Police clearance adapter connects with national police databases with transparent
              simulation and live integration interfaces.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
