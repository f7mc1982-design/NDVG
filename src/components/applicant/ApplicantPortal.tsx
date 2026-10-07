import React, { useState } from 'react';
import { dbService } from '../../services/mockDatabase';
import { AdapterRegistry } from '../../services/adapters';
import {
  User,
  VerificationRequest,
  DigitalCredential,
  ConsentRecord,
  PaymentRecord,
  DocumentType,
  VerificationPurpose,
  RequestState,
  VerificationResult,
} from '../../types';
import { BiometricScannerModal } from '../common/BiometricScannerModal';
import { SignedCertificateModal } from './SignedCertificateModal';
import { QrCodeViewer } from '../common/QrCodeViewer';
import { CredentialStatusBadge } from '../common/CredentialStatusBadge';
import confetti from 'canvas-confetti';
import {
  LayoutDashboard,
  PlusCircle,
  FileCheck2,
  ShieldCheck,
  CreditCard,
  User as UserIcon,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building,
  ArrowRight,
  ArrowLeft,
  Lock,
  Download,
  Copy,
  Check,
  Eye,
  RefreshCw,
  QrCode,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Layers,
  Trash2,
  Plus,
  FileSpreadsheet,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface ApplicantPortalProps {
  user: User;
  onNavigateToPublicVerify: (code: string) => void;
}

type ApplicantTab =
  | 'DASHBOARD'
  | 'CREATE_REQUEST'
  | 'REQUEST_DETAILS'
  | 'CREDENTIALS'
  | 'CONSENT_HISTORY'
  | 'PAYMENT_HISTORY'
  | 'PROFILE';

export interface BasketDocItem {
  id: string;
  documentType: DocumentType;
  documentTypeName: string;
  authority: string;
  issuingDistrict: string;
  policeStation: string;
  registrationNumber: string;
  degreeTitle: string;
  institution: string;
  licenseNumber: string;
  category: string;
  cnicNumber: string;
}

export const ApplicantPortal: React.FC<ApplicantPortalProps> = ({ user, onNavigateToPublicVerify }) => {
  const [activeTab, setActiveTab] = useState<ApplicantTab>('DASHBOARD');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
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

  // Live state from db
  const state = dbService.getState();
  const userRequests = state.requests.filter((r) => r.applicantId === user.id);
  const userConsents = state.consents.filter((c) => c.applicantId === user.id);
  const userPayments = state.payments.filter((p) => p.applicantId === user.id);
  const userCredentials = state.credentials.filter((c) =>
    userRequests.some((r) => r.referenceCode === c.reference_code) ||
    c.applicant_name === user.name
  );

  // --- Create Request Wizard State ---
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [selectedPurpose, setSelectedPurpose] = useState<VerificationPurpose>('employment_abroad');

  // Multi-document Basket
  const [basketDocs, setBasketDocs] = useState<BasketDocItem[]>([
    {
      id: 'doc-item-1',
      documentType: 'police_certificate',
      documentTypeName: 'Police Character Clearance Certificate',
      authority: 'Federal Directorate of Police Verification (ICT / Punjab Police)',
      issuingDistrict: 'Islamabad Capital Territory (ICT)',
      policeStation: 'Police Khidmat Markaz F-6 Islamabad',
      registrationNumber: 'PKM-ISB-2026-8814',
      degreeTitle: '',
      institution: '',
      licenseNumber: '',
      category: 'Character & Background Clearance',
      cnicNumber: user.nationalIdNumber || '35201-7894561-3',
    },
    {
      id: 'doc-item-2',
      documentType: 'higher_education_degree',
      documentTypeName: 'Higher Education Degree Attestation',
      authority: 'Higher Education Commission (HEC) Attestation Directorate',
      issuingDistrict: 'Islamabad',
      policeStation: '',
      registrationNumber: 'NUST-MSCS-2022-881',
      degreeTitle: 'BS Computer Science (Honors)',
      institution: 'National University of Sciences and Technology (NUST)',
      licenseNumber: '',
      category: 'Bachelor & Master Degrees',
      cnicNumber: user.nationalIdNumber || '35201-7894561-3',
    },
  ]);

  const [activeDocTypeToAdd, setActiveDocTypeToAdd] = useState<DocumentType>('national_id');

  // Recipient
  const [recipientOrgName, setRecipientOrgName] = useState('Systems Limited & TechCorp Pakistan');
  const [recipientContactPerson, setRecipientContactPerson] = useState('Syeda Ayesha Fatima');
  const [recipientEmail, setRecipientEmail] = useState('compliance@systemsltd.com');
  const [recipientNote, setRecipientNote] = useState('Candidate Employment & Security Attestation');

  // Consent checkbox
  const [consentAgreed, setConsentAgreed] = useState(false);

  // Biometric scanner trigger
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricPassed, setBiometricPassed] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['paymentMethod']>('GOVT_EPAY');
  const [isPaying, setIsPaying] = useState(false);
  const [isVerifyingWithAdapter, setIsVerifyingWithAdapter] = useState(false);
  const [adapterLogs, setAdapterLogs] = useState<string[]>([]);
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);
  const [createdBatchRequests, setCreatedBatchRequests] = useState<VerificationRequest[]>([]);
  const [createdBatchCredentials, setCreatedBatchCredentials] = useState<DigitalCredential[]>([]);
  const [copiedBatchCodes, setCopiedBatchCodes] = useState(false);

  // Filters & Search
  const [requestSearch, setRequestSearch] = useState('');
  const [consentSearch, setConsentSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Profile Edit State
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || '+92 300 1234567');
  const [profileSaved, setProfileSaved] = useState(false);

  const purposeOptions: { id: VerificationPurpose; title: string; desc: string }[] = [
    {
      id: 'employment_abroad',
      title: 'Employment Abroad',
      desc: 'Verification for overseas job placement, background clearance, and employment visa sponsors.',
    },
    {
      id: 'visa_immigration',
      title: 'Visa & Immigration Clearance',
      desc: 'Official attestation for embassies, diplomatic missions, and immigration boards.',
    },
    {
      id: 'higher_education',
      title: 'Higher Education & Post-Doc',
      desc: 'Clearance and degree attestation for foreign universities and academic institutions.',
    },
    {
      id: 'professional_licensing',
      title: 'Professional Licensing',
      desc: 'Medical, legal, engineering, or security council registration credentials.',
    },
    {
      id: 'court_legal_proceedings',
      title: 'Court & Legal Proceedings',
      desc: 'Judicial clearance and legal record attestations.',
    },
  ];

  const docCatalog: {
    id: DocumentType;
    title: string;
    desc: string;
    authority: string;
    defaultDistrict: string;
    defaultStation: string;
    defaultReg: string;
    defaultDegree: string;
    defaultInstitution: string;
    defaultLicense: string;
  }[] = [
    {
      id: 'police_certificate',
      title: 'Police Character Clearance Certificate',
      desc: 'Comprehensive criminal record and police station character attestation.',
      authority: 'Federal Directorate of Police Verification (ICT / Punjab Police)',
      defaultDistrict: 'Islamabad Capital Territory (ICT)',
      defaultStation: 'Police Khidmat Markaz F-6 Islamabad',
      defaultReg: 'PKM-ISB-2026-8814',
      defaultDegree: '',
      defaultInstitution: '',
      defaultLicense: '',
    },
    {
      id: 'higher_education_degree',
      title: 'Higher Education Degree Attestation',
      desc: 'Accredited university degree attestation and transcript credit validation.',
      authority: 'Higher Education Commission (HEC) Attestation Directorate',
      defaultDistrict: 'Islamabad',
      defaultStation: '',
      defaultReg: 'NUST-MSCS-2022-881',
      defaultDegree: 'BS Computer Science (Honors)',
      defaultInstitution: 'National University of Sciences and Technology (NUST)',
      defaultLicense: '',
    },
    {
      id: 'national_id',
      title: 'National Identity Citizen Card (CNIC)',
      desc: 'Citizen demographic, biometric identity, and family tree record attestation.',
      authority: 'National Database and Registration Authority (NADRA)',
      defaultDistrict: 'Lahore Division',
      defaultStation: '',
      defaultReg: 'NADRA-NICOP-882194',
      defaultDegree: '',
      defaultInstitution: '',
      defaultLicense: '',
    },
    {
      id: 'driving_license',
      title: 'National Driving License Clearance',
      desc: 'Traffic licensing history, endorsements, and driving record demerits clearance.',
      authority: 'National Highway & Motorway Police (NHMP) Licensing Authority',
      defaultDistrict: 'Rawalpindi / Islamabad',
      defaultStation: '',
      defaultReg: 'NHMP-DL-2024-9102',
      defaultDegree: '',
      defaultInstitution: '',
      defaultLicense: 'ICT-DL-88190-B',
    },
    {
      id: 'professional_clearance',
      title: 'Professional Recruiter Clearance (OEP)',
      desc: 'Overseas employment promoter registry and candidate profile verification.',
      authority: 'Bureau of Emigration & Overseas Employment',
      defaultDistrict: 'Islamabad HQ',
      defaultStation: '',
      defaultReg: 'BEOE-OEP-2026-441',
      defaultDegree: 'Senior Systems Architect',
      defaultInstitution: 'Pakistan Engineering Council (PEC)',
      defaultLicense: 'PEC-COMP-19284',
    },
  ];

  // Pricing calculations
  const itemizedPricing = basketDocs.map((item) => {
    const p = dbService.getPricing(item.documentType, selectedPurpose);
    const fee = p ? p.baseFee + p.processingFee : 30.0;
    return { ...item, fee };
  });

  const rawTotalFee = itemizedPricing.reduce((sum, i) => sum + i.fee, 0);
  const bundleDiscount = basketDocs.length > 1 ? Math.round(rawTotalFee * 0.2 * 100) / 100 : 0;
  const finalPayableFee = Math.max(0, Math.round((rawTotalFee - bundleDiscount) * 100) / 100);

  // Add document to basket
  const handleAddDocumentToBasket = (type: DocumentType) => {
    const cat = docCatalog.find((d) => d.id === type) || docCatalog[0];
    const newItem: BasketDocItem = {
      id: `doc-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      documentType: cat.id,
      documentTypeName: cat.title,
      authority: cat.authority,
      issuingDistrict: cat.defaultDistrict,
      policeStation: cat.defaultStation,
      registrationNumber: cat.defaultReg,
      degreeTitle: cat.defaultDegree,
      institution: cat.defaultInstitution,
      licenseNumber: cat.defaultLicense,
      category: 'Standard Attestation',
      cnicNumber: user.nationalIdNumber || '35201-7894561-3',
    };
    setBasketDocs((prev) => [...prev, newItem]);
  };

  // Remove document from basket
  const handleRemoveDocumentFromBasket = (id: string) => {
    if (basketDocs.length <= 1) {
      alert('You must keep at least 1 document in the verification request.');
      return;
    }
    setBasketDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // Update document field in basket
  const handleUpdateDocField = (id: string, field: keyof BasketDocItem, val: string) => {
    setBasketDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  // Handler for starting a new request
  const startNewRequest = () => {
    setWizardStep(1);
    setConsentAgreed(false);
    setBiometricPassed(false);
    setCreatedBatchId(null);
    setCreatedBatchRequests([]);
    setCreatedBatchCredentials([]);
    setAdapterLogs([]);
    setActiveTab('CREATE_REQUEST');
  };

  // Step 4 -> 5: Create Batch Draft Requests in database
  const handleProceedToConsent = () => {
    const purposeName = purposeOptions.find((p) => p.id === selectedPurpose)?.title || selectedPurpose;

    const formattedDocs = basketDocs.map((doc) => {
      const docMeta: VerificationRequest['documentMetadata'] = {};
      if (doc.documentType === 'police_certificate') {
        docMeta.issuingDistrict = doc.issuingDistrict;
        docMeta.policeStation = doc.policeStation;
        docMeta.registrationNumber = doc.registrationNumber;
      } else if (doc.documentType === 'higher_education_degree') {
        docMeta.degreeTitle = doc.degreeTitle;
        docMeta.institution = doc.institution;
        docMeta.registrationNumber = doc.registrationNumber;
      } else if (doc.documentType === 'driving_license') {
        docMeta.issuingDistrict = doc.issuingDistrict;
        docMeta.registrationNumber = doc.licenseNumber || doc.registrationNumber;
      } else {
        docMeta.issuingDistrict = doc.issuingDistrict;
        docMeta.registrationNumber = doc.registrationNumber;
      }

      return {
        documentType: doc.documentType,
        documentTypeName: doc.documentTypeName,
        documentMetadata: docMeta,
        adapterId: doc.documentType === 'police_certificate' ? 'police' : doc.documentType,
      };
    });

    const batchResult = dbService.createBatchVerificationRequests({
      applicant: user,
      documents: formattedDocs,
      purpose: selectedPurpose,
      purposeName,
      namedRecipient: {
        organizationName: recipientOrgName,
        contactPerson: recipientContactPerson,
        contactEmail: recipientEmail,
        referenceNote: recipientNote,
      },
    });

    setCreatedBatchId(batchResult.batchId);
    setCreatedBatchRequests(batchResult.requests);
    setWizardStep(5);
  };

  // Step 5: Grant Consent
  const handleConfirmConsent = () => {
    if (!createdBatchId || !consentAgreed) return;
    setWizardStep(6);
  };

  // Step 6: Complete Biometric Scan
  const handleBiometricComplete = () => {
    setIsBiometricModalOpen(false);
    setBiometricPassed(true);
    setWizardStep(7);
  };

  // Step 7: Complete Payment & Trigger Live Adapter Verification
  const handleCompletePayment = () => {
    if (!createdBatchId) return;
    setIsPaying(true);

    setTimeout(() => {
      setIsPaying(false);
      setWizardStep(8);
      // Process full batch verification lifecycle
      triggerBatchVerificationLifecycle(createdBatchId);
    }, 1200);
  };

  // Step 8: Multi-Authority Adapter Verification Engine
  const triggerBatchVerificationLifecycle = async (batchId: string) => {
    setIsVerifyingWithAdapter(true);
    setAdapterLogs([
      `[BATCH-ENGINE] Initialized multi-document dispatch protocol for Batch #${batchId}`,
      `[AUTH-GATEWAY] Secure TLS 1.3 handshake established with National Verification Switch`,
    ]);

    const logs: string[] = [
      `[BATCH-ENGINE] Initialized multi-document dispatch protocol for Batch #${batchId}`,
      `[AUTH-GATEWAY] Secure TLS 1.3 handshake established with National Verification Switch`,
    ];

    // Sequentially invoke each document's adapter to produce rich real-time logs
    for (let i = 0; i < basketDocs.length; i++) {
      const doc = basketDocs[i];
      logs.push(`[QUERY ${i + 1}/${basketDocs.length}] Contacting ${doc.authority}...`);
      setAdapterLogs([...logs]);
      await new Promise((r) => setTimeout(r, 600));

      const adapter = AdapterRegistry.getAdapter(doc.documentType);
      const res = await adapter.verify({
        requestId: `REQ-SIM-${i + 1}`,
        applicantName: user.name,
        applicantNationalId: user.nationalIdNumber || '35201-7894561-3',
        documentType: doc.documentType,
        metadata: {
          issuingDistrict: doc.issuingDistrict,
          policeStation: doc.policeStation,
          registrationNumber: doc.registrationNumber,
          degreeTitle: doc.degreeTitle,
          institution: doc.institution,
        },
        purpose: selectedPurpose,
      });

      res.logTrace.forEach((l) => logs.push(`[${doc.documentType.toUpperCase()}] ${l}`));
      logs.push(`[SEAL-ENGINE] Verification completed: ${res.verificationResult} by ${res.authorityName}`);
      setAdapterLogs([...logs]);
      await new Promise((r) => setTimeout(r, 400));
    }

    logs.push(`[CRYPTO-ROOT] Generating Ed25519 digital signatures with Government HSM Key Ring`);
    logs.push(`[AUDIT-LEDGER] Appended immutable hash-chain blocks to NDVG distributed audit trail`);
    setAdapterLogs([...logs]);

    // Commit to database
    const batchOutcome = dbService.processBatchLifecycle(batchId, paymentMethod);
    setCreatedBatchRequests(batchOutcome.requests);
    setCreatedBatchCredentials(batchOutcome.credentials);
    setIsVerifyingWithAdapter(false);
    setWizardStep(9);

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const handleCopyAllCodes = () => {
    const codes = createdBatchCredentials.map((c) => c.reference_code).join(', ');
    navigator.clipboard.writeText(codes);
    setCopiedBatchCodes(true);
    setTimeout(() => setCopiedBatchCodes(false), 2500);
  };

  const selectedRequest = userRequests.find((r) => r.id === selectedRequestId);

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
        {/* Applicant Profile Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] p-5 shadow-2xl shadow-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-base shadow-lg shadow-indigo-500/20 backdrop-blur-md">
              {user.name.charAt(0)}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-white truncate">{user.name}</h3>
              <p className="text-[11px] text-indigo-300 font-mono">APPLICANT PORTAL</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>National CNIC:</span>
              <span className="text-slate-200">{user.nationalIdNumber || '35201-7894561-3'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Account Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] p-2.5 shadow-2xl flex flex-col gap-1 text-xs">
          <button
            id="nav-applicant-dashboard"
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'bg-white/15 text-white border border-white/20 font-bold shadow-lg shadow-indigo-950/30 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Dashboard Overview</span>
          </button>

          <button
            id="nav-applicant-new-request"
            onClick={startNewRequest}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
              activeTab === 'CREATE_REQUEST'
                ? 'bg-white/15 text-white border border-white/20 font-bold shadow-lg shadow-indigo-950/30 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span>New Verification Request</span>
          </button>

          <button
            id="nav-applicant-credentials"
            onClick={() => setActiveTab('CREDENTIALS')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
              activeTab === 'CREDENTIALS'
                ? 'bg-white/15 text-white border border-white/20 font-bold shadow-lg shadow-indigo-950/30 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>My Issued Credentials ({userCredentials.length})</span>
          </button>

          <button
            id="nav-applicant-consents"
            onClick={() => setActiveTab('CONSENT_HISTORY')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
              activeTab === 'CONSENT_HISTORY'
                ? 'bg-white/15 text-white border border-white/20 font-bold shadow-lg shadow-indigo-950/30 backdrop-blur-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-indigo-400" />
            <span>Consent History ({userConsents.length})</span>
          </button>

          <button
            id="nav-applicant-payments"
            onClick={() => setActiveTab('PAYMENT_HISTORY')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
              activeTab === 'PAYMENT_HISTORY'
                ? 'bg-white/15 text-white border border-white/20 font-bold shadow-lg shadow-indigo-950/30 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <span>Payment Records ({userPayments.length})</span>
          </button>

          <button
            id="nav-applicant-profile"
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'bg-white/15 text-white border border-white/20 font-bold shadow-lg shadow-indigo-950/30 backdrop-blur-md'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4 text-indigo-400" />
            <span>Profile & Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* ===================== TAB: DASHBOARD ===================== */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* Top Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
                <span className="text-xs text-slate-400 font-mono">Total Requests</span>
                <p className="text-2xl font-bold text-white mt-1">{userRequests.length}</p>
                <p className="text-[11px] text-slate-400 mt-1">Verification submissions</p>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
                <span className="text-xs text-slate-400 font-mono">Active Credentials</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {userCredentials.filter((c) => c.status === 'VALID').length}
                </p>
                <p className="text-[11px] text-emerald-400/80 mt-1">Digitally signed & valid</p>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
                <span className="text-xs text-slate-400 font-mono">Active Consents</span>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{userConsents.length}</p>
                <p className="text-[11px] text-cyan-400/80 mt-1">Audited authorizations</p>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
                <span className="text-xs text-slate-400 font-mono">Total Paid</span>
                <p className="text-2xl font-bold text-purple-400 mt-1">
                  ${userPayments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-purple-400/80 mt-1">Govt statutory fees</p>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="bg-gradient-to-r from-indigo-950/50 via-white/[0.05] to-purple-950/40 backdrop-blur-2xl border border-white/15 rounded-[28px] p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    MULTI-DOCUMENT DOSSIER SUPPORTED
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">Need verified Pakistani official documents?</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Initiate a fast-track verification request for Police Clearances, HEC Degrees, NADRA CNIC, or Driving Licenses. Bundle 2+ documents for a 20% statutory discount!
                </p>
              </div>
              <button
                id="btn-dash-start-request"
                onClick={startNewRequest}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 flex-shrink-0 transition border border-indigo-400/30 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start New Verification</span>
              </button>
            </div>

            {/* Recent Verification Requests Table */}
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Recent Verification Requests</h3>
                <span className="text-xs font-mono text-indigo-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  {userRequests.length} total records
                </span>
              </div>

              {userRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No verification requests found. Click "Start New Verification" to begin.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-300 font-mono border-b border-white/10">
                      <tr>
                        <th className="p-3.5">Reference Code</th>
                        <th className="p-3.5">Document Type</th>
                        <th className="p-3.5">Named Recipient</th>
                        <th className="p-3.5">State Status</th>
                        <th className="p-3.5">Outcome</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {userRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-white/5 transition">
                          <td className="p-3.5 font-mono text-indigo-300 font-bold">
                            <div className="flex items-center gap-1.5">
                              <span>{req.referenceCode}</span>
                              {req.batchId && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30">
                                  BATCH
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-200">
                            <div className="font-semibold text-white">{req.documentTypeName}</div>
                            <span className="text-[10px] text-slate-400">{req.purposeName}</span>
                          </td>
                          <td className="p-3.5 text-white font-medium">
                            {req.namedRecipient.organizationName}
                          </td>
                          <td className="p-3.5 font-mono">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                                req.state === 'CREDENTIAL_ISSUED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                  : req.state === 'REVOKED' || req.state === 'FAILED'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                              }`}
                            >
                              {req.state}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {req.verificationResult ? (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  req.verificationResult === 'GENUINE'
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-rose-400 bg-rose-500/10'
                                }`}
                              >
                                {req.verificationResult}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-mono">IN PROGRESS</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedRequestId(req.id);
                                setActiveTab('REQUEST_DETAILS');
                              }}
                              className="px-3 py-1.5 text-xs text-indigo-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition cursor-pointer"
                            >
                              Details
                            </button>
                            {req.state === 'CREDENTIAL_ISSUED' && (
                              <button
                                onClick={() => {
                                  const cred = userCredentials.find(
                                    (c) => c.reference_code === req.referenceCode
                                  );
                                  if (cred) {
                                    setSelectedCredential(cred);
                                    setIsCertificateModalOpen(true);
                                  }
                                }}
                                className="px-3 py-1.5 text-xs text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3 h-3" />
                                Certificate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB: CREATE REQUEST WIZARD ===================== */}
        {activeTab === 'CREATE_REQUEST' && (
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
            {/* Wizard Step Progress Bar */}
            <div className="bg-white/5 p-5 border-b border-white/10">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2.5">
                <span>
                  STEP {wizardStep} OF 9:{' '}
                  <strong className="text-indigo-300">
                    {wizardStep === 1 && 'SELECT VERIFICATION PURPOSE'}
                    {wizardStep === 2 && 'BUILD DOCUMENT DOSSIER (MULTI-DOCUMENT ALLOWED)'}
                    {wizardStep === 3 && 'ENTER NAMED RECIPIENT ENTITY'}
                    {wizardStep === 4 && 'REVIEW BATCH & DISCOUNT SUMMARY'}
                    {wizardStep === 5 && 'EXPLICIT CITIZEN CONSENT'}
                    {wizardStep === 6 && 'BIOMETRIC IDENTITY CONFIRMATION'}
                    {wizardStep === 7 && 'UNIFIED STATUTORY FEE PAYMENT'}
                    {wizardStep === 8 && 'MULTI-AUTHORITY VERIFICATION ENGINE'}
                    {wizardStep === 9 && 'DIGITALLY SIGNED CREDENTIALS ISSUED'}
                  </strong>
                </span>
                <span className="text-indigo-300 font-bold">{Math.round((wizardStep / 9) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 shadow-md shadow-indigo-500/50"
                  style={{ width: `${(wizardStep / 9) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-6">
              {/* STEP 1: Select Purpose */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white">
                    Step 1: Select Verification Purpose
                  </h3>
                  <p className="text-xs text-slate-300">
                    Choose the official legal reason you require document verification. This will be
                    cryptographically stamped onto all issued credentials in your dossier.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
                    {purposeOptions.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPurpose(p.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition backdrop-blur-xl ${
                          selectedPurpose === p.id
                            ? 'bg-white/15 border-indigo-400 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-400/30'
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{p.title}</h4>
                          {selectedPurpose === p.id && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{p.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      id="btn-step1-next"
                      onClick={() => setWizardStep(2)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 cursor-pointer"
                    >
                      <span>Proceed to Document Dossier ({basketDocs.length} Docs)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Multi-Document Dossier Builder */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Step 2: Build Verification Dossier ({basketDocs.length} Document{basketDocs.length > 1 ? 's' : ''})
                      </h3>
                      <p className="text-xs text-slate-300">
                        Add one or multiple Pakistani documents to verify in a single bundled application.
                      </p>
                    </div>

                    {basketDocs.length > 1 && (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto">
                        <Sparkles className="w-3.5 h-3.5" />
                        20% Multi-Doc Discount Active!
                      </div>
                    )}
                  </div>

                  {/* Document Dossier Basket List */}
                  <div className="space-y-4">
                    {basketDocs.map((doc, idx) => (
                      <div
                        key={doc.id}
                        className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-lg space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-mono font-bold text-xs text-indigo-300">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-white">{doc.documentTypeName}</h4>
                              <p className="text-[11px] text-slate-400 font-mono">
                                Issuing Authority: {doc.authority}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveDocumentFromBasket(doc.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                            title="Remove document from dossier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Metadata inputs specific to doc type */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-white/5">
                          {doc.documentType === 'police_certificate' && (
                            <>
                              <div>
                                <label className="block text-slate-300 mb-1">Issuing District</label>
                                <input
                                  type="text"
                                  value={doc.issuingDistrict}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'issuingDistrict', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white font-mono focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1">Police Station / Khidmat Markaz</label>
                                <input
                                  type="text"
                                  value={doc.policeStation}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'policeStation', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white font-mono focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1">Police Reference Number</label>
                                <input
                                  type="text"
                                  value={doc.registrationNumber}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'registrationNumber', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white font-mono focus:border-indigo-400"
                                />
                              </div>
                            </>
                          )}

                          {doc.documentType === 'higher_education_degree' && (
                            <>
                              <div>
                                <label className="block text-slate-300 mb-1">Degree Title & Major</label>
                                <input
                                  type="text"
                                  value={doc.degreeTitle}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'degreeTitle', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1">Accredited University / Institute</label>
                                <input
                                  type="text"
                                  value={doc.institution}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'institution', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1">HEC Registration / Roll Number</label>
                                <input
                                  type="text"
                                  value={doc.registrationNumber}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'registrationNumber', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white font-mono focus:border-indigo-400"
                                />
                              </div>
                            </>
                          )}

                          {doc.documentType === 'national_id' && (
                            <>
                              <div>
                                <label className="block text-slate-300 mb-1">National CNIC / NICOP Number</label>
                                <input
                                  type="text"
                                  value={doc.cnicNumber}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'cnicNumber', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white font-mono focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1">NADRA Division / Region</label>
                                <input
                                  type="text"
                                  value={doc.issuingDistrict}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'issuingDistrict', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1">Citizen Record Reference</label>
                                <input
                                  type="text"
                                  value={doc.registrationNumber}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'registrationNumber', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white font-mono focus:border-indigo-400"
                                />
                              </div>
                            </>
                          )}

                          {doc.documentType === 'driving_license' && (
                            <>
                              <div>
                                <label className="block text-slate-300 mb-1">Driving License Number</label>
                                <input
                                  type="text"
                                  value={doc.licenseNumber}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'licenseNumber', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white font-mono focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1">Issuing Authority / Division</label>
                                <input
                                  type="text"
                                  value={doc.issuingDistrict}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'issuingDistrict', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1">License Category</label>
                                <input
                                  type="text"
                                  value={doc.category || 'LTV / HTV Commercial'}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'category', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                                />
                              </div>
                            </>
                          )}

                          {doc.documentType === 'professional_clearance' && (
                            <>
                              <div>
                                <label className="block text-slate-300 mb-1">Professional Council Registration</label>
                                <input
                                  type="text"
                                  value={doc.licenseNumber}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'licenseNumber', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white font-mono focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1">Council / Board Name</label>
                                <input
                                  type="text"
                                  value={doc.institution}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'institution', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1">BEOE Permission Number</label>
                                <input
                                  type="text"
                                  value={doc.registrationNumber}
                                  onChange={(e) =>
                                    handleUpdateDocField(doc.id, 'registrationNumber', e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white font-mono focus:border-indigo-400"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Document Row */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold text-white">
                        Add Another Document to this Dossier:
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={activeDocTypeToAdd}
                        onChange={(e) => setActiveDocTypeToAdd(e.target.value as DocumentType)}
                        className="px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white focus:border-indigo-400"
                      >
                        {docCatalog.map((c) => (
                          <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                            {c.title}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleAddDocumentToBasket(activeDocTypeToAdd)}
                        className="px-4 py-2 bg-indigo-600/40 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl border border-indigo-400/40 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Document</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button
                      id="btn-step2-next"
                      onClick={() => setWizardStep(3)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 cursor-pointer"
                    >
                      <span>Proceed to Recipient</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Enter Named Recipient */}
              {wizardStep === 3 && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-base font-bold text-white">
                    Step 3: Enter Named Recipient Organization
                  </h3>
                  <p className="text-slate-300">
                    To prevent credential misuse and identity harvesting, credentials can only be
                    authorized for a named recipient entity (employer, embassy, university).
                  </p>

                  <div className="grid grid-cols-1 gap-3.5 max-w-xl">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Recipient Organization Name *
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={recipientOrgName}
                          onChange={(e) => setRecipientOrgName(e.target.value)}
                          placeholder="e.g. Systems Limited & TechCorp Pakistan"
                          className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Contact Person (Optional)
                        </label>
                        <input
                          type="text"
                          value={recipientContactPerson}
                          onChange={(e) => setRecipientContactPerson(e.target.value)}
                          placeholder="e.g. Syeda Ayesha Fatima"
                          className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Recipient Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="compliance@systemsltd.com"
                          className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white font-mono focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Reference Note / Application ID
                      </label>
                      <input
                        type="text"
                        value={recipientNote}
                        onChange={(e) => setRecipientNote(e.target.value)}
                        placeholder="e.g. Candidate Employment & Security Attestation"
                        className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button
                      id="btn-step3-next"
                      disabled={!recipientOrgName.trim()}
                      onClick={() => setWizardStep(4)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 cursor-pointer"
                    >
                      <span>Review Batch Summary</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review Summary */}
              {wizardStep === 4 && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-base font-bold text-white">
                    Step 4: Review Verification Dossier Summary
                  </h3>

                  <div className="bg-white/[0.04] backdrop-blur-xl p-5 rounded-2xl border border-white/10 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-white/10">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-mono">APPLICANT</span>
                        <span className="text-sm font-semibold text-white">{user.name}</span>
                        <p className="text-slate-300 font-mono text-[11px]">
                          CNIC: {user.nationalIdNumber || '35201-7894561-3'}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px] font-mono">NAMED RECIPIENT</span>
                        <span className="text-sm font-semibold text-white">{recipientOrgName}</span>
                        <p className="text-slate-300 text-[11px]">{recipientNote}</p>
                      </div>
                    </div>

                    {/* Itemized Documents in Dossier */}
                    <div className="space-y-2">
                      <span className="text-slate-300 font-bold block">
                        Included Documents ({basketDocs.length}):
                      </span>
                      <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
                        {itemizedPricing.map((item, idx) => (
                          <div key={item.id} className="p-3 bg-white/[0.02] flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-white block">
                                {idx + 1}. {item.documentTypeName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Authority: {item.authority}
                              </span>
                            </div>
                            <span className="font-mono text-slate-200">${item.fee.toFixed(2)} USD</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal Statutory Fee:</span>
                        <span>${rawTotalFee.toFixed(2)} USD</span>
                      </div>
                      {bundleDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Multi-Document Bundle Discount (20% Off):</span>
                          <span>-${bundleDiscount.toFixed(2)} USD</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/10">
                        <span>Total Statutory Fee Payable:</span>
                        <span className="text-emerald-400 font-mono text-base">
                          ${finalPayableFee.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setWizardStep(3)}
                      className="px-4 py-2 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button
                      id="btn-step4-proceed-consent"
                      onClick={handleProceedToConsent}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 cursor-pointer"
                    >
                      <span>Proceed to Citizen Consent</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Explicit Legal Consent */}
              {wizardStep === 5 && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Step 5: Provide Explicit Citizen Consent
                      </h3>
                      <p className="text-slate-300 text-[11px]">
                        Required by the National Data Protection & Document Verification Act 2026
                      </p>
                    </div>
                  </div>

                  {/* Consent Legal Terms Box */}
                  <div className="p-4 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-2">
                    <p className="font-bold text-indigo-300">
                      LEGAL CONSENT DECLARATION (VERSION v2.0-2026):
                    </p>
                    <p>
                      1. I, <strong>{user.name}</strong>, hereby explicitly authorize the National Document
                      Verification Gateway and participating government directorates (
                      {basketDocs.map((d) => d.documentTypeName).join(', ')}) to access, verify, and evaluate
                      my official character, biometric, educational, and licensing records.
                    </p>
                    <p>
                      2. I authorize the issuance of digitally signed verification credentials to be shared
                      exclusively with the named recipient: <strong>{recipientOrgName}</strong> for the
                      purpose of <strong>{purposeOptions.find((p) => p.id === selectedPurpose)?.title}</strong>.
                    </p>
                    <p>
                      3. I understand that this consent will be recorded in a tamper-evident cryptographic
                      audit ledger with my IP address and timestamp, and remains valid for 365 days unless
                      expressly revoked by me.
                    </p>
                  </div>

                  {/* Checkbox */}
                  <label className="flex items-start gap-3 p-3.5 bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition">
                    <input
                      id="checkbox-explicit-consent"
                      type="checkbox"
                      checked={consentAgreed}
                      onChange={(e) => setConsentAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white/10 border-white/20"
                    />
                    <div className="text-slate-200">
                      <span className="font-semibold block text-white">
                        I give explicit, informed consent for official document verification across all {basketDocs.length} documents
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Recorded at {new Date().toLocaleTimeString()} with SHA-256 audit anchor.
                      </span>
                    </div>
                  </label>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setWizardStep(4)}
                      className="px-4 py-2 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button
                      id="btn-step5-confirm-consent"
                      disabled={!consentAgreed}
                      onClick={handleConfirmConsent}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 cursor-pointer"
                    >
                      <span>Confirm Consent & Proceed to Biometrics</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: Biometric Identity Confirmation */}
              {wizardStep === 6 && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-base font-bold text-white">
                    Step 6: Biometric Identity Confirmation
                  </h3>
                  <p className="text-slate-300">
                    To prevent identity theft, confirm your presence via simulated optical biometric
                    liveness verification.
                  </p>

                  <div className="p-8 bg-white/[0.04] backdrop-blur-2xl rounded-[28px] border border-white/10 text-center flex flex-col items-center gap-3 shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/20">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      Optical Liveness Verification Required
                    </h4>
                    <p className="text-xs text-slate-300 max-w-sm">
                      Zero raw biometric data is logged or stored. Only cryptographic match tokens are
                      evaluated.
                    </p>

                    <button
                      id="btn-trigger-modal-biometric"
                      onClick={() => setIsBiometricModalOpen(true)}
                      className="mt-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 border border-indigo-400/30 cursor-pointer"
                    >
                      <span>Launch Biometric Camera Sensor</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 7: Payment */}
              {wizardStep === 7 && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-base font-bold text-white">
                    Step 7: Complete Verification Service Payment
                  </h3>
                  <p className="text-slate-300">
                    Pay the unified statutory fee to dispatch all {basketDocs.length} documents in this batch to issuing authorities.
                  </p>

                  <div className="bg-white/[0.04] backdrop-blur-xl p-5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h4 className="text-sm font-bold text-white">Government e-Pay Clearance (1Link / Raast)</h4>
                        <p className="text-[11px] text-slate-300 font-mono">
                          Batch #{createdBatchId} • {basketDocs.length} Document Dossier
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-mono font-bold text-emerald-400">
                          ${finalPayableFee.toFixed(2)} USD
                        </span>
                        {bundleDiscount > 0 && (
                          <span className="block text-[10px] text-emerald-400/80 font-mono">
                            Includes ${bundleDiscount.toFixed(2)} Bundle Savings
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-slate-300 font-semibold text-[11px]">
                        Select Payment Method:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['GOVT_EPAY', 'CREDIT_CARD', '1LINK_GATEWAY'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`p-3 rounded-xl border text-center transition font-mono text-[11px] cursor-pointer ${
                              paymentMethod === method
                                ? 'bg-white/15 border-indigo-400 text-white font-bold shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-400/30'
                                : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      id="btn-step7-pay"
                      disabled={isPaying}
                      onClick={handleCompletePayment}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 cursor-pointer"
                    >
                      {isPaying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Authorizing 1Link Gateway...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Pay ${finalPayableFee.toFixed(2)} & Dispatch All Documents
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 8: Authority Verification Terminal Engine */}
              {wizardStep === 8 && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Step 8: Multi-Authority Verification Engine Active
                      </h3>
                      <p className="text-slate-300 text-[11px]">
                        Executing live adapter queries across participating institutional gateways...
                      </p>
                    </div>
                  </div>

                  {/* Terminal Execution Window */}
                  <div className="p-5 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl font-mono text-[11px] space-y-2 shadow-inner max-h-80 overflow-y-auto">
                    <div className="text-slate-400 pb-1.5 border-b border-white/10 flex justify-between">
                      <span>GATEWAY EXECUTION LOG (BATCH #{createdBatchId})</span>
                      <span className="text-emerald-400 animate-pulse">STREAM ACTIVE</span>
                    </div>
                    {adapterLogs.map((log, index) => (
                      <p key={index} className="text-emerald-400">
                        {log}
                      </p>
                    ))}
                    {isVerifyingWithAdapter && (
                      <p className="text-cyan-400 animate-pulse">
                        &gt; Awaiting cryptographically sealed authority signatures...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 9: Multi-Credentials Issued & Complete */}
              {wizardStep === 9 && createdBatchCredentials.length > 0 && (
                <div className="space-y-5 text-xs">
                  <div className="p-6 bg-emerald-500/10 backdrop-blur-2xl border border-emerald-400/30 rounded-[28px] text-center space-y-2 shadow-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mx-auto shadow-lg">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                      Batch Verification Complete • {createdBatchCredentials.length} Credentials Issued
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      Official Digitally Signed Credentials Ready
                    </h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      All documents in Batch #{createdBatchId} have been verified genuine by their respective authorities and sealed with Ed25519 root signatures.
                    </p>

                    <div className="pt-2 flex items-center justify-center gap-3">
                      <button
                        onClick={handleCopyAllCodes}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-mono text-xs flex items-center gap-1.5 border border-white/20 cursor-pointer"
                      >
                        {copiedBatchCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedBatchCodes ? 'Copied Reference Codes' : 'Copy All Reference Codes'}
                      </button>
                    </div>
                  </div>

                  {/* Issued Credentials Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {createdBatchCredentials.map((cred, idx) => (
                      <div
                        key={cred.credential_id}
                        className="bg-white/[0.04] backdrop-blur-xl p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-mono font-bold text-emerald-300">
                              {cred.reference_code}
                            </span>
                            <CredentialStatusBadge status={cred.status} size="sm" showDot />
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-mono uppercase">
                              DOCUMENT TYPE
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {cred.document_type_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-mono uppercase">
                              ISSUING AUTHORITY
                            </span>
                            <span className="text-slate-200 text-xs">{cred.issuer}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-mono uppercase">
                              ED25519 SIGNATURE
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 truncate block">
                              {cred.signature}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setSelectedCredential(cred);
                              setIsCertificateModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 text-[11px] cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Signed PDF
                          </button>
                          <button
                            onClick={() => onNavigateToPublicVerify(cred.reference_code)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] flex items-center gap-1.5 border border-white/15 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            QR Verify
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                      onClick={() => setActiveTab('DASHBOARD')}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold border border-white/15 cursor-pointer"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB: REQUEST DETAILS ===================== */}
        {activeTab === 'REQUEST_DETAILS' && selectedRequest && (
          <div className="space-y-6">
            {/* Top Back Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab('DASHBOARD')}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </button>
              <span className="font-mono text-xs text-indigo-300 font-semibold bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                Request ID: {selectedRequest.id}
              </span>
            </div>

            {/* Request Status Banner */}
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[28px] p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="text-xs font-mono text-slate-400">REFERENCE CODE</span>
                  <h2 className="text-2xl font-mono font-bold text-indigo-300">
                    {selectedRequest.referenceCode}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedRequest.documentTypeName} • {selectedRequest.purposeName}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400 block">CURRENT STATE</span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 inline-block mt-1 backdrop-blur-md">
                    {selectedRequest.state}
                  </span>
                </div>
              </div>

              {/* State Machine Transition Timeline */}
              <div className="mt-6">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">
                  State Machine Lifecycle History (Section 4.1)
                </h4>
                <div className="relative border-l-2 border-white/10 ml-3 space-y-4 text-xs">
                  {selectedRequest.stateHistory.map((step, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-300">{step.state}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        {step.note || 'State transition recorded.'}{' '}
                        {step.actor && <span className="text-slate-400">({step.actor})</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2 justify-end">
                {selectedRequest.state === 'CREDENTIAL_ISSUED' && (
                  <button
                    onClick={() => {
                      const cred = userCredentials.find(
                        (c) => c.reference_code === selectedRequest.referenceCode
                      );
                      if (cred) {
                        setSelectedCredential(cred);
                        setIsCertificateModalOpen(true);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 border border-emerald-400/30 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Signed Certificate
                  </button>
                )}
                <button
                  onClick={() => onNavigateToPublicVerify(selectedRequest.referenceCode)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 border border-white/15 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Public Verification Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: CREDENTIALS ===================== */}
        {activeTab === 'CREDENTIALS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">My Issued Digital Credentials</h3>
                <p className="text-xs text-slate-300">
                  Digitally signed with Ed25519 government root keys and verifiable online.
                </p>
              </div>
            </div>

            {userCredentials.length === 0 ? (
              <div className="p-8 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[28px] text-center text-slate-400 text-xs">
                No issued credentials found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCredentials.map((cred) => (
                  <div
                    key={cred.credential_id}
                    className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] p-6 shadow-2xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-indigo-300">
                          {cred.reference_code}
                        </span>
                        <CredentialStatusBadge status={cred.status} size="xs" showDot />
                      </div>
                      <h4 className="text-sm font-bold text-white">{cred.document_type_name}</h4>
                      <p className="text-xs text-slate-200 mt-1">Recipient: {cred.recipient}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Purpose: {cred.purpose}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-2">
                        Issued: {new Date(cred.issued_at).toLocaleDateString()} • Expires:{' '}
                        {new Date(cred.expires_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedCredential(cred);
                          setIsCertificateModalOpen(true);
                        }}
                        className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Certificate
                      </button>
                      <button
                        onClick={() => onNavigateToPublicVerify(cred.reference_code)}
                        className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" /> QR Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: CONSENT HISTORY ===================== */}
        {activeTab === 'CONSENT_HISTORY' && (
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Audited Consent History</h3>
                <p className="text-xs text-slate-300">
                  Explicit citizen authorizations recorded pursuant to Section 4.2
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-300 font-mono border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Reference Code</th>
                    <th className="p-3.5">Named Recipient</th>
                    <th className="p-3.5">Purpose & Document</th>
                    <th className="p-3.5">Consent Version</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {userConsents.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition">
                      <td className="p-3.5 font-mono text-indigo-300 font-bold">
                        {c.referenceCode}
                      </td>
                      <td className="p-3.5 text-white font-medium">{c.recipient}</td>
                      <td className="p-3.5 text-slate-200">
                        <div className="font-semibold text-white">{c.documentType}</div>
                        <span className="text-[10px] text-slate-400">{c.purpose}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{c.consentVersion}</td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {new Date(c.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB: PAYMENT HISTORY ===================== */}
        {activeTab === 'PAYMENT_HISTORY' && (
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Payment Transaction History</h3>
                <p className="text-xs text-slate-300">
                  Audited statutory fee transactions for verification services (Section 4.10)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-300 font-mono border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Transaction Ref</th>
                    <th className="p-3.5">Request Reference</th>
                    <th className="p-3.5">Payment Method</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {userPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition">
                      <td className="p-3.5 font-mono text-slate-300">{p.transactionReference}</td>
                      <td className="p-3.5 font-mono text-indigo-300 font-bold">
                        {p.referenceCode}
                      </td>
                      <td className="p-3.5 font-mono text-slate-200">{p.paymentMethod}</td>
                      <td className="p-3.5 font-mono font-bold text-white">
                        ${p.amount.toFixed(2)} {p.currency}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {new Date(p.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB: PROFILE ===================== */}
        {activeTab === 'PROFILE' && (
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[28px] p-6 shadow-2xl max-w-xl text-xs space-y-4">
            <h3 className="text-base font-bold text-white">Applicant Profile & Preferences</h3>
            <p className="text-slate-300">
              Manage your personal identity information and verification notification preferences.
            </p>

            {profileSaved && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-2 backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile updated successfully in local ledger.</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Registered Email</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">National ID / CNIC</label>
                <input
                  type="text"
                  disabled
                  value={user.nationalIdNumber || '35201-7894561-3'}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Mobile Contact</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white focus:border-indigo-400"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    dbService.updateUserProfile(user.id, {
                      name: profileName.trim() || user.name,
                      phone: profilePhone.trim() || user.phone,
                    });
                    setProfileSaved(true);
                    setTimeout(() => setProfileSaved(false), 2500);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Biometric Scanner Modal */}
      <BiometricScannerModal
        isOpen={isBiometricModalOpen}
        applicantName={user.name}
        nationalId={user.nationalIdNumber || '35201-7894561-3'}
        onComplete={handleBiometricComplete}
        onCancel={() => setIsBiometricModalOpen(false)}
      />

      {/* Signed Certificate Modal */}
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
