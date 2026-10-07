import {
  User,
  Organization,
  VerificationRequest,
  DigitalCredential,
  ConsentRecord,
  PaymentRecord,
  PricingRule,
  AdapterConfig,
  AuditEvent,
  SecurityEvent,
  SigningKey,
  UserRole,
  VerificationResult,
  RequestState,
  DocumentType,
  VerificationPurpose,
} from '../types';
import { CryptoService } from './cryptoService';

const STORAGE_KEY = 'NDVG_SYSTEM_STATE_V3_PK';

export interface SystemDatabaseState {
  users: User[];
  currentUser: User | null;
  organizations: Organization[];
  requests: VerificationRequest[];
  credentials: DigitalCredential[];
  consents: ConsentRecord[];
  payments: PaymentRecord[];
  pricingRules: PricingRule[];
  adapters: AdapterConfig[];
  signingKeys: SigningKey[];
  auditLogs: AuditEvent[];
  securityEvents: SecurityEvent[];
}

// Helper to create seed hash chained audit logs
function createInitialAuditChain(): AuditEvent[] {
  const rawEvents: Array<{
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    action: string;
    resourceType: string;
    resourceId: string;
    result: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'SUSPICIOUS';
    details: string;
    ipAddress: string;
  }> = [
    {
      id: 'AUD-0001',
      timestamp: '2026-08-01T09:00:00.000Z',
      userId: 'USR-SYS-01',
      userName: 'Dr. Khurram Shahzad (SecOps)',
      userRole: 'SYSTEM_ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      resourceType: 'PLATFORM_CONFIG',
      resourceId: 'GATEWAY-ROOT-KEY',
      result: 'SUCCESS',
      details: 'National Gateway cryptographic root key v2.1-gov-ed25519 initialized with TEE HSM attestation (NITB GovNet Node).',
      ipAddress: '10.240.0.1 (GovNet PK)',
    },
    {
      id: 'AUD-0002',
      timestamp: '2026-08-02T10:15:30.000Z',
      userId: 'USR-APP-01',
      userName: 'Muhammad Zeeshan Tariq',
      userRole: 'APPLICANT',
      action: 'CONSENT_GRANTED',
      resourceType: 'CONSENT_RECORD',
      resourceId: 'CNS-001',
      result: 'SUCCESS',
      details: 'Applicant provided explicit consent for Police Khidmat Character Clearance shared with Systems Limited & TechCorp Pakistan.',
      ipAddress: '39.40.120.45 (PTCL Islamabad)',
    },
    {
      id: 'AUD-0003',
      timestamp: '2026-08-02T10:18:12.000Z',
      userId: 'USR-APP-01',
      userName: 'Muhammad Zeeshan Tariq',
      userRole: 'APPLICANT',
      action: 'BIOMETRIC_VERIFIED',
      resourceType: 'BIOMETRIC_SESSION',
      resourceId: 'BIO-SES-991',
      result: 'SUCCESS',
      details: 'Facial liveness verification verified against NADRA Citizen Identity Repository with 99.4% confidence.',
      ipAddress: '39.40.120.45 (PTCL Islamabad)',
    },
    {
      id: 'AUD-0004',
      timestamp: '2026-08-02T10:20:00.000Z',
      userId: 'USR-APP-01',
      userName: 'Muhammad Zeeshan Tariq',
      userRole: 'APPLICANT',
      action: 'PAYMENT_AUTHORIZED',
      resourceType: 'PAYMENT_TRANSACTION',
      resourceId: 'PAY-8821',
      result: 'SUCCESS',
      details: 'Attestation fee PKR 3,500 ($30.00) authorized via Govt 1Link 1Bill transaction #1LINK-98218-PK.',
      ipAddress: '39.40.120.45 (PTCL Islamabad)',
    },
    {
      id: 'AUD-0005',
      timestamp: '2026-08-02T10:21:30.000Z',
      userId: 'USR-SYS-01',
      userName: 'Police Verification Engine',
      userRole: 'SYSTEM_ADMIN',
      action: 'VERIFICATION_EXECUTED',
      resourceType: 'POLICE_ADAPTER',
      resourceId: 'ADAPT-POLICE-01',
      result: 'SUCCESS',
      details: 'Police Khidmat Markaz Adapter confirmed citizen record PCRR-REG-847291/2026: GENUINE (Clean Record).',
      ipAddress: '10.240.2.14 (Islamabad Police CPO)',
    },
    {
      id: 'AUD-0006',
      timestamp: '2026-08-02T10:21:45.000Z',
      userId: 'USR-SYS-01',
      userName: 'Cryptographic Engine',
      userRole: 'SYSTEM_ADMIN',
      action: 'CREDENTIAL_ISSUED',
      resourceType: 'DIGITAL_CREDENTIAL',
      resourceId: 'CRED-9021',
      result: 'SUCCESS',
      details: 'Digitally signed credential issued with reference NDVG-8K2R-9M4Q and Ed25519 government signature.',
      ipAddress: '10.240.0.1',
    },
    {
      id: 'AUD-0007',
      timestamp: '2026-08-05T14:30:00.000Z',
      userId: 'USR-INST-01',
      userName: 'Syeda Ayesha Fatima (HR)',
      userRole: 'INSTITUTION_USER',
      action: 'PUBLIC_CREDENTIAL_VERIFIED',
      resourceType: 'DIGITAL_CREDENTIAL',
      resourceId: 'NDVG-8K2R-9M4Q',
      result: 'SUCCESS',
      details: 'Employer verified credential NDVG-8K2R-9M4Q for applicant Muhammad Zeeshan Tariq: GENUINE / VALID.',
      ipAddress: '115.186.150.22 (Systems Ltd Lahore)',
    },
    {
      id: 'AUD-0008',
      timestamp: '2026-08-10T11:00:00.000Z',
      userId: 'USR-SYS-01',
      userName: 'Dr. Khurram Shahzad (SecOps)',
      userRole: 'SYSTEM_ADMIN',
      action: 'CREDENTIAL_REVOKED',
      resourceType: 'DIGITAL_CREDENTIAL',
      resourceId: 'CRED-9025',
      result: 'SUCCESS',
      details: 'Admin revoked credential NDVG-5L8K-7Y2Z. Reason: Islamabad High Court Directive #IHC-CR-44109 Issued.',
      ipAddress: '10.240.0.1',
    },
  ];

  let prevHash = 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';
  const auditedList: AuditEvent[] = [];

  for (const item of rawEvents) {
    const hash = CryptoService.computeAuditEventHash({
      id: item.id,
      timestamp: item.timestamp,
      userId: item.userId,
      userName: item.userName,
      userRole: item.userRole,
      action: item.action,
      resourceType: item.resourceType,
      resourceId: item.resourceId,
      result: item.result,
      details: item.details,
      ipAddress: item.ipAddress,
      previousEventHash: prevHash,
    });

    auditedList.push({
      ...item,
      previousEventHash: prevHash,
      currentEventHash: hash,
    });

    prevHash = hash;
  }

  return auditedList;
}

