import React, { useState } from 'react';
import { dbService } from '../../services/mockDatabase';
import { CryptoService } from '../../services/cryptoService';
import { AdapterRegistry } from '../../services/adapters';
import {
  User,
  AuditLogEntry,
  DocumentType,
  VerificationPurpose,
  SigningKey,
  VerificationRequest,
  DigitalCredential,
} from '../../types';
import { SignedCertificateModal } from '../applicant/SignedCertificateModal';
import { CredentialStatusBadge } from '../common/CredentialStatusBadge';
import {
  ShieldAlert,
  ShieldCheck,
  LayoutDashboard,
  Cpu,
  KeyRound,
  FileCheck2,
  Users,
  Settings,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Lock,
  Plus,
  Play,
  RotateCw,
  ExternalLink,
  Shield,
  Activity,
  FileText,
  DollarSign,
} from 'lucide-react';

interface AdminPortalProps {
  user: User;
  onNavigateToPublicVerify: (code: string) => void;
}

type AdminTab = 'DASHBOARD' | 'ADAPTERS_CONFIG' | 'KEY_MANAGEMENT' | 'AUDIT_LOGS' | 'USERS_ORGS';

export const AdminPortal: React.FC<AdminPortalProps> = ({ user, onNavigateToPublicVerify }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [, setDbVersion] = useState(0);

  // Subscribe to live database updates
  React.useEffect(() => {
    const unsubscribe = dbService.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  // Live state
  const state = dbService.getState();

  // Audit Logs state
  const [auditFilterAction, setAuditFilterAction] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [chainVerificationResult, setChainVerificationResult] = useState<{
    valid: boolean;
    brokenIndex?: number;
    totalEvents: number;
    details: string;
  } | null>(null);

  // Key rotation modal / state
  const [selectedKeyToRevoke, setSelectedKeyToRevoke] = useState<string | null>(null);
  const [keyRotatedMsg, setKeyRotatedMsg] = useState(false);

  // Adapter testing state
  const [testingAdapterId, setTestingAdapterId] = useState<string | null>(null);
  const [adapterTestResult, setAdapterTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    details: string;
  } | null>(null);

  // Credential Revocation state
  const [revokingCredCode, setRevokingCredCode] = useState('');
  const [revocationReason, setRevocationReason] = useState('');
  const [revocationDoneMsg, setRevocationDoneMsg] = useState('');

  // Certificate Modal state
  const [selectedCred, setSelectedCred] = useState<DigitalCredential | null>(null);
  const [isCertOpen, setIsCertOpen] = useState(false);

  // Filtered Audits
  const filteredAudits = state.auditLogs.filter((log) => {
    const matchesAction = auditFilterAction === 'ALL' || log.action === auditFilterAction;
    const matchesSearch =
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(auditSearch.toLowerCase())) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase());
    return matchesAction && matchesSearch;
  });

  // Verify Entire Hash Chain
  const handleVerifyLedgerChain = () => {
    setIsVerifyingChain(true);
    setTimeout(() => {
      const result = CryptoService.verifyAuditIntegrity(state.auditLogs);
      setChainVerificationResult(result);
      setIsVerifyingChain(false);
    }, 600);
  };

  // Test Adapter Connectivity
  const handleTestAdapter = async (docType: DocumentType) => {
    setTestingAdapterId(docType);
    setAdapterTestResult(null);

    const adapter = AdapterRegistry.getAdapter(docType);
    const res = await adapter.testConnection();

    setAdapterTestResult(res);
    setTestingAdapterId(null);
  };

  // Rotate Root Signing Key
  const handleRotateKey = () => {
    const newVersion = `v2.${state.signingKeys.length + 1}-gov-ed25519`;
    const newKey: SigningKey = {
      key_version: newVersion,
      algorithm: 'Ed25519',
      public_key: `MCowBQYDK2VwAyEA${Math.random().toString(36).substring(2, 15).toUpperCase()}7X9vLpQGovSecurePK`,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Save key to database state and log
    dbService.addSigningKey(newKey);
    dbService.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SECURITY_KEY_ROTATED',
      resourceType: 'CRYPTOGRAPHIC_KEY',
      resourceId: newVersion,
      result: 'SUCCESS',
      details: `Generated and registered new active Ed25519 root signing key ${newVersion}.`,
    });

    setKeyRotatedMsg(true);
    setTimeout(() => setKeyRotatedMsg(false), 3000);
  };

  // Revoke Credential Action
  const handleRevokeCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingCredCode.trim() || !revocationReason.trim()) return;

    const ok = dbService.revokeCredential(
      revokingCredCode.trim(),
      revocationReason.trim(),
      user
    );

    if (ok) {
      setRevocationDoneMsg(`Credential ${revokingCredCode} officially revoked with audit record.`);
      setRevokingCredCode('');
      setRevocationReason('');
      setTimeout(() => setRevocationDoneMsg(''), 4000);
    } else {
      setRevocationDoneMsg(`Error: Credential ${revokingCredCode} not found.`);
      setTimeout(() => setRevocationDoneMsg(''), 4000);
    }
  };

  const handleExportAuditJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ndvg_audit_chain_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
        {/* Admin Info Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-bold text-base shadow-lg shadow-purple-500/20 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold text-white truncate">{user.name}</h3>
              <p className="text-[11px] text-purple-300 font-mono font-medium">SYSTEM ROOT ADMIN</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-300 font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Security Tier:</span>
              <span className="text-purple-300 font-bold">TIER A ROOT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hash Engine:</span>
              <span className="text-emerald-400 font-bold">SHA-256 SYNC</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex flex-col gap-1.5 shadow-2xl text-xs font-medium">
          <button
            id="nav-admin-dashboard"
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-400/40 font-semibold shadow-lg shadow-purple-500/10 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-purple-400" />
            <span>Gateway Operations</span>
          </button>

          <button
            id="nav-admin-adapters"
            onClick={() => setActiveTab('ADAPTERS_CONFIG')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'ADAPTERS_CONFIG'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-400/40 font-semibold shadow-lg shadow-purple-500/10 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Authority Adapters</span>
          </button>

          <button
            id="nav-admin-keys"
            onClick={() => setActiveTab('KEY_MANAGEMENT')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'KEY_MANAGEMENT'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-400/40 font-semibold shadow-lg shadow-purple-500/10 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4 text-purple-400" />
            <span>Ed25519 Key Management</span>
          </button>

          <button
            id="nav-admin-audits"
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'AUDIT_LOGS'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-400/40 font-semibold shadow-lg shadow-purple-500/10 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-purple-400" />
            <span>Tamper-Evident Ledger ({state.auditLogs.length})</span>
          </button>

          <button
            id="nav-admin-users"
            onClick={() => setActiveTab('USERS_ORGS')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'USERS_ORGS'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-400/40 font-semibold shadow-lg shadow-purple-500/10 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Users, Orgs & Revocations</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* ===================== TAB: DASHBOARD ===================== */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <span className="text-xs text-slate-400 font-mono">Total System Requests</span>
                <p className="text-2xl font-bold text-white mt-1">{state.requests.length}</p>
                <p className="text-[11px] text-slate-400 mt-1">Across all authorities</p>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <span className="text-xs text-slate-400 font-mono">Issued Credentials</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{state.credentials.length}</p>
                <p className="text-[11px] text-emerald-400/80 mt-1">
                  {state.credentials.filter((c) => c.status === 'VALID').length} currently active
                </p>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <span className="text-xs text-slate-400 font-mono">Ledger Hash Blocks</span>
                <p className="text-2xl font-bold text-purple-400 mt-1">{state.auditLogs.length}</p>
                <p className="text-[11px] text-purple-400/80 mt-1">SHA-256 chained events</p>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <span className="text-xs text-slate-400 font-mono">Registered Users</span>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{state.users.length}</p>
                <p className="text-[11px] text-cyan-400/80 mt-1">Citizens & institutions</p>
              </div>
            </div>

            {/* Quick Chain Integrity Status Banner */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/20 backdrop-blur-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Cryptographic Audit Chain Status</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Continuous SHA-256 block hashing guarantees tamper-evidence across all events.
                  </p>
                </div>
              </div>
              <button
                id="btn-quick-verify-chain"
                disabled={isVerifyingChain}
                onClick={handleVerifyLedgerChain}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/30 border border-purple-400/30 transition-all flex-shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingChain ? 'animate-spin' : ''}`} />
                <span>Verify Audit Chain Integrity</span>
              </button>
            </div>

            {chainVerificationResult && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-center justify-between backdrop-blur-md ${
                  chainVerificationResult.valid
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {chainVerificationResult.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <div>
                    <p className="font-bold">
                      {chainVerificationResult.valid
                        ? '100% CRYPTOGRAPHIC CHAIN INTEGRITY CONFIRMED'
                        : 'HASH CHAIN INTEGRITY BREACH DETECTED'}
                    </p>
                    <p className="text-[11px] opacity-90">{chainVerificationResult.details}</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-[11px]">
                  {chainVerificationResult.totalEvents} Blocks Verified
                </span>
              </div>
            )}

            {/* Recent All-Gateway Requests */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Gateway-Wide Verification Requests</h3>
                <span className="text-xs font-mono text-slate-400">
                  {state.requests.length} total across all agencies
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-slate-300 font-mono border-b border-white/10">
                    <tr>
                      <th className="p-4">Reference</th>
                      <th className="p-4">Applicant</th>
                      <th className="p-4">Document & Authority</th>
                      <th className="p-4">Named Recipient</th>
                      <th className="p-4">Status / State</th>
                      <th className="p-4">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {state.requests.map((req) => {
                      const cred = state.credentials.find(
                        (c) => c.reference_code === req.referenceCode
                      );
                      return (
                        <tr key={req.id} className="hover:bg-white/[0.04] transition-colors">
                          <td className="p-4 font-mono text-purple-300 font-semibold">
                            {req.referenceCode}
                          </td>
                          <td className="p-4 text-slate-200">
                            <div className="font-semibold text-white">{req.applicantName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {req.applicantNationalId}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300">
                            <div>{req.documentTypeName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{req.adapterId}</span>
                          </td>
                          <td className="p-4 text-slate-300">{req.namedRecipient.organizationName}</td>
                          <td className="p-4">
                            {cred ? (
                              <CredentialStatusBadge status={cred.status} size="xs" showDot />
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-200 border border-white/15 backdrop-blur-md">
                                {req.state}
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono font-bold text-emerald-400">
                            {req.verificationResult || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: ADAPTERS CONFIGURATION ===================== */}
        {activeTab === 'ADAPTERS_CONFIG' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Issuing Authority Verification Adapters
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Configure connector endpoints, simulated latency, and probe connectivity (Section
                  3.5.2).
                </p>
              </div>
            </div>

            {/* Test result toast if any */}
            {adapterTestResult && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-center justify-between backdrop-blur-md ${
                  adapterTestResult.success
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-bold">{adapterTestResult.message}</p>
                    <p className="text-[11px] font-mono opacity-80">{adapterTestResult.details}</p>
                  </div>
                </div>
                <span className="font-mono font-bold">{adapterTestResult.latencyMs}ms latency</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {AdapterRegistry.getAllAdapters().map((adapter) => {
                const isTesting = testingAdapterId === adapter.documentType;
                return (
                  <div
                    key={adapter.adapterId}
                    className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-mono font-bold backdrop-blur-md">
                          {adapter.adapterId.toUpperCase()} ADAPTER
                        </span>
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" /> ONLINE
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-2">{adapter.name}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">Authority: {adapter.authorityName}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        Endpoint: https://api.gov.auth/{adapter.adapterId}/v2/query • Doc: {adapter.documentType}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleTestAdapter(adapter.documentType)}
                        disabled={isTesting}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl text-xs font-semibold flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer"
                      >
                        <Play className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>{isTesting ? 'Probing Gateway...' : 'Test Connection'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB: KEY MANAGEMENT ===================== */}
        {activeTab === 'KEY_MANAGEMENT' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Ed25519 Cryptographic Root Key Management
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Government digital signature root keys for signing credentials (Section 3.5.3).
                </p>
              </div>
              <button
                id="btn-rotate-signing-key"
                onClick={handleRotateKey}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/30 border border-purple-400/30 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate & Generate New Root Key</span>
              </button>
            </div>

            {keyRotatedMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2 backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>New Ed25519 Key generated, hashed, and activated as current root signer.</span>
              </div>
            )}

            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-slate-300 font-mono border-b border-white/10">
                  <tr>
                    <th className="p-4">Key Version</th>
                    <th className="p-4">Algorithm</th>
                    <th className="p-4">Public Key (Base64)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {state.signingKeys.map((k) => (
                    <tr key={k.key_version} className="hover:bg-white/[0.04] transition-colors">
                      <td className="p-4 font-mono text-purple-300 font-bold">{k.key_version}</td>
                      <td className="p-4 font-mono text-slate-300">{k.algorithm}</td>
                      <td className="p-4 font-mono text-slate-400 truncate max-w-xs">{k.public_key}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border backdrop-blur-md ${
                            k.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {new Date(k.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB: AUDIT LOGS & HASH CHAIN ===================== */}
        {activeTab === 'AUDIT_LOGS' && (
          <div className="space-y-4">
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search action, actor, resource ID..."
                  className="w-full pl-10 pr-3.5 py-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-white text-xs font-mono placeholder-slate-400 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleVerifyLedgerChain}
                  disabled={isVerifyingChain}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/30 border border-purple-400/30 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingChain ? 'animate-spin' : ''}`} />
                  Verify Chain
                </button>
                <button
                  onClick={handleExportAuditJson}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-2 border border-white/15 backdrop-blur-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
              </div>
            </div>

            {/* Audit Chain Ledger Table */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-slate-300 font-mono border-b border-white/10">
                    <tr>
                      <th className="p-4">Seq / Time</th>
                      <th className="p-4">Action Type</th>
                      <th className="p-4">Actor / Role</th>
                      <th className="p-4">Resource</th>
                      <th className="p-4">SHA-256 Event Hash</th>
                      <th className="p-4">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAudits.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.04] transition-colors font-mono">
                        <td className="p-4 text-slate-400 text-[11px]">
                          <div>#{log.id}</div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="p-4 text-purple-300 font-semibold">{log.action}</td>
                        <td className="p-4 text-slate-300">
                          <div className="text-white">{log.userName}</div>
                          <span className="text-[10px] text-slate-400">{log.userRole}</span>
                        </td>
                        <td className="p-4 text-slate-300 text-[11px]">
                          <div>{log.resourceType}</div>
                          <span className="text-[10px] text-slate-400 truncate max-w-xs block">
                            {log.resourceId}
                          </span>
                        </td>
                        <td className="p-4 text-emerald-400 text-[11px] truncate max-w-[140px]">
                          {log.currentEventHash}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                              log.result === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                            }`}
                          >
                            {log.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: USERS, ORGS & REVOCATIONS ===================== */}
        {activeTab === 'USERS_ORGS' && (
          <div className="space-y-6">
            {/* Credential Revocation Panel */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] p-6 shadow-2xl">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Administrative Credential Revocation (Section 4.3 & 3.5.4)
              </h3>
              <p className="text-xs text-slate-300 mb-5">
                Instantly revoke a credential across the gateway. Any public verification scans will
                immediately display REVOKED.
              </p>

              {revocationDoneMsg && (
                <div className="p-3.5 mb-4 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-2 backdrop-blur-md">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{revocationDoneMsg}</span>
                </div>
              )}

              <form onSubmit={handleRevokeCredential} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Reference Code to Revoke</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NDVG-8K2R-9M4Q"
                    value={revokingCredCode}
                    onChange={(e) => setRevokingCredCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-white font-mono placeholder-slate-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1.5">Official Revocation Reason (Mandatory Audit)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Court injunction / Subsequent criminal record update / Identity challenge"
                    value={revocationReason}
                    onChange={(e) => setRevocationReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-600/30 border border-rose-400/30 transition-all cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Confirm & Revoke Credential
                  </button>
                </div>
              </form>
            </div>

            {/* Credentials Registry Table with Status Badges */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Gateway Credentials Registry & Status Management
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live attestation statuses across all issuing authorities (Section 4.3)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
                    {state.credentials.length} Total Issued
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-slate-300 font-mono border-b border-white/10">
                    <tr>
                      <th className="p-4">Reference Code</th>
                      <th className="p-4">Applicant</th>
                      <th className="p-4">Document Type</th>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Expiry Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {state.credentials.map((cred) => (
                      <tr key={cred.credential_id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="p-4 font-mono text-purple-300 font-bold">
                          {cred.reference_code}
                        </td>
                        <td className="p-4 text-slate-200 font-semibold">{cred.applicant_name}</td>
                        <td className="p-4 text-slate-300">{cred.document_type_name}</td>
                        <td className="p-4 text-slate-300">{cred.recipient}</td>
                        <td className="p-4">
                          <CredentialStatusBadge status={cred.status} size="xs" showDot />
                        </td>
                        <td className="p-4 font-mono text-slate-400 text-[11px]">
                          {new Date(cred.expires_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {cred.status === 'VALID' && (
                            <button
                              onClick={() => {
                                setRevokingCredCode(cred.reference_code);
                                setRevocationReason('Administrative cancellation / Court directive');
                              }}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-mono transition cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCred(cred);
                              setIsCertOpen(true);
                            }}
                            className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/40 rounded-xl text-[11px] transition cursor-pointer"
                          >
                            Certificate
                          </button>
                          <button
                            onClick={() => onNavigateToPublicVerify(cred.reference_code)}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-[11px] transition cursor-pointer"
                          >
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Registered Users List */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">All Gateway Registered Users</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-slate-300 font-mono border-b border-white/10">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Organization</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {state.users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="p-4 font-semibold text-white">{u.name}</td>
                      <td className="p-4 font-mono text-slate-300">{u.email}</td>
                      <td className="p-4 font-mono text-purple-300 font-bold">{u.role}</td>
                      <td className="p-4 text-slate-300">{u.organizationName || 'Citizen Applicant'}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Certificate if requested */}
      {selectedCred && (
        <SignedCertificateModal
          credential={selectedCred}
          isOpen={isCertOpen}
          onClose={() => setIsCertOpen(false)}
        />
      )}
    </div>
  );
};
