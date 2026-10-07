import { DocumentType, VerificationResult } from '../types';

export interface VerificationAdapterRequest {
  requestId: string;
  applicantName: string;
  applicantNationalId: string;
  documentType: DocumentType;
  metadata: {
    issuingDistrict?: string;
    cnicOrPassport?: string;
    registrationNumber?: string;
    policeStation?: string;
    degreeTitle?: string;
    institution?: string;
    licenseNumber?: string;
  };
  purpose: string;
  forceResult?: VerificationResult;
}

export interface VerificationAdapterResponse {
  success: boolean;
  adapterId: string;
  adapterName: string;
  authorityName: string;
  isSimulated: boolean;
  verificationResult: VerificationResult;
  verificationScore: number;
  officialRecordReference: string;
  issuingAuthorityOffice: string;
  disclaimer: string;
  logTrace: string[];
  executionTimeMs: number;
  errorMessage?: string;
}

export interface IVerificationAdapter {
  adapterId: string;
  name: string;
  authorityName: string;
  documentType: DocumentType;
  isSimulated: boolean;
  verify(request: VerificationAdapterRequest): Promise<VerificationAdapterResponse>;
  testConnection(): Promise<{ success: boolean; latencyMs: number; message: string; details: string }>;
}

/**
 * Police Character Verification Adapter (Tier A MVP with high-fidelity Government Simulator)
 */
export class PoliceVerificationAdapter implements IVerificationAdapter {
  public adapterId = 'police';
  public name = 'Police Character & Criminal Records Clearance Gateway';
  public authorityName = 'Federal Directorate of Police Character Verification Services';
  public documentType: DocumentType = 'police_certificate';
  public isSimulated = true;

  async testConnection() {
    return {
      success: true,
      latencyMs: 142,
      message: 'PCRR Government Node Connected Successfully',
      details: 'TLS 1.3 mutual auth confirmed with Federal Police Directorate.',
    };
  }

  async verify(request: VerificationAdapterRequest): Promise<VerificationAdapterResponse> {
    const startTime = Date.now();
    const trace: string[] = [
      `[${new Date().toISOString()}] Initializing connection to Police Central Record Registry (PCRR)...`,
      `[${new Date().toISOString()}] Validating citizen metadata for: ${request.applicantName} (CNIC: ${request.applicantNationalId})...`,
      `[${new Date().toISOString()}] Inspecting District: ${request.metadata.issuingDistrict || 'Central Metropolitan'} / Station: ${request.metadata.policeStation || 'HQ Unit 4'}...`,
      `[${new Date().toISOString()}] Executing biometric matching & criminal history lookup across national databases...`,
    ];

    // Artificial simulated latency
    await new Promise((resolve) => setTimeout(resolve, 1400));

    // Determine result
    let result: VerificationResult = request.forceResult || 'GENUINE';

    // If no forced result, generate realistic result (majority GENUINE, unless specific flag words)
    if (!request.forceResult) {
      const lower = (request.applicantName + ' ' + (request.metadata.registrationNumber || '')).toLowerCase();
      if (lower.includes('fake') || lower.includes('invalid') || lower.includes('fraud')) {
        result = 'NOT_GENUINE';
      } else if (lower.includes('missing') || lower.includes('unknown') || lower.includes('404')) {
        result = 'NOT_FOUND';
      } else {
        result = 'GENUINE';
      }
    }

    if (result === 'GENUINE') {
      trace.push(`[${new Date().toISOString()}] Official Police Record located. Clearance Status: CLEAN RECORD / NO CONVICTIONS.`);
      trace.push(`[${new Date().toISOString()}] Dispatching cryptographically sealed clearance manifest.`);
    } else if (result === 'NOT_GENUINE') {
      trace.push(`[${new Date().toISOString()}] ALERT: Record tampering or fraudulent certificate registration number detected.`);
      trace.push(`[${new Date().toISOString()}] Issuing authority flag: NOT_GENUINE.`);
    } else {
      trace.push(`[${new Date().toISOString()}] No matching police record found in provincial or national database for given identifiers.`);
      trace.push(`[${new Date().toISOString()}] Issuing authority flag: NOT_FOUND.`);
    }

    const elapsed = Date.now() - startTime;

    return {
      success: true,
      adapterId: this.adapterId,
      adapterName: this.name,
      authorityName: this.authorityName,
      isSimulated: this.isSimulated,
      verificationResult: result,
      verificationScore: result === 'GENUINE' ? 0.99 : result === 'NOT_GENUINE' ? 0.12 : 0.0,
      officialRecordReference: `PCRR-REG-${Math.floor(100000 + Math.random() * 900000)}/2026`,
      issuingAuthorityOffice: `${request.metadata.issuingDistrict || 'Capital Metropolitan'} Police Clearance Bureau`,
      disclaimer: 'SIMULATED GOVERNMENT INTEGRATION: Tier A MVP simulation for National Document Verification Gateway.',
      logTrace: trace,
      executionTimeMs: elapsed,
    };
  }
}