function getInitialDatabaseState(): SystemDatabaseState {
  const users: User[] = [
    {
      id: 'USR-APP-01',
      name: 'Muhammad Zeeshan Tariq',
      email: 'applicant@ndvg.gov.pk',
      role: 'APPLICANT',
      status: 'ACTIVE',
      nationalIdNumber: '35201-7894561-3',
      phone: '+92 (300) 845-9214',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: '2026-07-15T08:00:00.000Z',
      lastLoginAt: '2026-08-16T06:20:00.000Z',
    },
    {
      id: 'USR-INST-01',
      name: 'Syeda Ayesha Fatima',
      email: 'ayesha.fatima@techcorp.pk',
      role: 'INSTITUTION_USER',
      organizationId: 'ORG-001',
      organizationName: 'Systems Limited & TechCorp Pakistan',
      department: 'Talent Acquisition & Compliance',
      status: 'ACTIVE',
      phone: '+92 (42) 3587-4100',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      createdAt: '2026-06-10T09:00:00.000Z',
      lastLoginAt: '2026-08-16T05:15:00.000Z',
    },
    {
      id: 'USR-INST-02',
      name: 'Shahid Raza Malik',
      email: 'consular.attest@embassy.gov.pk',
      role: 'INSTITUTION_ADMIN',
      organizationId: 'ORG-002',
      organizationName: 'Royal Embassy Visa & Consular Attestation Wing, Islamabad',
      department: 'Consular Verification & Legalization Division',
      status: 'ACTIVE',
      phone: '+92 (51) 903-2400',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: '2026-05-01T11:00:00.000Z',
      lastLoginAt: '2026-08-15T14:45:00.000Z',
    },
    {
      id: 'USR-SYS-01',
      name: 'Dr. Khurram Shahzad',
      email: 'admin.root@ndvg.gov.pk',
      role: 'SYSTEM_ADMIN',
      department: 'National Cyber Security & Digital Identity Directorate (NITB / MoITT)',
      status: 'ACTIVE',
      phone: '+92 (51) 920-5501',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: '2026-08-16T06:30:00.000Z',
    },
  ];

  const organizations: Organization[] = [
    {
      id: 'ORG-001',
      name: 'Systems Limited & TechCorp Pakistan',
      code: 'SYSTEMS-PK',
      type: 'EMPLOYER',
      verified: true,
      contactEmail: 'compliance@systemsltd.com',
      contactPhone: '+92 (42) 3587-4100',
      address: 'Software Technology Park, Ferozepur Road, Lahore',
      webhookUrl: 'https://api.systemsltd.com/v1/verifications/webhook',
      createdAt: '2026-01-10T00:00:00.000Z',
    },
    {
      id: 'ORG-002',
      name: 'Royal Embassy Visa & Consular Attestation Wing, Islamabad',
      code: 'EMBASSY-ISB',
      type: 'EMBASSY',
      verified: true,
      contactEmail: 'visa.verify@embassy.gov.pk',
      contactPhone: '+92 (51) 903-2400',
      address: 'Diplomatic Enclave, Sector G-5, Islamabad',
      webhookUrl: 'https://embassy.gov.pk/secure-feed',
      createdAt: '2026-01-12T00:00:00.000Z',
    },
    {
      id: 'ORG-003',
      name: 'National University of Sciences and Technology (NUST)',
      code: 'NUST-ISB',
      type: 'UNIVERSITY',
      verified: true,
      contactEmail: 'admissions@nust.edu.pk',
      contactPhone: '+92 (51) 9085-1000',
      address: 'Sector H-12, Main Campus, Islamabad',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
    {
      id: 'ORG-004',
      name: 'Federal Directorate of Police Verification & Character Clearance',
      code: 'POLICE-PK',
      type: 'GOVERNMENT_AUTHORITY',
      verified: true,
      contactEmail: 'clearance@police.gov.pk',
      contactPhone: '+92 (51) 920-1111',
      address: 'Central Police Command, Police Lines Sector H-11, Islamabad',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'ORG-005',
      name: 'Higher Education Commission (HEC) Accreditation Directorate',
      code: 'HEC-PK',
      type: 'GOVERNMENT_AUTHORITY',
      verified: true,
      contactEmail: 'attestation@hec.gov.pk',
      contactPhone: '+92 (51) 9040-0000',
      address: 'HEC Secretariat, Sector H-9, Islamabad',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'ORG-006',
      name: 'Bureau of Emigration & Overseas Employment (BEOE)',
      code: 'BEOE-PK',
      type: 'GOVERNMENT_AUTHORITY',
      verified: true,
      contactEmail: 'director.clearance@beoe.gov.pk',
      contactPhone: '+92 (51) 910-7270',
      address: 'Emigration Tower, 10 Mauve Area, Sector G-8/1, Islamabad',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  // Pre-seed credentials
  const seedCred1Payload = {
    credential_id: 'CRED-9021',
    reference_code: 'NDVG-8K2R-9M4Q',
    document_type: 'police_certificate',
    applicant_name: 'Muhammad Zeeshan Tariq',
    recipient: 'Systems Limited & TechCorp Pakistan',
    result: 'GENUINE',
    issued_at: '2026-08-02T10:21:45.000Z',
    expires_at: '2027-08-02T10:21:45.000Z',
    issuer: 'Federal Directorate of Police Character Verification Services (ICT Police / Punjab Police CPO)',
  };
  const seedCred1Hash = CryptoService.computeCredentialPayloadHash(seedCred1Payload);

  const seedCred2Payload = {
    credential_id: 'CRED-9022',
    reference_code: 'NDVG-4T7N-3W8L',
    document_type: 'higher_education_degree',
    applicant_name: 'Muhammad Zeeshan Tariq',
    recipient: 'Royal Embassy Visa & Consular Attestation Wing, Islamabad',
    result: 'GENUINE',
    issued_at: '2026-08-08T16:00:00.000Z',
    expires_at: '2027-08-08T16:00:00.000Z',
    issuer: 'Higher Education Commission (HEC) Attestation Directorate, Islamabad',
  };
  const seedCred2Hash = CryptoService.computeCredentialPayloadHash(seedCred2Payload);

  const seedCred3Payload = {
    credential_id: 'CRED-9024',
    reference_code: 'NDVG-2X9P-1F5M',
    document_type: 'police_certificate',
    applicant_name: 'Asad Ullah Khan',
    recipient: 'Gulf Overseas Recruitment Bureau, Rawalpindi',
    result: 'NOT_GENUINE',
    issued_at: '2026-08-09T12:00:00.000Z',
    expires_at: '2027-08-09T12:00:00.000Z',
    issuer: 'Federal Directorate of Police Character Verification Services',
  };
  const seedCred3Hash = CryptoService.computeCredentialPayloadHash(seedCred3Payload);

  const seedCred4Payload = {
    credential_id: 'CRED-9025',
    reference_code: 'NDVG-5L8K-7Y2Z',
    document_type: 'driving_license',
    applicant_name: 'Raza Mehmood Butt',
    recipient: 'National Logistics Cell (NLC)',
    result: 'GENUINE',
    issued_at: '2026-07-20T08:00:00.000Z',
    expires_at: '2027-07-20T08:00:00.000Z',
    issuer: 'National Highway & Motorway Police (NHMP) Licensing Authority',
  };
  const seedCred4Hash = CryptoService.computeCredentialPayloadHash(seedCred4Payload);

  const seedCred5Payload = {
    credential_id: 'CRED-9020',
    reference_code: 'NDVG-9E3X-4P7Q',
    document_type: 'police_certificate',
    applicant_name: 'Muhammad Zeeshan Tariq',
    recipient: 'Emirates Global Overseas Bureau, Islamabad',
    result: 'GENUINE',
    issued_at: '2025-01-15T09:00:00.000Z',
    expires_at: '2026-01-15T09:00:00.000Z',
    issuer: 'Federal Directorate of Police Character Verification Services',
  };
  const seedCred5Hash = CryptoService.computeCredentialPayloadHash(seedCred5Payload);

  const seedCred6Payload = {
    credential_id: 'CRED-9026',
    reference_code: 'NDVG-7H3M-2N9K',
    document_type: 'higher_education_degree',
    applicant_name: 'Fatima Zahra Noor',
    recipient: 'Pakistan Medical and Dental Council (PMDC)',
    result: 'GENUINE',
    issued_at: '2026-08-11T10:00:00.000Z',
    expires_at: '2027-08-11T10:00:00.000Z',
    issuer: 'Higher Education Commission (HEC) Attestation Directorate, Islamabad',
  };
  const seedCred6Hash = CryptoService.computeCredentialPayloadHash(seedCred6Payload);

  const credentials: DigitalCredential[] = [
    {
      credential_id: 'CRED-9021',
      reference_code: 'NDVG-8K2R-9M4Q',
      document_type: 'police_certificate',
      document_type_name: 'Police Character Clearance Certificate',
      purpose: 'Employment Abroad (Tech Sector Visa)',
      recipient: 'Systems Limited & TechCorp Pakistan',
      applicant_name: 'Muhammad Zeeshan Tariq',
      applicant_id_masked: '35201-*******-3',
      result: 'GENUINE',
      status: 'VALID',
      issued_at: '2026-08-02T10:21:45.000Z',
      expires_at: '2027-08-02T10:21:45.000Z',
      issuer: 'Federal Directorate of Police Character Verification Services (ICT Police / Punjab Police CPO)',
      key_version: 'v2.1-gov-ed25519',
      payload_hash: seedCred1Hash,
      signature: CryptoService.signCredential(seedCred1Hash, 'v2.1-gov-ed25519'),
      signature_algorithm: 'Ed25519-Simulation',
      verification_url: `${window.location.origin}/verify/NDVG-8K2R-9M4Q`,
      access_count: 8,
      last_verified_at: '2026-08-16T05:15:00.000Z',
    },
    {
      credential_id: 'CRED-9022',
      reference_code: 'NDVG-4T7N-3W8L',
      document_type: 'higher_education_degree',
      document_type_name: 'Higher Education Degree Attestation (MS CS - NUST)',
      purpose: 'Visa & Immigration Clearance',
      recipient: 'Royal Embassy Visa & Consular Attestation Wing, Islamabad',
      applicant_name: 'Muhammad Zeeshan Tariq',
      applicant_id_masked: '35201-*******-3',
      result: 'GENUINE',
      status: 'VALID',
      issued_at: '2026-08-08T16:00:00.000Z',
      expires_at: '2027-08-08T16:00:00.000Z',
      issuer: 'Higher Education Commission (HEC) Attestation Directorate, Islamabad',
      key_version: 'v2.1-gov-ed25519',
      payload_hash: seedCred2Hash,
      signature: CryptoService.signCredential(seedCred2Hash, 'v2.1-gov-ed25519'),
      signature_algorithm: 'Ed25519-Simulation',
      verification_url: `${window.location.origin}/verify/NDVG-4T7N-3W8L`,
      access_count: 3,
      last_verified_at: '2026-08-12T11:20:00.000Z',
    },
    {
      credential_id: 'CRED-9024',
      reference_code: 'NDVG-2X9P-1F5M',
      document_type: 'police_certificate',
      document_type_name: 'Police Character Clearance Certificate',
      purpose: 'Employment Abroad',
      recipient: 'Gulf Overseas Recruitment Bureau, Rawalpindi',
      applicant_name: 'Asad Ullah Khan',
      applicant_id_masked: '37405-*******-1',
      result: 'NOT_GENUINE',
      status: 'INVALID',
      issued_at: '2026-08-09T12:00:00.000Z',
      expires_at: '2027-08-09T12:00:00.000Z',
      issuer: 'Federal Directorate of Police Character Verification Services',
      key_version: 'v2.1-gov-ed25519',
      payload_hash: seedCred3Hash,
      signature: CryptoService.signCredential(seedCred3Hash, 'v2.1-gov-ed25519'),
      signature_algorithm: 'Ed25519-Simulation',
      verification_url: `${window.location.origin}/verify/NDVG-2X9P-1F5M`,
      access_count: 14,
      last_verified_at: '2026-08-15T09:40:00.000Z',
    },
    {
      credential_id: 'CRED-9025',
      reference_code: 'NDVG-5L8K-7Y2Z',
      document_type: 'driving_license',
      document_type_name: 'Driving License Record Clearance',
      purpose: 'Commercial Chauffeur Licensing',
      recipient: 'National Logistics Cell (NLC)',
      applicant_name: 'Raza Mehmood Butt',
      applicant_id_masked: '61101-*******-9',
      result: 'GENUINE',
      status: 'REVOKED',
      issued_at: '2026-07-20T08:00:00.000Z',
      expires_at: '2027-07-20T08:00:00.000Z',
      issuer: 'National Highway & Motorway Police (NHMP) Licensing Authority',
      key_version: 'v2.1-gov-ed25519',
      payload_hash: seedCred4Hash,
      signature: CryptoService.signCredential(seedCred4Hash, 'v2.1-gov-ed25519'),
      signature_algorithm: 'Ed25519-Simulation',
      verification_url: `${window.location.origin}/verify/NDVG-5L8K-7Y2Z`,
      revocation_reason: 'Revoked by System Admin: Islamabad High Court Directive #IHC-CR-44109 requiring certificate cancellation.',
      revoked_at: '2026-08-10T11:00:00.000Z',
      revoked_by: 'Dr. Khurram Shahzad (System Admin)',
      access_count: 2,
      last_verified_at: '2026-08-14T18:30:00.000Z',
    },
    {
      credential_id: 'CRED-9020',
      reference_code: 'NDVG-9E3X-4P7Q',
      document_type: 'police_certificate',
      document_type_name: 'Police Character Clearance Certificate',
      purpose: 'Employment Abroad',
      recipient: 'Emirates Global Overseas Bureau, Islamabad',
      applicant_name: 'Muhammad Zeeshan Tariq',
      applicant_id_masked: '35201-*******-3',
      result: 'GENUINE',
      status: 'EXPIRED',
      issued_at: '2025-01-15T09:00:00.000Z',
      expires_at: '2026-01-15T09:00:00.000Z',
      issuer: 'Federal Directorate of Police Character Verification Services',
      key_version: 'v2.1-gov-ed25519',
      payload_hash: seedCred5Hash,
      signature: CryptoService.signCredential(seedCred5Hash, 'v2.1-gov-ed25519'),
      signature_algorithm: 'Ed25519-Simulation',
      verification_url: `${window.location.origin}/verify/NDVG-9E3X-4P7Q`,
      access_count: 5,
      last_verified_at: '2026-01-10T14:20:00.000Z',
    },
    {
      credential_id: 'CRED-9026',
      reference_code: 'NDVG-7H3M-2N9K',
      document_type: 'higher_education_degree',
      document_type_name: 'Higher Education Degree Attestation (MBBS - KEMU)',
      purpose: 'Professional Licensing',
      recipient: 'Pakistan Medical and Dental Council (PMDC)',
      applicant_name: 'Fatima Zahra Noor',
      applicant_id_masked: '42101-*******-6',
      result: 'GENUINE',
      status: 'VALID',
      issued_at: '2026-08-11T10:00:00.000Z',
      expires_at: '2027-08-11T10:00:00.000Z',
      issuer: 'Higher Education Commission (HEC) Attestation Directorate, Islamabad',
      key_version: 'v2.1-gov-ed25519',
      payload_hash: seedCred6Hash,
      signature: CryptoService.signCredential(seedCred6Hash, 'v2.1-gov-ed25519'),
      signature_algorithm: 'Ed25519-Simulation',
      verification_url: `${window.location.origin}/verify/NDVG-7H3M-2N9K`,
      access_count: 7,
      last_verified_at: '2026-08-16T08:00:00.000Z',
    },
  ];

  const requests: VerificationRequest[] = [
    {
      id: 'REQ-2026-001',
      referenceCode: 'NDVG-8K2R-9M4Q',
      applicantId: 'USR-APP-01',
      applicantName: 'Muhammad Zeeshan Tariq',
      applicantEmail: 'applicant@ndvg.gov.pk',
      applicantNationalId: '35201-7894561-3',
      documentType: 'police_certificate',
      documentTypeName: 'Police Character Clearance Certificate',
      documentMetadata: {
        issuingDistrict: 'Islamabad Capital Territory (ICT)',
        cnicOrPassport: '35201-7894561-3',
        registrationNumber: 'PKM-ISB-2026-8814',
        policeStation: 'Police Khidmat Markaz F-6 Islamabad',
      },
      purpose: 'employment_abroad',
      purposeName: 'Employment Abroad',
      namedRecipient: {
        organizationName: 'Systems Limited & TechCorp Pakistan',
        contactPerson: 'Syeda Ayesha Fatima',
        contactEmail: 'ayesha.fatima@techcorp.pk',
        referenceNote: 'Senior Software Architect Candidate Attestation',
        organizationId: 'ORG-001',
      },
      state: 'CREDENTIAL_ISSUED',
      stateHistory: [
        { state: 'DRAFT', timestamp: '2026-08-02T10:14:00.000Z', actor: 'Muhammad Zeeshan Tariq' },
        { state: 'CONSENT_PENDING', timestamp: '2026-08-02T10:15:00.000Z', actor: 'Muhammad Zeeshan Tariq' },
        { state: 'CONSENT_CONFIRMED', timestamp: '2026-08-02T10:15:30.000Z', actor: 'Muhammad Zeeshan Tariq' },
        { state: 'PAYMENT_PENDING', timestamp: '2026-08-02T10:19:00.000Z', actor: 'Muhammad Zeeshan Tariq' },
        { state: 'PAYMENT_CONFIRMED', timestamp: '2026-08-02T10:20:00.000Z', actor: 'Payment Gateway (1Link)' },
        { state: 'VERIFICATION_PENDING', timestamp: '2026-08-02T10:20:05.000Z', actor: 'System' },
        { state: 'VERIFICATION_IN_PROGRESS', timestamp: '2026-08-02T10:20:10.000Z', actor: 'Police Khidmat Adapter' },
        { state: 'VERIFICATION_COMPLETED', timestamp: '2026-08-02T10:21:30.000Z', actor: 'Police Khidmat Adapter' },
        { state: 'CREDENTIAL_ISSUED', timestamp: '2026-08-02T10:21:45.000Z', actor: 'Crypto Engine' },
      ],
      consentGiven: true,
      consentTimestamp: '2026-08-02T10:15:30.000Z',
      consentVersion: 'v2.0-2026',
      biometricResult: 'SUCCESS',
      biometricTimestamp: '2026-08-02T10:18:12.000Z',
      paymentId: 'PAY-8821',
      paymentAmount: 30.0,
      paymentStatus: 'AUTHORIZED',
      paymentTimestamp: '2026-08-02T10:20:00.000Z',
      adapterId: 'police',
      verificationResult: 'GENUINE',
      verificationDetails: 'Clean criminal record clearance confirmed by Federal Directorate of Police Verification (Khidmat Markaz).',
      verificationTimestamp: '2026-08-02T10:21:30.000Z',
      credentialId: 'CRED-9021',
      credentialExpiresAt: '2027-08-02T10:21:45.000Z',
      createdAt: '2026-08-02T10:14:00.000Z',
      updatedAt: '2026-08-02T10:21:45.000Z',
    },
    {
      id: 'REQ-2026-002',
      referenceCode: 'NDVG-4T7N-3W8L',
      applicantId: 'USR-APP-01',
      applicantName: 'Muhammad Zeeshan Tariq',
      applicantEmail: 'applicant@ndvg.gov.pk',
      applicantNationalId: '35201-7894561-3',
      documentType: 'higher_education_degree',
      documentTypeName: 'Higher Education Degree Attestation',
      documentMetadata: {
        degreeTitle: 'Master of Science in Cybersecurity',
        institution: 'National University of Sciences and Technology (NUST)',
        registrationNumber: 'NUST-MSCS-2022-881',
      },
      purpose: 'visa_immigration',
      purposeName: 'Visa & Immigration',
      namedRecipient: {
        organizationName: 'Royal Embassy Visa & Consular Attestation Wing, Islamabad',
        contactPerson: 'Shahid Raza Malik',
        contactEmail: 'consular.attest@embassy.gov.pk',
        referenceNote: 'Immigrant Visa Category EB-2 Verification',
        organizationId: 'ORG-002',
      },
      state: 'CREDENTIAL_ISSUED',
      stateHistory: [
        { state: 'DRAFT', timestamp: '2026-08-08T15:45:00.000Z', actor: 'Muhammad Zeeshan Tariq' },
        { state: 'CONSENT_CONFIRMED', timestamp: '2026-08-08T15:48:00.000Z', actor: 'Muhammad Zeeshan Tariq' },
        { state: 'PAYMENT_CONFIRMED', timestamp: '2026-08-08T15:52:00.000Z', actor: 'Payment Gateway (Raast)' },
        { state: 'VERIFICATION_COMPLETED', timestamp: '2026-08-08T15:58:00.000Z', actor: 'HEC Adapter' },
        { state: 'CREDENTIAL_ISSUED', timestamp: '2026-08-08T16:00:00.000Z', actor: 'Crypto Engine' },
      ],
      consentGiven: true,
      consentTimestamp: '2026-08-08T15:48:00.000Z',
      consentVersion: 'v2.0-2026',
      biometricResult: 'SUCCESS',
      biometricTimestamp: '2026-08-08T15:50:00.000Z',
      paymentId: 'PAY-8829',
      paymentAmount: 40.0,
      paymentStatus: 'AUTHORIZED',
      paymentTimestamp: '2026-08-08T15:52:00.000Z',
      adapterId: 'hec',
      verificationResult: 'GENUINE',
      verificationDetails: 'Degree verified genuine and officially accredited by Higher Education Commission (HEC) Attestation Directorate.',
      verificationTimestamp: '2026-08-08T15:58:00.000Z',
      credentialId: 'CRED-9022',
      credentialExpiresAt: '2027-08-08T16:00:00.000Z',
      createdAt: '2026-08-08T15:45:00.000Z',
      updatedAt: '2026-08-08T16:00:00.000Z',
    },
    {
      id: 'REQ-2026-003',
      referenceCode: 'NDVG-9X3K-8P2Q',
      applicantId: 'USR-APP-01',
      applicantName: 'Muhammad Zeeshan Tariq',
      applicantEmail: 'applicant@ndvg.gov.pk',
      applicantNationalId: '35201-7894561-3',
      documentType: 'higher_education_degree',
      documentTypeName: 'Higher Education Degree Attestation',
      documentMetadata: {
        degreeTitle: 'Bachelor of Science in Computer Science',
        institution: 'FAST-NUCES Lahore Campus',
        registrationNumber: 'FAST-LHR-BCS-18-409',
      },
      purpose: 'higher_education',
      purposeName: 'Higher Education & Post-Doc',
      namedRecipient: {
        organizationName: 'National University of Sciences and Technology (NUST)',
        contactPerson: 'Admissions Directorate',
        contactEmail: 'admissions@nust.edu.pk',
        organizationId: 'ORG-003',
      },
      state: 'PAYMENT_CONFIRMED',
      stateHistory: [
        { state: 'DRAFT', timestamp: '2026-08-16T04:00:00.000Z', actor: 'Muhammad Zeeshan Tariq' },
        { state: 'CONSENT_CONFIRMED', timestamp: '2026-08-16T04:02:00.000Z', actor: 'Muhammad Zeeshan Tariq' },
        { state: 'PAYMENT_CONFIRMED', timestamp: '2026-08-16T04:05:00.000Z', actor: 'Payment Gateway (1Link)' },
      ],
      consentGiven: true,
      consentTimestamp: '2026-08-16T04:02:00.000Z',
      consentVersion: 'v2.0-2026',
      biometricResult: 'SUCCESS',
      biometricTimestamp: '2026-08-16T04:04:00.000Z',
      paymentId: 'PAY-8840',
      paymentAmount: 48.0,
      paymentStatus: 'AUTHORIZED',
      paymentTimestamp: '2026-08-16T04:05:00.000Z',
      adapterId: 'hec',
      createdAt: '2026-08-16T04:00:00.000Z',
      updatedAt: '2026-08-16T04:05:00.000Z',
    },
  ];

  const consents: ConsentRecord[] = [
    {
      id: 'CNS-001',
      requestId: 'REQ-2026-001',
      referenceCode: 'NDVG-8K2R-9M4Q',
      applicantId: 'USR-APP-01',
      applicantName: 'Muhammad Zeeshan Tariq',
      recipient: 'Systems Limited & TechCorp Pakistan',
      purpose: 'Employment Abroad',
      documentType: 'Police Character Clearance Certificate',
      consentVersion: 'v2.0-2026',
      timestamp: '2026-08-02T10:15:30.000Z',
      expiresAt: '2027-08-02T10:15:30.000Z',
      status: 'ACTIVE',
      ipAddress: '39.40.120.45 (Islamabad)',
    },
    {
      id: 'CNS-002',
      requestId: 'REQ-2026-002',
      referenceCode: 'NDVG-4T7N-3W8L',
      applicantId: 'USR-APP-01',
      applicantName: 'Muhammad Zeeshan Tariq',
      recipient: 'Royal Embassy Visa & Consular Attestation Wing, Islamabad',
      purpose: 'Visa & Immigration',
      documentType: 'Higher Education Degree Attestation',
      consentVersion: 'v2.0-2026',
      timestamp: '2026-08-08T15:48:00.000Z',
      expiresAt: '2027-08-08T15:48:00.000Z',
      status: 'ACTIVE',
      ipAddress: '39.40.120.45 (Islamabad)',
    },
  ];

  const payments: PaymentRecord[] = [
    {
      id: 'PAY-8821',
      requestId: 'REQ-2026-001',
      referenceCode: 'NDVG-8K2R-9M4Q',
      applicantId: 'USR-APP-01',
      applicantName: 'Muhammad Zeeshan Tariq',
      amount: 30.0,
      currency: 'USD',
      status: 'AUTHORIZED',
      paymentMethod: 'GOVT_EPAY',
      transactionReference: '1LINK-98218-PK',
      timestamp: '2026-08-02T10:20:00.000Z',
      receiptUrl: '#receipt-8821',
    },
    {
      id: 'PAY-8829',
      requestId: 'REQ-2026-002',
      referenceCode: 'NDVG-4T7N-3W8L',
      applicantId: 'USR-APP-01',
      applicantName: 'Muhammad Zeeshan Tariq',
      amount: 40.0,
      currency: 'USD',
      status: 'AUTHORIZED',
      paymentMethod: 'CREDIT_CARD',
      transactionReference: 'RAAST-99120-PK',
      timestamp: '2026-08-08T15:52:00.000Z',
      receiptUrl: '#receipt-8829',
    },
    {
      id: 'PAY-8840',
      requestId: 'REQ-2026-003',
      referenceCode: 'NDVG-9X3K-8P2Q',
      applicantId: 'USR-APP-01',
      applicantName: 'Muhammad Zeeshan Tariq',
      amount: 48.0,
      currency: 'USD',
      status: 'AUTHORIZED',
      paymentMethod: 'GOVT_EPAY',
      transactionReference: '1LINK-10492-PK',
      timestamp: '2026-08-16T04:05:00.000Z',
      receiptUrl: '#receipt-8840',
    },
  ];

  const pricingRules: PricingRule[] = [
    {
      id: 'PRC-01',
      documentType: 'police_certificate',
      documentTypeName: 'Police Character Certificate',
      purpose: 'employment_abroad',
      purposeName: 'Employment Abroad',
      baseFee: 25.0,
      processingFee: 5.0,
      expeditedFee: 15.0,
      active: true,
      currency: 'USD',
      lastModified: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'PRC-02',
      documentType: 'police_certificate',
      documentTypeName: 'Police Character Certificate',
      purpose: 'visa_immigration',
      purposeName: 'Visa & Immigration',
      baseFee: 35.0,
      processingFee: 5.0,
      expeditedFee: 20.0,
      active: true,
      currency: 'USD',
      lastModified: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'PRC-03',
      documentType: 'national_id',
      documentTypeName: 'National ID Citizen Verification',
      purpose: 'employment_abroad',
      purposeName: 'Employment Abroad',
      baseFee: 15.0,
      processingFee: 3.0,
      expeditedFee: 10.0,
      active: true,
      currency: 'USD',
      lastModified: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'PRC-04',
      documentType: 'higher_education_degree',
      documentTypeName: 'Higher Education Degree Attestation',
      purpose: 'higher_education',
      purposeName: 'Higher Education',
      baseFee: 40.0,
      processingFee: 8.0,
      expeditedFee: 25.0,
      active: true,
      currency: 'USD',
      lastModified: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'PRC-05',
      documentType: 'driving_license',
      documentTypeName: 'Driving License Record Clearance',
      purpose: 'employment_abroad',
      purposeName: 'Employment Abroad',
      baseFee: 20.0,
      processingFee: 4.0,
      expeditedFee: 10.0,
      active: true,
      currency: 'USD',
      lastModified: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'PRC-06',
      documentType: 'professional_clearance',
      documentTypeName: 'Professional Recruiter Clearance',
      purpose: 'professional_licensing',
      purposeName: 'Professional Licensing',
      baseFee: 30.0,
      processingFee: 5.0,
      expeditedFee: 15.0,
      active: true,
      currency: 'USD',
      lastModified: '2026-01-01T00:00:00.000Z',
    },
  ];

  const adapters: AdapterConfig[] = [
    {
      id: 'police',
      name: 'Police Character Clearance Gateway (PCRR)',
      documentType: 'police_certificate',
      authorityName: 'Federal Directorate of Police Verification',
      status: 'SIMULATED',
      endpointUrl: 'https://pcrr.gov.police.internal/v2/verify',
      simulatedLatencyMs: 1400,
      description: 'Federal and provincial police criminal history & character verification gateway.',
      healthScore: 99.8,
      totalCalls: 12450,
      successfulCalls: 12410,
      lastPing: '2026-08-16T06:35:00.000Z',
    },
    {
      id: 'nadra',
      name: 'NADRA Citizen Identity Verification',
      documentType: 'national_id',
      authorityName: 'National Database and Registration Authority',
      status: 'ACTIVE',
      endpointUrl: 'https://api.nadra.gov.pk/v3/citizen/verify',
      simulatedLatencyMs: 950,
      description: 'National citizen identity registry and biometric verification endpoint.',
      healthScore: 100.0,
      totalCalls: 45120,
      successfulCalls: 45090,
      lastPing: '2026-08-16T06:36:00.000Z',
    },
    {
      id: 'hec',
      name: 'HEC Degree Attestation Engine',
      documentType: 'higher_education_degree',
      authorityName: 'Higher Education Commission Accreditation Board',
      status: 'ACTIVE',
      endpointUrl: 'https://eattest.hec.gov.pk/api/verify',
      simulatedLatencyMs: 1100,
      description: 'Higher Education Commission degree attestation and university verification.',
      healthScore: 98.4,
      totalCalls: 8930,
      successfulCalls: 8870,
      lastPing: '2026-08-16T06:30:00.000Z',
    },
    {
      id: 'driving_license',
      name: 'National Traffic & Licensing Registry',
      documentType: 'driving_license',
      authorityName: 'Federal Traffic Licensing Directorate',
      status: 'ACTIVE',
      endpointUrl: 'https://dlas.traffic.gov.pk/api/clearance',
      simulatedLatencyMs: 900,
      description: 'National highway driver license history and endorsement records.',
      healthScore: 99.1,
      totalCalls: 6200,
      successfulCalls: 6180,
      lastPing: '2026-08-16T06:32:00.000Z',
    },
    {
      id: 'recruiter',
      name: 'Bureau of Emigration & Overseas Employment',
      documentType: 'professional_clearance',
      authorityName: 'Bureau of Emigration & Overseas Employment',
      status: 'ACTIVE',
      endpointUrl: 'https://beoe.gov.pk/api/recruitment/clearance',
      simulatedLatencyMs: 850,
      description: 'Overseas employment promoter clearance and registered candidate profiles.',
      healthScore: 97.9,
      totalCalls: 3410,
      successfulCalls: 3380,
      lastPing: '2026-08-16T06:28:00.000Z',
    },
  ];

  const auditLogs = createInitialAuditChain();

  const securityEvents: SecurityEvent[] = [
    {
      id: 'SEC-01',
      timestamp: '2026-08-16T05:12:00.000Z',
      eventType: 'FAILED_LOGIN',
      severity: 'LOW',
      ipAddress: '115.186.150.89',
      description: 'Multiple failed password attempts for user candidate.verification@punjab.gov.pk (3 attempts).',
      recommendedAction: 'Trigger progressive delay and require CAPTCHA challenge.',
      resolved: true,
    },
    {
      id: 'SEC-02',
      timestamp: '2026-08-15T22:40:00.000Z',
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM',
      ipAddress: '203.124.45.10',
      description: 'Exceeded rate threshold: 60 queries/min on public verification endpoint /verify/{code}.',
      recommendedAction: 'Apply 15-minute IP rate restriction and log subnet telemetry.',
      resolved: true,
    },
    {
      id: 'SEC-03',
      timestamp: '2026-08-10T11:00:00.000Z',
      eventType: 'CREDENTIAL_REVOKED',
      severity: 'HIGH',
      userId: 'USR-SYS-01',
      userName: 'Dr. Khurram Shahzad',
      ipAddress: '10.240.0.1',
      resourceId: 'CRED-9025',
      description: 'Credential NDVG-5L8K-7Y2Z revoked pursuant to Islamabad High Court Directive #IHC-CR-44109.',
      recommendedAction: 'Broadcast revocation to public verification cache & audit ledger.',
      resolved: true,
    },
  ];

  const signingKeys: SigningKey[] = [
    {
      key_version: 'v2.1-gov-ed25519',
      algorithm: 'Ed25519',
      public_key: 'MCowBQYDK2VwAyEAGb8fD6vQk4uM7rP9xT2yW5nB8kL1vF3jH6mC0qS4zN8=',
      status: 'ACTIVE',
      created_at: '2026-01-01T00:00:00.000Z',
      expires_at: '2027-01-01T00:00:00.000Z',
    },
    {
      key_version: 'v2.0-gov-ed25519',
      algorithm: 'Ed25519',
      public_key: 'MCowBQYDK2VwAyEA9xT2yW5nB8kL1vF3jH6mC0qS4zN8Gb8fD6vQk4uM7rP=',
      status: 'ACTIVE',
      created_at: '2025-01-01T00:00:00.000Z',
      expires_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  return {
    users,
    currentUser: users[0], // Default logged-in user: Muhammad Zeeshan Tariq (Applicant)
    organizations,
    requests,
    credentials,
    consents,
    payments,
    pricingRules,
    adapters,
    signingKeys,
    auditLogs,
    securityEvents,
  };
}

class MockDatabaseService {
  private state: SystemDatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('Database listener error:', e);
      }
    });
    try {
      window.dispatchEvent(new CustomEvent('ndvg-db-update'));
    } catch {
      // ignore in environments where window is not defined
    }
  }

  private loadState(): SystemDatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load local database state:', e);
    }
    const initial = getInitialDatabaseState();
    this.saveState(initial);
    return initial;
  }

  private saveState(state: SystemDatabaseState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save local database state:', e);
    }
    this.notifyListeners();
  }

  public getState(): SystemDatabaseState {
    return { ...this.state };
  }

  public resetToDefault(): SystemDatabaseState {
    const initial = getInitialDatabaseState();
    this.state = initial;
    this.saveState(initial);
    return { ...this.state };
  }

  // --- Auth / User Operations ---
  public getCurrentUser(): User | null {
    return this.state.currentUser;
  }

  public logoutUser(): void {
    this.state.currentUser = null;
    this.saveState(this.state);
  }

  public setCurrentUser(user: User | null) {
    this.state.currentUser = user;
    this.saveState(this.state);
  }

  public updateUserProfile(userId: string, updates: Partial<User>): User | null {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return null;
    Object.assign(user, updates);
    if (this.state.currentUser && this.state.currentUser.id === userId) {
      Object.assign(this.state.currentUser, updates);
    }
    this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_PROFILE_UPDATED',
      resourceType: 'USER_ACCOUNT',
      resourceId: user.id,
      result: 'SUCCESS',
      details: `User profile updated for ${user.name}.`,
    });
    this.saveState(this.state);
    return user;
  }

  public addUser(user: User): User {
    this.state.users.push(user);
    this.saveState(this.state);
    return user;
  }

  public addSigningKey(key: SigningKey): void {
    this.state.signingKeys.unshift(key);
    this.saveState(this.state);
  }

  public updateOrganization(orgId: string, updates: Partial<Organization>): Organization | null {
    const org = this.state.organizations.find((o) => o.id === orgId || o.name.toLowerCase() === orgId.toLowerCase());
    if (!org) return null;
    Object.assign(org, updates);
    this.saveState(this.state);
    return org;
  }

  public loginUser(email: string): User | null {
    const found = this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      found.lastLoginAt = new Date().toISOString();
      this.state.currentUser = found;
      this.addAuditLog({
        userId: found.id,
        userName: found.name,
        userRole: found.role,
        action: 'USER_LOGIN',
        resourceType: 'AUTH_SESSION',
        resourceId: found.id,
        result: 'SUCCESS',
        details: `User ${found.name} logged into ${found.role} session.`,
        ipAddress: '192.168.1.100',
      });
      this.saveState(this.state);
      return found;
    }
    return null;
  }

  public registerApplicant(name: string, email: string, nationalId: string, phone: string): User {
    const newUser: User = {
      id: `USR-APP-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      email,
      role: 'APPLICANT',
      status: 'ACTIVE',
      nationalIdNumber: nationalId,
      phone,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    this.state.users.push(newUser);
    this.state.currentUser = newUser;
    this.addAuditLog({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'USER_REGISTRATION',
      resourceType: 'USER_ACCOUNT',
      resourceId: newUser.id,
      result: 'SUCCESS',
      details: `New applicant account registered: ${newUser.name} (${newUser.email}).`,
      ipAddress: '192.168.1.100',
    });
    this.saveState(this.state);
    return newUser;
  }

  // --- Audit Log with SHA-256 Hash Chain ---
  public addAuditLog(event: {
    userId: string;
    userName: string;
    userRole: UserRole;
    action: string;
    resourceType: string;
    resourceId: string;
    result: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'SUSPICIOUS';
    details: string;
    ipAddress?: string;
  }): AuditEvent {
    const logs = this.state.auditLogs;
    const lastHash =
      logs.length > 0
        ? logs[logs.length - 1].currentEventHash
        : 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';

    const newId = `AUD-${String(logs.length + 1).padStart(4, '0')}`;
    const timestamp = new Date().toISOString();
    const ip = event.ipAddress || '192.168.1.100';

    const currentEventHash = CryptoService.computeAuditEventHash({
      id: newId,
      timestamp,
      userId: event.userId,
      userName: event.userName,
      userRole: event.userRole,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      result: event.result,
      details: event.details,
      ipAddress: ip,
      previousEventHash: lastHash,
    });

    const fullEvent: AuditEvent = {
      id: newId,
      timestamp,
      userId: event.userId,
      userName: event.userName,
      userRole: event.userRole,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      result: event.result,
      details: event.details,
      ipAddress: ip,
      previousEventHash: lastHash,
      currentEventHash,
    };

    this.state.auditLogs.push(fullEvent);
    this.saveState(this.state);
    return fullEvent;
  }

  /**
   * Intentionally corrupt an audit log record to demonstrate tamper detection capabilities!
   */
  public simulateAuditTamper(eventIndex: number, fakeDetails: string) {
    if (this.state.auditLogs[eventIndex]) {
      this.state.auditLogs[eventIndex].details = fakeDetails;
      this.saveState(this.state);
    }
  }

  // --- Verification Requests Management ---
  public createVerificationRequest(data: {
    applicant: User;
    documentType: DocumentType;
    documentTypeName: string;
    documentMetadata: VerificationRequest['documentMetadata'];
    purpose: VerificationPurpose;
    purposeName: string;
    namedRecipient: VerificationRequest['namedRecipient'];
    adapterId: string;
  }): VerificationRequest {
    const referenceCode = CryptoService.generateReferenceCode();
    const pricing = this.getPricing(data.documentType, data.purpose);
    const amount = pricing ? pricing.baseFee + pricing.processingFee : 30.0;

    const newReq: VerificationRequest = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      referenceCode,
      applicantId: data.applicant.id,
      applicantName: data.applicant.name,
      applicantEmail: data.applicant.email,
      applicantNationalId: data.applicant.nationalIdNumber || '42101-7894561-3',
      documentType: data.documentType,
      documentTypeName: data.documentTypeName,
      documentMetadata: data.documentMetadata,
      purpose: data.purpose,
      purposeName: data.purposeName,
      namedRecipient: data.namedRecipient,
      state: 'CONSENT_PENDING',
      stateHistory: [
        {
          state: 'DRAFT',
          timestamp: new Date().toISOString(),
          actor: data.applicant.name,
          note: 'Verification request initiated',
        },
        {
          state: 'CONSENT_PENDING',
          timestamp: new Date().toISOString(),
          actor: data.applicant.name,
          note: 'Submitted for citizen consent agreement',
        },
      ],
      consentGiven: false,
      consentVersion: 'v2.0-2026',
      paymentAmount: amount,
      paymentStatus: 'PENDING',
      adapterId: data.adapterId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.requests.unshift(newReq);
    this.addAuditLog({
      userId: data.applicant.id,
      userName: data.applicant.name,
      userRole: data.applicant.role,
      action: 'REQUEST_CREATED',
      resourceType: 'VERIFICATION_REQUEST',
      resourceId: newReq.id,
      result: 'SUCCESS',
      details: `Created verification request ${newReq.referenceCode} for ${data.documentTypeName} to ${data.namedRecipient.organizationName}.`,
    });
    this.saveState(this.state);
    return newReq;
  }

  public updateRequestState(
    requestId: string,
    newState: RequestState,
    note?: string,
    actor?: string
  ): VerificationRequest | null {
    const req = this.state.requests.find((r) => r.id === requestId);
    if (!req) return null;

    req.state = newState;
    req.updatedAt = new Date().toISOString();
    req.stateHistory.push({
      state: newState,
      timestamp: new Date().toISOString(),
      note: note || `State transitioned to ${newState}`,
      actor: actor || this.state.currentUser?.name || 'System',
    });

    this.saveState(this.state);
    return req;
  }

  public grantConsent(requestId: string): ConsentRecord | null {
    const req = this.state.requests.find((r) => r.id === requestId);
    if (!req) return null;

    req.consentGiven = true;
    req.consentTimestamp = new Date().toISOString();
    this.updateRequestState(
      requestId,
      'CONSENT_CONFIRMED',
      'Citizen explicit consent confirmed and logged',
      req.applicantName
    );

    const consentRecord: ConsentRecord = {
      id: `CNS-${Date.now().toString().slice(-4)}`,
      requestId: req.id,
      referenceCode: req.referenceCode,
      applicantId: req.applicantId,
      applicantName: req.applicantName,
      recipient: req.namedRecipient.organizationName,
      purpose: req.purposeName,
      documentType: req.documentTypeName,
      consentVersion: req.consentVersion,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      ipAddress: '192.168.1.100',
    };

    this.state.consents.unshift(consentRecord);
    this.addAuditLog({
      userId: req.applicantId,
      userName: req.applicantName,
      userRole: 'APPLICANT',
      action: 'CONSENT_CONFIRMED',
      resourceType: 'CONSENT_RECORD',
      resourceId: consentRecord.id,
      result: 'SUCCESS',
      details: `Applicant ${req.applicantName} confirmed legal consent for ${req.documentTypeName} shared with ${req.namedRecipient.organizationName}.`,
    });

    this.saveState(this.state);
    return consentRecord;
  }

  public completePayment(
    requestId: string,
    paymentMethod: PaymentRecord['paymentMethod'] = 'GOVT_EPAY'
  ): PaymentRecord | null {
    const req = this.state.requests.find((r) => r.id === requestId);
    if (!req) return null;

    const paymentRecord: PaymentRecord = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      requestId: req.id,
      referenceCode: req.referenceCode,
      applicantId: req.applicantId,
      applicantName: req.applicantName,
      amount: req.paymentAmount,
      currency: 'USD',
      status: 'AUTHORIZED',
      paymentMethod,
      transactionReference: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      receiptUrl: `#receipt-${Date.now()}`,
    };

    req.paymentId = paymentRecord.id;
    req.paymentStatus = 'AUTHORIZED';
    req.paymentTimestamp = paymentRecord.timestamp;
    this.updateRequestState(
      requestId,
      'PAYMENT_CONFIRMED',
      `Payment of $${req.paymentAmount.toFixed(2)} authorized via ${paymentMethod}`,
      'Payment Gateway'
    );

    this.state.payments.unshift(paymentRecord);
    this.addAuditLog({
      userId: req.applicantId,
      userName: req.applicantName,
      userRole: 'APPLICANT',
      action: 'PAYMENT_COMPLETED',
      resourceType: 'PAYMENT_RECORD',
      resourceId: paymentRecord.id,
      result: 'SUCCESS',
      details: `Payment $${req.paymentAmount} confirmed for request ${req.referenceCode}.`,
    });

    this.saveState(this.state);
    return paymentRecord;
  }

  public issueCredential(
    requestId: string,
    result: VerificationResult,
    details: string,
    authorityOffice: string
  ): DigitalCredential | null {
    const req = this.state.requests.find((r) => r.id === requestId);
    if (!req) return null;

    req.verificationResult = result;
    req.verificationDetails = details;
    req.verificationTimestamp = new Date().toISOString();
    this.updateRequestState(
      requestId,
      'VERIFICATION_COMPLETED',
      `Issuing authority returned verification result: ${result}`,
      'Verification Adapter'
    );

    const credentialId = `CRED-${Date.now().toString().slice(-4)}`;
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const keyVersion = 'v2.1-gov-ed25519';

    const payload = {
      credential_id: credentialId,
      reference_code: req.referenceCode,
      document_type: req.documentType,
      applicant_name: req.applicantName,
      recipient: req.namedRecipient.organizationName,
      result,
      issued_at: issuedAt,
      expires_at: expiresAt,
      issuer: authorityOffice || 'Federal Directorate of Police Character Verification Services',
    };

    const payloadHash = CryptoService.computeCredentialPayloadHash(payload);
    const signature = CryptoService.signCredential(payloadHash, keyVersion);

    const credential: DigitalCredential = {
      credential_id: credentialId,
      reference_code: req.referenceCode,
      document_type: req.documentType,
      document_type_name: req.documentTypeName,
      purpose: req.purposeName,
      recipient: req.namedRecipient.organizationName,
      applicant_name: req.applicantName,
      applicant_id_masked: req.applicantNationalId
        ? `${req.applicantNationalId.slice(0, 5)}-*******-${req.applicantNationalId.slice(-1)}`
        : '*****',
      result,
      status: result === 'GENUINE' ? 'VALID' : 'INVALID',
      issued_at: issuedAt,
      expires_at: expiresAt,
      issuer: payload.issuer,
      key_version: keyVersion,
      payload_hash: payloadHash,
      signature,
      signature_algorithm: 'Ed25519-Simulation',
      verification_url: `${window.location.origin}/verify/${req.referenceCode}`,
      access_count: 0,
    };

    req.credentialId = credential.credential_id;
    req.credentialExpiresAt = credential.expires_at;
    this.updateRequestState(
      requestId,
      'CREDENTIAL_ISSUED',
      `Digitally signed credential issued with reference ${req.referenceCode}`,
      'Crypto Engine'
    );

    this.state.credentials.unshift(credential);
    this.addAuditLog({
      userId: this.state.currentUser?.id || 'USR-SYS-01',
      userName: this.state.currentUser?.name || 'System Authority',
      userRole: 'SYSTEM_ADMIN',
      action: 'CREDENTIAL_ISSUED',
      resourceType: 'DIGITAL_CREDENTIAL',
      resourceId: credential.credential_id,
      result: 'SUCCESS',
      details: `Issued credential ${credential.reference_code} for ${credential.applicant_name} (Status: ${credential.status}, Result: ${credential.result}).`,
    });

    this.saveState(this.state);
    return credential;
  }

  public revokeCredential(
    credentialIdentifier: string,
    reason: string,
    adminUserOrName: User | { id?: string; name?: string; role?: UserRole } | string
  ): boolean {
    const cleanId = credentialIdentifier.trim().toUpperCase();
    const cred = this.state.credentials.find(
      (c) =>
        c.credential_id.toUpperCase() === cleanId ||
        c.reference_code.toUpperCase() === cleanId
    );
    if (!cred) return false;

    const adminName =
      typeof adminUserOrName === 'string'
        ? adminUserOrName
        : adminUserOrName.name || 'System Admin';
    const adminId =
      typeof adminUserOrName === 'string'
        ? 'USR-SYS-01'
        : adminUserOrName.id || 'USR-SYS-01';
    const adminRole: UserRole =
      typeof adminUserOrName === 'string'
        ? 'SYSTEM_ADMIN'
        : adminUserOrName.role || 'SYSTEM_ADMIN';

    cred.status = 'REVOKED';
    cred.revocation_reason = reason;
    cred.revoked_at = new Date().toISOString();
    cred.revoked_by = `${adminName} (${adminRole})`;

    // Update associated request if any
    const req = this.state.requests.find((r) => r.referenceCode === cred.reference_code);
    if (req) {
      this.updateRequestState(
        req.id,
        'REVOKED',
        `Credential revoked by admin: ${reason}`,
        adminName
      );
    }

    this.addAuditLog({
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: 'CREDENTIAL_REVOKED',
      resourceType: 'DIGITAL_CREDENTIAL',
      resourceId: cred.credential_id,
      result: 'SUCCESS',
      details: `Revoked credential ${cred.reference_code}. Reason: ${reason}`,
    });

    this.state.securityEvents.unshift({
      id: `SEC-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      eventType: 'CREDENTIAL_REVOKED',
      severity: 'HIGH',
      userId: adminId,
      userName: adminName,
      ipAddress: '10.240.0.1',
      resourceId: cred.credential_id,
      description: `Credential ${cred.reference_code} for ${cred.applicant_name} was revoked by Admin: ${reason}`,
      recommendedAction: 'Notify named recipient and refresh public verification cache.',
      resolved: true,
    });

    this.saveState(this.state);
    return true;
  }

  public recordPublicVerificationAccess(referenceCode: string): DigitalCredential | null {
    const cred = this.state.credentials.find(
      (c) => c.reference_code.toUpperCase() === referenceCode.trim().toUpperCase()
    );
    if (cred) {
      cred.access_count = (cred.access_count || 0) + 1;
      cred.last_verified_at = new Date().toISOString();

      this.addAuditLog({
        userId: 'ANONYMOUS_PUBLIC_USER',
        userName: 'Public Verifier',
        userRole: 'APPLICANT',
        action: 'PUBLIC_VERIFICATION_LOOKUP',
        resourceType: 'DIGITAL_CREDENTIAL',
        resourceId: cred.reference_code,
        result: 'SUCCESS',
        details: `Public verifier looked up reference code ${cred.reference_code}. Status: ${cred.status}, Result: ${cred.result}.`,
        ipAddress: '198.51.100.44',
      });

      this.saveState(this.state);
      return cred;
    }
    return null;
  }

  /**
   * Batch verification lookup for multiple reference codes at once.
   */
  public recordBatchPublicVerificationAccess(rawCodes: string[]): {
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
  } {
    const cleanCodes = Array.from(
      new Set(
        rawCodes
          .map((c) => c.trim().toUpperCase())
          .filter((c) => c.length > 0)
      )
    );

    const results = cleanCodes.map((code) => {
      const cred = this.recordPublicVerificationAccess(code);
      if (cred) {
        const sig = CryptoService.verifyCredentialSignature(cred);
        return {
          code,
          credential: cred,
          signatureVerification: sig,
          status: 'FOUND' as const,
        };
      }
      return {
        code,
        credential: null,
        signatureVerification: null,
        status: 'NOT_FOUND' as const,
      };
    });

    const summary = {
      total: results.length,
      found: results.filter((r) => r.status === 'FOUND').length,
      notFound: results.filter((r) => r.status === 'NOT_FOUND').length,
      valid: results.filter((r) => r.credential?.status === 'VALID').length,
      invalid: results.filter((r) => r.credential?.status === 'INVALID').length,
      expired: results.filter((r) => r.credential?.status === 'EXPIRED').length,
      revoked: results.filter((r) => r.credential?.status === 'REVOKED').length,
    };

    if (results.length > 0) {
      this.addAuditLog({
        userId: 'ANONYMOUS_PUBLIC_USER',
        userName: 'Batch Verifier Agent',
        userRole: 'APPLICANT',
        action: 'BATCH_PUBLIC_VERIFICATION',
        resourceType: 'DIGITAL_CREDENTIAL_BATCH',
        resourceId: `BATCH-${results.length}-DOCS`,
        result: 'SUCCESS',
        details: `Batch verification performed on ${results.length} document codes (${summary.valid} Valid, ${summary.invalid} Not Genuine, ${summary.revoked} Revoked, ${summary.expired} Expired, ${summary.notFound} Not Found).`,
        ipAddress: '198.51.100.44',
      });
    }

    return { results, summary };
  }

  /**
   * Create multiple verification requests in a single bundled application batch.
   */
  public createBatchVerificationRequests(data: {
    applicant: User;
    documents: Array<{
      documentType: DocumentType;
      documentTypeName: string;
      documentMetadata: VerificationRequest['documentMetadata'];
      adapterId: string;
    }>;
    purpose: VerificationPurpose;
    purposeName: string;
    namedRecipient: VerificationRequest['namedRecipient'];
  }): {
    batchId: string;
    requests: VerificationRequest[];
    baseAmount: number;
    discountAmount: number;
    totalAmount: number;
  } {
    const batchId = `BATCH-${Date.now().toString().slice(-6)}`;
    const totalDocs = data.documents.length;
    let baseAmount = 0;

    // Calculate itemized pricing
    const pricedDocs = data.documents.map((doc, idx) => {
      const pricing = this.getPricing(doc.documentType, data.purpose);
      const fee = pricing ? pricing.baseFee + pricing.processingFee : 30.0;
      baseAmount += fee;
      return { ...doc, fee, index: idx + 1 };
    });

    // 20% discount if 2 or more documents bundled in one verification dossier
    const discountRate = totalDocs > 1 ? 0.2 : 0;
    const discountAmount = Math.round(baseAmount * discountRate * 100) / 100;
    const totalAmount = Math.max(0, baseAmount - discountAmount);

    const createdRequests: VerificationRequest[] = [];

    pricedDocs.forEach((doc) => {
      const referenceCode = CryptoService.generateReferenceCode();
      const perDocAmount = totalDocs > 1
        ? Math.round((doc.fee * (1 - discountRate)) * 100) / 100
        : doc.fee;

      const newReq: VerificationRequest = {
        id: `REQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        referenceCode,
        applicantId: data.applicant.id,
        applicantName: data.applicant.name,
        applicantEmail: data.applicant.email,
        applicantNationalId: data.applicant.nationalIdNumber || '35201-7894561-3',
        documentType: doc.documentType,
        documentTypeName: doc.documentTypeName,
        documentMetadata: doc.documentMetadata,
        purpose: data.purpose,
        purposeName: data.purposeName,
        namedRecipient: data.namedRecipient,
        state: 'CONSENT_PENDING',
        stateHistory: [
          {
            state: 'DRAFT',
            timestamp: new Date().toISOString(),
            actor: data.applicant.name,
            note: `Initiated in Multi-Document Batch #${batchId} (${doc.index}/${totalDocs})`,
          },
          {
            state: 'CONSENT_PENDING',
            timestamp: new Date().toISOString(),
            actor: data.applicant.name,
            note: 'Awaiting citizen consent approval for batch dossier',
          },
        ],
        consentGiven: false,
        consentVersion: 'v2.0-2026',
        paymentAmount: perDocAmount,
        paymentStatus: 'PENDING',
        adapterId: doc.adapterId,
        batchId,
        batchIndex: doc.index,
        batchTotal: totalDocs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.state.requests.unshift(newReq);
      createdRequests.push(newReq);
    });

    this.addAuditLog({
      userId: data.applicant.id,
      userName: data.applicant.name,
      userRole: data.applicant.role,
      action: 'BATCH_REQUEST_CREATED',
      resourceType: 'VERIFICATION_BATCH',
      resourceId: batchId,
      result: 'SUCCESS',
      details: `Applicant created Multi-Document Batch #${batchId} with ${totalDocs} document(s) for recipient ${data.namedRecipient.organizationName}. Total Bundle: $${totalAmount.toFixed(2)} (Discount: $${discountAmount.toFixed(2)}).`,
    });

    this.saveState(this.state);

    return {
      batchId,
      requests: createdRequests,
      baseAmount,
      discountAmount,
      totalAmount,
    };
  }

  /**
   * Process all documents in a batch through consent, biometric confirmation, payment, adapter query, and credential issuance.
   */
  public processBatchLifecycle(
    batchId: string,
    paymentMethod: PaymentRecord['paymentMethod'] = 'GOVT_EPAY'
  ): {
    requests: VerificationRequest[];
    credentials: DigitalCredential[];
    payment: PaymentRecord;
  } {
    const batchReqs = this.state.requests.filter((r) => r.batchId === batchId);
    const applicant = this.state.currentUser || (batchReqs.length > 0 ? this.state.users.find(u => u.id === batchReqs[0].applicantId) : null);
    const applicantName = applicant?.name || 'Muhammad Zeeshan Tariq';
    const applicantId = applicant?.id || 'USR-APP-01';

    const totalBatchFee = batchReqs.reduce((sum, r) => sum + r.paymentAmount, 0);

    // 1. Consent for all
    batchReqs.forEach((req) => {
      req.consentGiven = true;
      req.consentTimestamp = new Date().toISOString();
      this.updateRequestState(
        req.id,
        'CONSENT_CONFIRMED',
        `Citizen legal consent confirmed in Batch #${batchId}`,
        applicantName
      );

      const consentRecord: ConsentRecord = {
        id: `CNS-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
        requestId: req.id,
        referenceCode: req.referenceCode,
        applicantId: req.applicantId,
        applicantName: req.applicantName,
        recipient: req.namedRecipient.organizationName,
        purpose: req.purposeName,
        documentType: req.documentTypeName,
        consentVersion: req.consentVersion,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
        ipAddress: '39.40.120.45',
      };
      this.state.consents.unshift(consentRecord);
    });

    // 2. Single Unified Payment Record for the entire batch
    const paymentRecord: PaymentRecord = {
      id: `PAY-BATCH-${Date.now().toString().slice(-4)}`,
      requestId: batchReqs[0]?.id || `REQ-BATCH`,
      referenceCode: batchId,
      applicantId,
      applicantName,
      amount: totalBatchFee,
      currency: 'USD',
      status: 'AUTHORIZED',
      paymentMethod,
      transactionReference: `1LINK-BATCH-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      receiptUrl: `#receipt-batch-${Date.now()}`,
    };
    this.state.payments.unshift(paymentRecord);

    batchReqs.forEach((req) => {
      req.paymentId = paymentRecord.id;
      req.paymentStatus = 'AUTHORIZED';
      req.paymentTimestamp = paymentRecord.timestamp;
      this.updateRequestState(
        req.id,
        'PAYMENT_CONFIRMED',
        `Batch payment of $${totalBatchFee.toFixed(2)} authorized via ${paymentMethod}`,
        'Payment Gateway (1Link / Raast)'
      );
    });

    // 3. Adapter Execution & Credential Issuance for each document
    const issuedCredentials: DigitalCredential[] = [];

    batchReqs.forEach((req) => {
      let issuerName = 'Federal Directorate of Document Attestation';
      let details = 'Clean record confirmed by official government registry.';

      if (req.documentType === 'police_certificate') {
        issuerName = 'Federal Directorate of Police Character Verification Services (ICT / Punjab Police)';
        details = 'Clean criminal record and background clearance confirmed by Police Khidmat Markaz Registry.';
      } else if (req.documentType === 'higher_education_degree') {
        issuerName = 'Higher Education Commission (HEC) Attestation Directorate, Islamabad';
        details = 'Academic degree credentials verified genuine and officially accredited by HEC Directorate.';
      } else if (req.documentType === 'driving_license') {
        issuerName = 'National Highway & Motorway Police (NHMP) Licensing Authority';
        details = 'Commercial & Private Driving license records verified genuine with full demerit clearance.';
      } else if (req.documentType === 'national_id') {
        issuerName = 'National Database and Registration Authority (NADRA)';
        details = 'Citizen biometric registration and demographic identity verified against national repository.';
      } else {
        issuerName = 'National Verification Regulatory Authority';
        details = 'Official compliance certificate verified and endorsed.';
      }

      const cred = this.issueCredential(req.id, 'GENUINE', details, issuerName);
      if (cred) {
        issuedCredentials.push(cred);
      }
    });

    this.addAuditLog({
      userId: applicantId,
      userName: applicantName,
      userRole: 'APPLICANT',
      action: 'BATCH_CREDENTIALS_ISSUED',
      resourceType: 'VERIFICATION_BATCH',
      resourceId: batchId,
      result: 'SUCCESS',
      details: `Batch #${batchId} processed successfully: ${issuedCredentials.length} digitally signed credentials issued.`,
    });

    this.saveState(this.state);

    return {
      requests: batchReqs,
      credentials: issuedCredentials,
      payment: paymentRecord,
    };
  }

  public getPricing(documentType: DocumentType, purpose: VerificationPurpose): PricingRule | undefined {
    return (
      this.state.pricingRules.find(
        (p) => p.documentType === documentType && p.purpose === purpose && p.active
      ) || this.state.pricingRules.find((p) => p.documentType === documentType && p.active)
    );
  }
}

export const dbService = new MockDatabaseService();
