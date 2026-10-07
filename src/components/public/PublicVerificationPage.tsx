import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/mockDatabase';
import { CryptoService } from '../../services/cryptoService';
import { DigitalCredential } from '../../types';
import { SignedCertificateModal } from '../applicant/SignedCertificateModal';
import { QrCodeViewer } from '../common/QrCodeViewer';
import { CredentialStatusBadge } from '../common/CredentialStatusBadge';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Building,
  User,
  Calendar,
  Lock,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Camera,
  RefreshCw,
  Clock,
  Layers,
  FileCheck2,
  Download,
  Plus,
  Trash2,
  CheckCheck,
  ListFilter,
  BadgeAlert,
} from 'lucide-react';

interface PublicVerificationPageProps {
  initialCode?: string;
}

export const PublicVerificationPage: React.FC<PublicVerificationPageProps> = ({ initialCode = '' }) => {
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BATCH'>('SINGLE');

  // Single verification state
  const [referenceCode, setReferenceCode] = useState(initialCode || '');
  const [searchedCode, setSearchedCode] = useState('');
  const [credential, setCredential] = useState<DigitalCredential | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [signatureVerification, setSignatureVerification] = useState<{
    isValid: boolean;
    reason?: string;
    calculatedHash: string;
  } | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [modalCredential, setModalCredential] = useState<DigitalCredential | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Batch verification state
  const [batchRawInput, setBatchRawInput] = useState('');
  const [batchCodesList, setBatchCodesList] = useState<string[]>([
    'NDVG-8K2R-9M4Q',
    'NDVG-4T7N-3W8L',
    'NDVG-5L8K-7Y2Z',
  ]);
  const [singleBatchInput, setSingleBatchInput] = useState('');
  const [batchResults, setBatchResults] = useState<{
    results: Array<{
      code: string;
      credential: DigitalCredential | null;
      signatureVerification: {
        isValid: boolean;
        reason?: string;
        calculatedHash: string;
      } | null;
      status: 'FOUND' | 'NOT_FOUND';
    }>;
    summary: {
      total: number;
      found: number;
      notFound: number;
      valid: number;
      invalid: number;
      expired: number;
      revoked: number;
    };
  } | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchFilter, setBatchFilter] = useState<'ALL' | 'VALID' | 'REVOKED' | 'INVALID' | 'NOT_FOUND'>('ALL');
  const [batchExportCopied, setBatchExportCopied] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setReferenceCode(initialCode);
      performLookup(initialCode);
    }
  }, [initialCode]);

  const performLookup = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setSearchedCode(cleanCode);
    setHasSearched(true);

    const found = dbService.recordPublicVerificationAccess(cleanCode);
    if (found) {
      setCredential(found);
      const sigCheck = CryptoService.verifyCredentialSignature(found);
      setSignatureVerification(sigCheck);
    } else {
      setCredential(null);
      setSignatureVerification(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(referenceCode);
  };

  const handleSimulateQrScan = (codeToScan: string) => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      setIsSimulatingScan(false);
      setReferenceCode(codeToScan);
      performLookup(codeToScan);
    }, 500);
  };

  const handleCopyUrl = () => {
    if (credential) {
      navigator.clipboard.writeText(credential.verification_url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // --- Batch Handlers ---
  const handleAddCodeToBatch = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean && !batchCodesList.includes(clean)) {
      setBatchCodesList([...batchCodesList, clean]);
      setSingleBatchInput('');
    }
  };

  const handleRemoveCodeFromBatch = (code: string) => {
    setBatchCodesList(batchCodesList.filter((c) => c !== code));
  };

  const handleLoadBatchPreset = (presetName: 'DOSSIER' | 'MIXED' | 'HEC_POLICE') => {
    if (presetName === 'DOSSIER') {
      // Full genuine dossier: Police + HEC degree
      setBatchCodesList(['NDVG-8K2R-9M4Q', 'NDVG-4T7N-3W8L']);
    } else if (presetName === 'MIXED') {
      // All states: genuine, degree, revoked, invalid, expired
      setBatchCodesList([
        'NDVG-8K2R-9M4Q',
        'NDVG-4T7N-3W8L',
        'NDVG-5L8K-7Y2Z',
        'NDVG-9E3X-4P7Q',
        'NDVG-2X9P-1F5M',
        'NDVG-INVALID-999',
      ]);
    } else if (presetName === 'HEC_POLICE') {
      setBatchCodesList(['NDVG-8K2R-9M4Q', 'NDVG-4T7N-3W8L']);
    }
  };

  const handleExecuteBatchCheck = (codesToCheck?: string[]) => {
    const targetCodes = codesToCheck || batchCodesList;
    if (targetCodes.length === 0) return;

    setIsBatchRunning(true);
    setTimeout(() => {
      const outcome = dbService.recordBatchPublicVerificationAccess(targetCodes);
      setBatchResults(outcome);
      setIsBatchRunning(false);
    }, 450);
  };

  const handleParseRawInput = () => {
    if (!batchRawInput.trim()) return;
    const extracted = batchRawInput
      .split(/[\s,;\n\t]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length > 3);

    const merged = Array.from(new Set([...batchCodesList, ...extracted]));
    setBatchCodesList(merged);
    setBatchRawInput('');
  };

  const handleExportBatchAuditJson = () => {
    if (!batchResults) return;
    const jsonStr = JSON.stringify(batchResults, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDVG-Batch-Verification-Dossier-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBatchExportCopied(true);
    setTimeout(() => setBatchExportCopied(false), 2500);
  };

  const openCertModal = (cred: DigitalCredential) => {
    setModalCredential(cred);
    setIsCertModalOpen(true);
  };

  const filteredBatchItems = batchResults?.results.filter((item) => {
    if (batchFilter === 'ALL') return true;
    if (batchFilter === 'VALID') return item.credential?.status === 'VALID';
    if (batchFilter === 'REVOKED') return item.credential?.status === 'REVOKED';
    if (batchFilter === 'INVALID') return item.credential?.status === 'INVALID';
    if (batchFilter === 'NOT_FOUND') return item.status === 'NOT_FOUND';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/20 backdrop-blur-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-indigo-300 tracking-wider uppercase font-semibold">
                  Public Verification Gateway
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-400/30">
                  FREE & PUBLIC
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">Official Credential Authenticator</h2>
              <p className="text-xs text-slate-300">
                Instantly check single or multi-document batches issued by government authorities.
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center p-1.5 bg-black/40 backdrop-blur-xl border border-white/15 rounded-2xl">
            <button
              onClick={() => setActiveTab('SINGLE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'SINGLE'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              Single Document
            </button>
            <button
              onClick={() => {
                setActiveTab('BATCH');
                if (!batchResults && batchCodesList.length > 0) {
                  handleExecuteBatchCheck();
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'BATCH'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              Multi-Document / Batch
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {batchCodesList.length}
              </span>
            </button>
          </div>
        </div>

        {/* --- TAB 1: SINGLE VERIFICATION --- */}
        {activeTab === 'SINGLE' && (
          <div className="mt-6">
            {/* Quick preset buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10 mb-4">
              <span className="text-[10px] text-slate-400 font-mono px-1">Test Samples:</span>
              <button
                onClick={() => handleSimulateQrScan('NDVG-8K2R-9M4Q')}
                className="text-[11px] font-mono px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all cursor-pointer backdrop-blur-md shadow-sm"
              >
                NDVG-8K2R-9M4Q (Police Clearance)
              </button>
              <button
                onClick={() => handleSimulateQrScan('NDVG-4T7N-3W8L')}
                className="text-[11px] font-mono px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl transition-all cursor-pointer backdrop-blur-md shadow-sm"
              >
                NDVG-4T7N-3W8L (HEC Degree)
              </button>
              <button
                onClick={() => handleSimulateQrScan('NDVG-5L8K-7Y2Z')}
                className="text-[11px] font-mono px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl transition-all cursor-pointer backdrop-blur-md shadow-sm"
              >
                NDVG-5L8K-7Y2Z (Revoked)
              </button>
              <button
                onClick={() => handleSimulateQrScan('NDVG-9E3X-4P7Q')}
                className="text-[11px] font-mono px-2.5 py-1 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 border border-slate-500/30 rounded-xl transition-all cursor-pointer backdrop-blur-md shadow-sm"
              >
                NDVG-9E3X-4P7Q (Expired)
              </button>
              <button
                onClick={() => handleSimulateQrScan('NDVG-2X9P-1F5M')}
                className="text-[11px] font-mono px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl transition-all cursor-pointer backdrop-blur-md shadow-sm"
              >
                NDVG-2X9P-1F5M (Tampered)
              </button>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-5 h-5 text-indigo-300" />
                </div>
                <input
                  id="input-public-verification-code"
                  type="text"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
                  placeholder="Enter Document Reference Code (e.g. NDVG-8K2R-9M4Q)"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl text-white font-mono text-sm tracking-wider focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 shadow-inner"
                />
              </div>

              <button
                id="btn-public-verify-execute"
                type="submit"
                disabled={isSimulatingScan}
                className="px-7 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSimulatingScan ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Checking Digital Seal...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Verify Single Document
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* --- TAB 2: MULTI-DOCUMENT / BATCH VERIFICATION INPUT --- */}
        {activeTab === 'BATCH' && (
          <div className="mt-6 space-y-4">
            {/* Batch description & quick load */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white">Batch Checking Mode:</span> Verify
                complete candidate dossiers (Degrees, Police Clearances, Licenses) in a single run.
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-mono">Dossier Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    handleLoadBatchPreset('DOSSIER');
                    handleExecuteBatchCheck(['NDVG-8K2R-9M4Q', 'NDVG-4T7N-3W8L']);
                  }}
                  className="text-[11px] font-mono px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition cursor-pointer"
                >
                  Candidate Pack (2 Genuine)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLoadBatchPreset('MIXED');
                    handleExecuteBatchCheck([
                      'NDVG-8K2R-9M4Q',
                      'NDVG-4T7N-3W8L',
                      'NDVG-5L8K-7Y2Z',
                      'NDVG-9E3X-4P7Q',
                      'NDVG-2X9P-1F5M',
                      'NDVG-INVALID-999',
                    ]);
                  }}
                  className="text-[11px] font-mono px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl transition cursor-pointer"
                >
                  Mixed Security Batch (6 Docs)
                </button>
              </div>
            </div>

            {/* Dynamic Code Chips & Add Bar */}
            <div className="p-4 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Target Documents in Batch ({batchCodesList.length})
                </span>
                {batchCodesList.length > 0 && (
                  <button
                    onClick={() => {
                      setBatchCodesList([]);
                      setBatchResults(null);
                    }}
                    className="text-[11px] text-rose-300 hover:text-rose-200 flex items-center gap-1 font-mono transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear List
                  </button>
                )}
              </div>

              {/* Chips list */}
              <div className="flex flex-wrap gap-2 min-h-[42px] p-2 bg-white/5 rounded-xl border border-white/10 items-center">
                {batchCodesList.length === 0 ? (
                  <span className="text-xs text-slate-400 italic px-2">
                    No reference codes in batch. Add codes below or paste multiple codes.
                  </span>
                ) : (
                  batchCodesList.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-mono rounded-xl shadow-sm"
                    >
                      {code}
                      <button
                        type="button"
                        onClick={() => handleRemoveCodeFromBatch(code)}
                        className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add single code or paste multi codes */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1">
                <div className="md:col-span-5 flex gap-2">
                  <input
                    type="text"
                    value={singleBatchInput}
                    onChange={(e) => setSingleBatchInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCodeToBatch(singleBatchInput);
                      }
                    }}
                    placeholder="Add code (NDVG-XXXX-XXXX)"
                    className="flex-1 px-3 py-2 bg-white/10 rounded-xl border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCodeToBatch(singleBatchInput)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium border border-white/15 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                <div className="md:col-span-4 flex gap-2">
                  <input
                    type="text"
                    value={batchRawInput}
                    onChange={(e) => setBatchRawInput(e.target.value)}
                    placeholder="Paste comma/space separated codes"
                    className="flex-1 px-3 py-2 bg-white/10 rounded-xl border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={handleParseRawInput}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium border border-white/15 cursor-pointer"
                  >
                    Import
                  </button>
                </div>

                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={() => handleExecuteBatchCheck()}
                    disabled={isBatchRunning || batchCodesList.length === 0}
                    className="w-full h-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 text-white text-xs font-semibold rounded-xl border border-indigo-400/30 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                  >
                    {isBatchRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-3.5 h-3.5" />
                        Verify Batch ({batchCodesList.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- SINGLE VERIFICATION RESULT VIEW --- */}
      {activeTab === 'SINGLE' && hasSearched && (
        <div className="flex flex-col gap-6">
          {credential ? (
            /* Genuine or Found Document Detail Card */
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-950/40">
              {/* Result Header Banner */}
              <div
                className={`p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b ${
                  credential.status === 'VALID'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : credential.status === 'REVOKED'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                      credential.status === 'VALID'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/20'
                        : credential.status === 'REVOKED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-amber-500/20'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-rose-500/20'
                    }`}
                  >
                    {credential.status === 'VALID' ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : credential.status === 'REVOKED' ? (
                      <AlertTriangle className="w-8 h-8" />
                    ) : (
                      <XCircle className="w-8 h-8" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-white tracking-wide">
                        {credential.reference_code}
                      </span>
                      <CredentialStatusBadge status={credential.status} />
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          credential.result === 'GENUINE'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                        }`}
                      >
                        {credential.result === 'GENUINE' ? 'GENUINE ATTESTATION' : 'COUNTERFEIT / INVALID'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mt-1">
                      {credential.document_type_name}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-indigo-300" />
                      Issued by: {credential.issuer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto">
                  <button
                    onClick={() => openCertModal(credential)}
                    className="flex-1 md:flex-none px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-semibold border border-white/20 shadow-md backdrop-blur-md flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Signed Certificate
                  </button>
                </div>
              </div>

              {/* Main Information Grid */}
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <span className="text-[11px] text-slate-400 font-medium">Subject / Applicant Name</span>
                      <p className="text-sm font-semibold text-white mt-1">{credential.applicant_name}</p>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                        CNIC / ID: {credential.applicant_id_masked}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <span className="text-[11px] text-slate-400 font-medium">Authorized Recipient</span>
                      <p className="text-sm font-semibold text-white mt-1">{credential.recipient}</p>
                      <span className="text-[10px] text-indigo-300 mt-0.5 block">{credential.purpose}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <span className="text-[11px] text-slate-400 font-medium">Attestation Timestamp</span>
                      <p className="text-xs font-mono text-white mt-1">
                        {new Date(credential.issued_at).toLocaleString()}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Expires: {new Date(credential.expires_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <span className="text-[11px] text-slate-400 font-medium">Verification Access Telemetry</span>
                      <p className="text-xs font-mono text-white mt-1">
                        Verified {credential.access_count} time(s)
                      </p>
                      <span className="text-[10px] text-emerald-400">Public Verifier Audit Logged</span>
                    </div>
                  </div>

                  {credential.status === 'REVOKED' && (
                    <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs">
                      <div className="flex items-center gap-2 text-rose-300 font-bold mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        OFFICIAL REVOCATION NOTICE
                      </div>
                      <p className="text-white">{credential.revocation_reason}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Revoked on {new Date(credential.revoked_at || '').toLocaleString()} by{' '}
                        {credential.revoked_by}
                      </p>
                    </div>
                  )}
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md text-center">
                  <span className="text-xs font-mono font-semibold text-slate-300 mb-3">
                    Cryptographic Verification QR
                  </span>
                  <div className="p-3 bg-white rounded-2xl shadow-xl">
                    <QrCodeViewer value={credential.verification_url} size={150} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-3">
                    Scan with any standard QR scanner
                  </span>
                </div>
              </div>

              {/* Cryptographic Signature Verification Bar */}
              <div className="p-6 bg-white/[0.02] border-t border-white/10">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-mono font-bold text-slate-200">
                      Ed25519 Cryptographic Signature Attestation
                    </span>
                  </div>

                  {signatureVerification && (
                    <span
                      className={`text-xs font-mono px-3 py-1 rounded-full font-bold flex items-center gap-1 border backdrop-blur-md ${
                        signatureVerification.isValid
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                      }`}
                    >
                      {signatureVerification.isValid ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          VALID DIGITAL SIGNATURE
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          SIGNATURE TAMPERED
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10 font-mono text-[11px] text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Algorithm / Key:</span>
                    <span className="text-slate-200">
                      {credential.signature_algorithm} ({credential.key_version})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payload SHA-256 Digest:</span>
                    <span className="text-emerald-400 truncate max-w-xs">{credential.payload_hash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Signature:</span>
                    <span className="text-slate-300 truncate max-w-xs">{credential.signature}</span>
                  </div>
                </div>

                {/* Sharing URL */}
                <div className="mt-4 flex items-center justify-between gap-3 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-xs">
                  <span className="text-slate-300 font-mono truncate text-[11px]">
                    Share URL: {credential.verification_url}
                  </span>
                  <button
                    onClick={handleCopyUrl}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 transition-all cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUrl ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Not Found Screen */
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] p-10 text-center flex flex-col items-center justify-center shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 mb-4 shadow-lg shadow-rose-500/20">
                <XCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Credential Not Found</h3>
              <p className="text-xs text-slate-300 mt-2 max-w-md">
                No official verification record exists for reference code{' '}
                <span className="font-mono text-rose-400 font-semibold">{searchedCode}</span>. Please verify
                the code or contact the applicant.
              </p>
              <div className="mt-6 p-4 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 text-xs text-slate-300 font-mono text-left max-w-md">
                <p className="font-bold text-white">Security Guidance:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-[11px] text-slate-400">
                  <li>Reference codes are strictly formatted like NDVG-XXXX-XXXX</li>
                  <li>Check our Multi-Document batch mode if you have a full dossier to verify at once.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: MULTI-DOCUMENT / BATCH RESULTS VIEW --- */}
      {activeTab === 'BATCH' && batchResults && (
        <div className="space-y-6">
          {/* Metrics summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Total Checked</span>
              <p className="text-2xl font-bold text-white mt-0.5">{batchResults.summary.total}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-md text-center">
              <span className="text-[10px] text-emerald-300 font-mono uppercase">Valid & Authentic</span>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">{batchResults.summary.valid}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-md text-center">
              <span className="text-[10px] text-amber-300 font-mono uppercase">Revoked</span>
              <p className="text-2xl font-bold text-amber-400 mt-0.5">{batchResults.summary.revoked}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-500/15 border border-slate-500/30 backdrop-blur-md text-center">
              <span className="text-[10px] text-slate-300 font-mono uppercase">Expired</span>
              <p className="text-2xl font-bold text-slate-300 mt-0.5">{batchResults.summary.expired}</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 backdrop-blur-md text-center">
              <span className="text-[10px] text-rose-300 font-mono uppercase">Counterfeit / Fake</span>
              <p className="text-2xl font-bold text-rose-400 mt-0.5">{batchResults.summary.invalid}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Not Found</span>
              <p className="text-2xl font-bold text-slate-400 mt-0.5">{batchResults.summary.notFound}</p>
            </div>
          </div>

          {/* Action & Filter toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
                <ListFilter className="w-3.5 h-3.5" /> Filter:
              </span>
              {(['ALL', 'VALID', 'REVOKED', 'INVALID', 'NOT_FOUND'] as const).map((filterOpt) => (
                <button
                  key={filterOpt}
                  onClick={() => setBatchFilter(filterOpt)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition cursor-pointer ${
                    batchFilter === filterOpt
                      ? 'bg-indigo-600 text-white font-bold border border-indigo-400/40 shadow-sm'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {filterOpt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportBatchAuditJson}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/15 flex items-center gap-1.5 transition cursor-pointer"
              >
                {batchExportCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Dossier Exported!
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Export Dossier JSON
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Batch items list cards */}
          <div className="space-y-4">
            {filteredBatchItems?.map((item, index) => {
              const cred = item.credential;
              const isFound = item.status === 'FOUND' && cred;

              return (
                <div
                  key={item.code + index}
                  className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all shadow-xl"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                          isFound && cred.status === 'VALID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isFound && cred.status === 'REVOKED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {isFound && cred.status === 'VALID' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isFound && cred.status === 'REVOKED' ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-white">{item.code}</span>
                          {isFound && <CredentialStatusBadge status={cred.status} />}
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              isFound && cred.result === 'GENUINE'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {isFound ? cred.result : 'NOT IN REGISTRY'}
                          </span>
                        </div>

                        {isFound ? (
                          <p className="text-sm font-semibold text-slate-200 mt-1">
                            {cred.document_type_name}
                            <span className="text-xs font-normal text-slate-400 ml-2">
                              • Subject: {cred.applicant_name} ({cred.applicant_id_masked})
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs text-rose-300 mt-1">
                            No government attestation record found for this reference code.
                          </p>
                        )}

                        {isFound && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Authority: {cred.issuer} • Recipient: {cred.recipient}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch md:self-auto">
                      {isFound && (
                        <>
                          <div className="text-right hidden sm:block">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border block ${
                                item.signatureVerification?.isValid
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {item.signatureVerification?.isValid ? 'Ed25519 Verified' : 'Sig Tampered'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              Exp: {new Date(cred.expires_at).toLocaleDateString()}
                            </span>
                          </div>

                          <button
                            onClick={() => openCertModal(cred)}
                            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Certificate
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isFound && cred.status === 'REVOKED' && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 font-mono">
                      Revocation Reason: {cred.revocation_reason} (by {cred.revoked_by})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for Signed Certificate */}
      {modalCredential && (
        <SignedCertificateModal
          credential={modalCredential}
          isOpen={isCertModalOpen}
          onClose={() => {
            setIsCertModalOpen(false);
            setModalCredential(null);
          }}
        />
      )}
    </div>
  );
};