/**
 * NADRA Citizen Identity Adapter (Interface / Simulation)
 */
export class NadraVerificationAdapter implements IVerificationAdapter {
  public adapterId = 'nadra';
  public name = 'National Database & Registration Authority (NADRA) Gateway';
  public authorityName = 'National Database and Registration Authority';
  public documentType: DocumentType = 'national_id';
  public isSimulated = true;

  async testConnection() {
    return {
      success: true,
      latencyMs: 110,
      message: 'NADRA Citizen Identity Vault Connected',
      details: 'Demographic and biometric lookup endpoint active.',
    };
  }

  async verify(request: VerificationAdapterRequest): Promise<VerificationAdapterResponse> {
    const trace = [
      `[${new Date().toISOString()}] Routing verification request to NADRA Citizen Identity Vault...`,
      `[${new Date().toISOString()}] Citizen CNIC / Smart Card Validation: ${request.applicantNationalId}...`,
      `[${new Date().toISOString()}] NADRA Family tree & demographic record verification complete.`,
    ];
    return {
      success: true,
      adapterId: this.adapterId,
      adapterName: this.name,
      authorityName: this.authorityName,
      isSimulated: true,
      verificationResult: request.forceResult || 'GENUINE',
      verificationScore: 0.98,
      officialRecordReference: `NADRA-VER-${Math.floor(100000 + Math.random() * 900000)}`,
      issuingAuthorityOffice: 'NADRA Verification Directorate',
      disclaimer: 'SIMULATED GOVERNMENT INTEGRATION',
      logTrace: trace,
      executionTimeMs: 950,
    };
  }
}

/**
 * Higher Education Commission Degree Attestation Adapter (Interface / Simulation)
 */
export class HecVerificationAdapter implements IVerificationAdapter {
  public adapterId = 'hec';
  public name = 'Higher Education Commission (HEC) Degree Attestation Engine';
  public authorityName = 'Higher Education Commission Accreditation Board';
  public documentType: DocumentType = 'higher_education_degree';
  public isSimulated = true;

  async testConnection() {
    return {
      success: true,
      latencyMs: 185,
      message: 'HEC National Degree Registry Online',
      details: 'Accreditation board and university transcript cluster responding.',
    };
  }

  async verify(request: VerificationAdapterRequest): Promise<VerificationAdapterResponse> {
    const trace = [
      `[${new Date().toISOString()}] Querying National University Degree Registry...`,
      `[${new Date().toISOString()}] Degree Title: ${request.metadata.degreeTitle || 'Bachelor of Science'} at ${request.metadata.institution || 'National University'}...`,
      `[${new Date().toISOString()}] Degree accreditation and credit hours verified.`,
    ];
    return {
      success: true,
      adapterId: this.adapterId,
      adapterName: this.name,
      authorityName: this.authorityName,
      isSimulated: true,
      verificationResult: request.forceResult || 'GENUINE',
      verificationScore: 0.96,
      officialRecordReference: `HEC-EATTEST-${Math.floor(100000 + Math.random() * 900000)}`,
      issuingAuthorityOffice: 'HEC Accreditation & Attestation Wing',
      disclaimer: 'SIMULATED GOVERNMENT INTEGRATION',
      logTrace: trace,
      executionTimeMs: 1100,
    };
  }
}

