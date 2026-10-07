export type UserRole = 'APPLICANT' | 'INSTITUTION_USER' | 'INSTITUTION_ADMIN' | 'SYSTEM_ADMIN';

export type RequestState =
  | 'DRAFT'
  | 'CONSENT_PENDING'
  | 'CONSENT_CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'VERIFICATION_PENDING'
  | 'VERIFICATION_IN_PROGRESS'
  | 'VERIFICATION_COMPLETED'
  | 'CREDENTIAL_ISSUED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'FAILED'
  | 'CANCELLED';

export type VerificationResult = 'GENUINE' | 'NOT_GENUINE' | 'NOT_FOUND';

export type CredentialStatus = 'VALID' | 'INVALID' | 'EXPIRED' | 'REVOKED';

export type DocumentType =
  | 'police_certificate'
  | 'national_id'
  | 'higher_education_degree'
  | 'driving_license'
  | 'professional_clearance';

export type VerificationPurpose =
  | 'employment_abroad'
  | 'visa_immigration'
  | 'higher_education'
  | 'professional_licensing'
  | 'court_legal_proceedings'
  | 'government_tender';

export type BiometricStatus = 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'LIVENESS_FAILED';

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type AdapterStatus = 'ACTIVE' | 'INACTIVE' | 'SIMULATED';

export type AuditIntegrityStatus =
  | 'VALID'
  | 'BROKEN_CHAIN'
  | 'MODIFIED_EVENT'
  | 'DELETED_EVENT'
  | 'REORDERED_EVENT';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  department?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  nationalIdNumber?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  type: 'GOVERNMENT_AUTHORITY' | 'EMPLOYER' | 'EMBASSY' | 'UNIVERSITY' | 'FINANCIAL_INSTITUTION';
  verified: boolean;
  contactEmail: string;
  contactPhone: string;
  address: string;
  webhookUrl?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  referenceCode: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantNationalId: string;
  documentType: DocumentType;
  documentTypeName: string;
  documentMetadata: {
    issuingDistrict?: string;
    cnicOrPassport?: string;
    registrationNumber?: string;
    policeStation?: string;
    degreeTitle?: string;
    institution?: string;
    licenseNumber?: string;
  };
  purpose: VerificationPurpose;
  purposeName: string;
  namedRecipient: {
    organizationName: string;
    contactPerson?: string;
    contactEmail?: string;
    referenceNote?: string;
    organizationId?: string;
  };
  state: RequestState;
  stateHistory: {
    state: RequestState;
    timestamp: string;
    note?: string;
    actor?: string;
  }[];
  consentGiven: boolean;
  consentTimestamp?: string;
  consentVersion: string;
  biometricResult?: BiometricStatus;
  biometricTimestamp?: string;
  paymentId?: string;
  paymentAmount: number;
  paymentStatus: PaymentStatus;
  paymentTimestamp?: string;
  adapterId: string;
  verificationResult?: VerificationResult;
  verificationDetails?: string;
  verificationTimestamp?: string;
  credentialId?: string;
  credentialExpiresAt?: string;
  failureReason?: string;
  batchId?: string;
  batchIndex?: number;
  batchTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BatchApplicationDocument {
  tempId: string;
  documentType: DocumentType;
  documentTypeName: string;
  documentMetadata: VerificationRequest['documentMetadata'];
  adapterId: string;
}

export interface BatchVerificationLookupResult {
  code: string;
  credential: DigitalCredential | null;
  signatureVerification: {
    isValid: boolean;
    reason?: string;
    calculatedHash: string;
  } | null;
  status: 'FOUND' | 'NOT_FOUND';
  error?: string;
}

export interface DigitalCredential {
  credential_id: string;
  reference_code: string;
  document_type: DocumentType;
  document_type_name: string;
  purpose: string;
  recipient: string;
  applicant_name: string;
  applicant_id_masked: string;
  result: VerificationResult;
  status: CredentialStatus;
  issued_at: string;
  expires_at: string;
  issuer: string;
  key_version: string;
  signature: string;
  signature_algorithm: 'Ed25519-Simulation' | 'RSA-4096-PSS';
  verification_url: string;
  payload_hash: string;
  revocation_reason?: string;
  revoked_at?: string;
  revoked_by?: string;
  access_count: number;
  last_verified_at?: string;
}

export interface ConsentRecord {
  id: string;
  requestId: string;
  referenceCode: string;
  applicantId: string;
  applicantName: string;
  recipient: string;
  purpose: string;
  documentType: string;
  consentVersion: string;
  timestamp: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  ipAddress: string;
}

export interface PaymentRecord {
  id: string;
  requestId: string;
  referenceCode: string;
  applicantId: string;
  applicantName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: 'CREDIT_CARD' | 'GOVT_EPAY' | 'DIRECT_DEBIT' | '1LINK_GATEWAY';
  transactionReference: string;
  timestamp: string;
  receiptUrl?: string;
  refundedAmount?: number;
  refundedAt?: string;
}

export interface PricingRule {
  id: string;
  documentType: DocumentType;
  documentTypeName: string;
  purpose: VerificationPurpose;
  purposeName: string;
  baseFee: number;
  processingFee: number;
  expeditedFee: number;
  active: boolean;
  currency: string;
  lastModified: string;
}

export interface AdapterConfig {
  id: string;
  name: string;
  documentType: DocumentType;
  authorityName: string;
  status: AdapterStatus;
  endpointUrl: string;
  simulatedLatencyMs: number;
  forceMockOutcome?: VerificationResult;
  description: string;
  healthScore: number;
  totalCalls: number;
  successfulCalls: number;
  lastPing: string;
}

export interface AuditEvent {
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
  previousEventHash: string;
  currentEventHash: string;
}

export type AuditLogEntry = AuditEvent;

export interface SigningKey {
  key_version: string;
  algorithm: 'Ed25519' | 'RSA-4096-PSS';
  public_key: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  created_at: string;
  expires_at: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType:
    | 'FAILED_LOGIN'
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'RATE_LIMIT_EXCEEDED'
    | 'TAMPER_DETECTED'
    | 'SIGNATURE_MISMATCH'
    | 'SUSPICIOUS_IP_ACTIVITY'
    | 'CREDENTIAL_REVOKED';
  severity: SecuritySeverity;
  userId?: string;
  userName?: string;
  ipAddress: string;
  resourceId?: string;
  description: string;
  recommendedAction: string;
  resolved: boolean;
}
