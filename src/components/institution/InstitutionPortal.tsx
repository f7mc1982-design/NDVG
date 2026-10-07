import React, { useState } from 'react';
import { dbService } from '../../services/mockDatabase';
import { User, VerificationRequest, DigitalCredential, Organization } from '../../types';
import { SignedCertificateModal } from '../applicant/SignedCertificateModal';
import { CredentialStatusBadge } from '../common/CredentialStatusBadge';
import {
  Building2,
  LayoutDashboard,
  FileCheck2,
  Users,
  Settings,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Lock,
  Plus,
  Eye,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Shield,
  UserPlus,
} from 'lucide-react';

interface InstitutionPortalProps {
  user: User;
  onNavigateToPublicVerify: (code: string) => void;
}

type InstitutionTab = 'DASHBOARD' | 'REQUESTS' | 'SETTINGS' | 'USERS';

export const InstitutionPortal: React.FC<InstitutionPortalProps> = ({
  user,
  onNavigateToPublicVerify,
}) => {
  const [activeTab, setActiveTab] = useState<InstitutionTab>('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCredential, setSelectedCredential] = useState<DigitalCredential | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
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
  const orgName = user.organizationName || 'TechCorp Global Holdings Ltd';

  // Requests where this institution is the named recipient
  const matchingRequests = state.requests.filter(
    (r) =>
      r.namedRecipient.organizationName.toLowerCase().includes(orgName.toLowerCase()) ||
      (user.organizationId && r.namedRecipient.organizationId === user.organizationId)
  );

  const filteredRequests = matchingRequests.filter((r) => {
    const matchesSearch =
      r.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.documentTypeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.state === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const matchingCredentials = state.credentials.filter((c) =>
    c.recipient.toLowerCase().includes(orgName.toLowerCase())
  );

  // Organization users
  const orgUsers = state.users.filter((u) => u.organizationName === orgName);

  // New user state for admin
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'INSTITUTION_USER' | 'INSTITUTION_ADMIN'>(
    'INSTITUTION_USER'
  );
  const [userAddedMsg, setUserAddedMsg] = useState(false);

  // Org profile state
  const [orgWebhook, setOrgWebhook] = useState('https://api.techcorp.com/v1/verifications/webhook');
  const [orgContactEmail, setOrgContactEmail] = useState(user.email);
  const [orgSaved, setOrgSaved] = useState(false);

  const isAdmin = user.role === 'INSTITUTION_ADMIN';

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const newUser: User = {
      id: `USR-INST-${Date.now().toString().slice(-4)}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      organizationName: orgName,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    dbService.addUser(newUser);
    dbService.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ORGANIZATION_USER_ADDED',
      resourceType: 'USER_ACCOUNT',
      resourceId: newUser.id,
      result: 'SUCCESS',
      details: `Added new user ${newUser.name} (${newUser.email}) as ${newUser.role} to ${orgName}.`,
    });

    setNewUserName('');
    setNewUserEmail('');
    setUserAddedMsg(true);
    setTimeout(() => setUserAddedMsg(false), 2500);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
        {/* Institution Info Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold text-base shadow-lg shadow-cyan-500/20 backdrop-blur-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold text-white truncate">{orgName}</h3>
              <p className="text-[11px] text-cyan-300 font-mono font-medium">
                {isAdmin ? 'INSTITUTION ADMIN' : 'INSTITUTION VERIFIER'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user.name}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-300 font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Department:</span>
              <span className="text-slate-200 font-medium">{user.department || 'HR Compliance'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Access Level:</span>
              <span className="text-emerald-400 font-bold">RECIPIENT SCOPE</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex flex-col gap-1.5 shadow-2xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold shadow-lg shadow-cyan-500/10 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
            <span>Institution Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'REQUESTS'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold shadow-lg shadow-cyan-500/10 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
            <span>Verification Requests ({matchingRequests.length})</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('USERS')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'USERS'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold shadow-lg shadow-cyan-500/10 backdrop-blur-md'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>User Management ({orgUsers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('SETTINGS')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'SETTINGS'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold shadow-lg shadow-cyan-500/10 backdrop-blur-md'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Organization Settings</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* ===================== TAB: DASHBOARD ===================== */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <span className="text-xs text-slate-400 font-mono">Requests Received</span>
                <p className="text-2xl font-bold text-white mt-1">{matchingRequests.length}</p>
                <p className="text-[11px] text-slate-400 mt-1">Candidate submissions</p>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <span className="text-xs text-slate-400 font-mono">Genuine Credentials</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {matchingCredentials.filter((c) => c.result === 'GENUINE').length}
                </p>
                <p className="text-[11px] text-emerald-400/80 mt-1">Confirmed authentic</p>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <span className="text-xs text-slate-400 font-mono">Pending Verifications</span>
                <p className="text-2xl font-bold text-cyan-400 mt-1">
                  {matchingRequests.filter((r) => r.state !== 'CREDENTIAL_ISSUED').length}
                </p>
                <p className="text-[11px] text-cyan-400/80 mt-1">In progress with authority</p>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <span className="text-xs text-slate-400 font-mono">Digital Signature Engine</span>
                <p className="text-sm font-mono font-bold text-emerald-400 mt-2 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Ed25519 Active
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Key v2.1-gov-ed25519</p>
              </div>
            </div>

            {/* Quick Overview Table */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Candidate Verifications for {orgName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Named recipient verification stream (Section 3.4.2)
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('REQUESTS')}
                  className="text-xs text-cyan-300 hover:text-cyan-200 font-semibold px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-slate-300 font-mono border-b border-white/10">
                    <tr>
                      <th className="p-4">Reference Code</th>
                      <th className="p-4">Candidate / Applicant</th>
                      <th className="p-4">Document Type</th>
                      <th className="p-4">Result</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {matchingRequests.map((req) => {
                      const cred = matchingCredentials.find(
                        (c) => c.reference_code === req.referenceCode
                      );
                      return (
                        <tr key={req.id} className="hover:bg-white/[0.04] transition-colors">
                          <td className="p-4 font-mono text-cyan-300 font-semibold">
                            {req.referenceCode}
                          </td>
                          <td className="p-4 text-slate-200">
                            <div className="font-semibold text-white">{req.applicantName}</div>
                            <span className="text-[10px] text-slate-400">{req.applicantEmail}</span>
                          </td>
                          <td className="p-4 text-slate-300">{req.documentTypeName}</td>
                          <td className="p-4">
                            {req.verificationResult ? (
                              <span
                                className={`font-mono text-xs font-bold ${
                                  req.verificationResult === 'GENUINE'
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {req.verificationResult}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">PROCESSING</span>
                            )}
                          </td>
                          <td className="p-4">
                            {cred ? (
                              <CredentialStatusBadge status={cred.status} size="xs" showDot />
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 backdrop-blur-md">
                                {req.state}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {cred ? (
                              <button
                                onClick={() => {
                                  setSelectedCredential(cred);
                                  setIsCertificateModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 rounded-xl text-xs inline-flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" /> View
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
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

        {/* ===================== TAB: VERIFICATION REQUESTS MANAGEMENT ===================== */}
        {activeTab === 'REQUESTS' && (
          <div className="space-y-4">
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by candidate, code..."
                  className="w-full pl-10 pr-3.5 py-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-white text-xs font-mono placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-300 font-mono">Filter State:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">ALL STATES</option>
                  <option value="CREDENTIAL_ISSUED" className="bg-slate-900 text-white">CREDENTIAL_ISSUED</option>
                  <option value="PAYMENT_CONFIRMED" className="bg-slate-900 text-white">PAYMENT_CONFIRMED</option>
                  <option value="VERIFICATION_IN_PROGRESS" className="bg-slate-900 text-white">VERIFICATION_IN_PROGRESS</option>
                </select>
              </div>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-slate-300 font-mono border-b border-white/10">
                    <tr>
                      <th className="p-4">Reference Code</th>
                      <th className="p-4">Applicant Name</th>
                      <th className="p-4">Document Type</th>
                      <th className="p-4">State Status</th>
                      <th className="p-4">Authority Outcome</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRequests.map((req) => {
                      const cred = matchingCredentials.find(
                        (c) => c.reference_code === req.referenceCode
                      );
                      return (
                        <tr key={req.id} className="hover:bg-white/[0.04] transition-colors">
                          <td className="p-4 font-mono text-cyan-300 font-semibold">
                            {req.referenceCode}
                          </td>
                          <td className="p-4 text-slate-200">
                            <span className="font-semibold text-white">{req.applicantName}</span>
                            <p className="text-[10px] text-slate-400 font-mono">{req.applicantNationalId}</p>
                          </td>
                          <td className="p-4 text-slate-300">
                            <div>{req.documentTypeName}</div>
                            <span className="text-[10px] text-slate-400">{req.purposeName}</span>
                          </td>
                          <td className="p-4">
                            {cred ? (
                              <CredentialStatusBadge status={cred.status} size="xs" showDot />
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 backdrop-blur-md">
                                {req.state}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {req.verificationResult ? (
                              <span
                                className={`font-mono text-xs font-bold ${
                                  req.verificationResult === 'GENUINE'
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {req.verificationResult}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">PENDING</span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {cred && (
                              <button
                                onClick={() => {
                                  setSelectedCredential(cred);
                                  setIsCertificateModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 rounded-xl text-xs inline-flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" /> Certificate
                              </button>
                            )}
                            <button
                              onClick={() => onNavigateToPublicVerify(req.referenceCode)}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs inline-flex items-center gap-1.5 border border-white/15 backdrop-blur-md transition-all cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Public
                            </button>
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

        {/* ===================== TAB: USER MANAGEMENT (ADMIN ONLY) ===================== */}
        {activeTab === 'USERS' && isAdmin && (
          <div className="space-y-6">
            {/* Add User Form */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] p-6 shadow-2xl">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                Add Organization Member to {orgName}
              </h3>

              {userAddedMsg && (
                <div className="p-3.5 mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2 backdrop-blur-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>New user added successfully and invite dispatched.</span>
                </div>
              )}

              <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@techcorp.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-white font-mono placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Role Assignment</label>
                  <select
                    value={newUserRole}
                    onChange={(e) =>
                      setNewUserRole(e.target.value as 'INSTITUTION_USER' | 'INSTITUTION_ADMIN')
                    }
                    className="w-full px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="INSTITUTION_USER" className="bg-slate-900 text-white">INSTITUTION_USER (Verifier)</option>
                    <option value="INSTITUTION_ADMIN" className="bg-slate-900 text-white">INSTITUTION_ADMIN (Manager)</option>
                  </select>
                </div>
                <div className="sm:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/30 border border-cyan-400/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Organization User
                  </button>
                </div>
              </form>
            </div>

            {/* User List Table */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">Active Organization Members</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-slate-300 font-mono border-b border-white/10">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orgUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="p-4 font-semibold text-white">{u.name}</td>
                      <td className="p-4 font-mono text-slate-300">{u.email}</td>
                      <td className="p-4 font-mono text-cyan-300 font-medium">{u.role}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {new Date(u.lastLoginAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB: ORGANIZATION SETTINGS (ADMIN ONLY) ===================== */}
        {activeTab === 'SETTINGS' && isAdmin && (
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] p-7 shadow-2xl max-w-2xl text-xs space-y-5">
            <div>
              <h3 className="text-base font-semibold text-white">Organization Profile & Integration</h3>
              <p className="text-slate-300 mt-1">
                Manage organization compliance profile and automated verification webhooks.
              </p>
            </div>

            {orgSaved && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 flex items-center gap-2 backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Organization settings updated successfully.</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Organization Name</label>
                <input
                  type="text"
                  disabled
                  value={orgName}
                  className="w-full px-3.5 py-2.5 bg-black/20 border border-white/10 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Compliance Email</label>
                <input
                  type="email"
                  value={orgContactEmail}
                  onChange={(e) => setOrgContactEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-white font-mono placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Automated Verification Webhook URL
                </label>
                <input
                  type="url"
                  value={orgWebhook}
                  onChange={(e) => setOrgWebhook(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-white font-mono placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Signed JSON payload sent whenever candidate credentials are confirmed genuine.
                </p>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => {
                    setOrgSaved(true);
                    setTimeout(() => setOrgSaved(false), 2500);
                  }}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-600/30 border border-cyan-400/30 transition-all cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Signed Certificate */}
      {selectedCredential && (
        <SignedCertificateModal
          credential={selectedCredential}
          isOpen={isCertificateModalOpen}
          onClose={() => setIsCertificateModalOpen(false)}
        />
      )}
    </div>
  );
};