/**
 * Driving License Clearance Adapter
 */
export class DrivingLicenseAdapter implements IVerificationAdapter {
  public adapterId = 'driving_license';
  public name = 'National Highway & Traffic Licensing Authority';
  public authorityName = 'Federal Traffic Licensing Directorate';
  public documentType: DocumentType = 'driving_license';
  public isSimulated = true;

  async testConnection() {
    return {
      success: true,
      latencyMs: 95,
      message: 'National Driver Registry Gateway Active',
      details: 'Traffic safety and demerit points database responding.',
    };
  }

  async verify(request: VerificationAdapterRequest): Promise<VerificationAdapterResponse> {
    const trace = [
      `[${new Date().toISOString()}] Querying National Driver Registry database...`,
      `[${new Date().toISOString()}] Validating License No: ${request.metadata.licenseNumber || 'DL-99412-K'}...`,
      `[${new Date().toISOString()}] Endorsement endorsements and demerit points check complete.`,
    ];
    return {
      success: true,
      adapterId: this.adapterId,
      adapterName: this.name,
      authorityName: this.authorityName,
      isSimulated: true,
      verificationResult: request.forceResult || 'GENUINE',
      verificationScore: 0.97,
      officialRecordReference: `DL-CLEAR-${Math.floor(100000 + Math.random() * 900000)}`,
      issuingAuthorityOffice: 'National Driver Registry Branch',
      disclaimer: 'SIMULATED GOVERNMENT INTEGRATION',
      logTrace: trace,
      executionTimeMs: 900,
    };
  }
}

/**
 * Professional Recruiter Registry Adapter
 */
export class RecruiterRegistryAdapter implements IVerificationAdapter {
  public adapterId = 'recruiter';
  public name = 'National Professional & Overseas Employment Bureau';
  public authorityName = 'Bureau of Emigration & Overseas Employment';
  public documentType: DocumentType = 'professional_clearance';
  public isSimulated = true;

  async testConnection() {
    return {
      success: true,
      latencyMs: 130,
      message: 'BEOE Overseas Bureau Connected',
      details: 'Foreign employment clearance register sync nominal.',
    };
  }

  async verify(request: VerificationAdapterRequest): Promise<VerificationAdapterResponse> {
    const trace = [
      `[${new Date().toISOString()}] Validating Overseas Employment & Skill Certification Registry...`,
      `[${new Date().toISOString()}] Recruiter candidate profile confirmed.`,
    ];
    return {
      success: true,
      adapterId: this.adapterId,
      adapterName: this.name,
      authorityName: this.authorityName,
      isSimulated: true,
      verificationResult: request.forceResult || 'GENUINE',
      verificationScore: 0.95,
      officialRecordReference: `BEOE-REC-${Math.floor(100000 + Math.random() * 900000)}`,
      issuingAuthorityOffice: 'Bureau of Emigration & Overseas Employment',
      disclaimer: 'SIMULATED GOVERNMENT INTEGRATION',
      logTrace: trace,
      executionTimeMs: 850,
    };
  }
}

export const AdapterRegistry = {
  getAdapter(docType: DocumentType): IVerificationAdapter {
    switch (docType) {
      case 'police_certificate':
        return new PoliceVerificationAdapter();
      case 'national_id':
        return new NadraVerificationAdapter();
      case 'higher_education_degree':
        return new HecVerificationAdapter();
      case 'driving_license':
        return new DrivingLicenseAdapter();
      case 'professional_clearance':
        return new RecruiterRegistryAdapter();
      default:
        return new PoliceVerificationAdapter();
    }
  },
  getAllAdapters(): IVerificationAdapter[] {
    return [
      new PoliceVerificationAdapter(),
      new NadraVerificationAdapter(),
      new HecVerificationAdapter(),
      new DrivingLicenseAdapter(),
      new RecruiterRegistryAdapter(),
    ];
  },
};
