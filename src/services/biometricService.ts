import { BiometricStatus } from '../types';

export interface BiometricVerificationRequest {
  applicantId: string;
  applicantName: string;
  nationalIdNumber: string;
  forceOutcome?: BiometricStatus;
  mode?: 'FACIAL_LIVENESS' | 'FINGERPRINT_SCAN';
}

export interface BiometricVerificationResponse {
  status: BiometricStatus;
  livenessConfidenceScore: number;
  facialMatchScore: number;
  timestamp: string;
  hardwareDevice: string;
  antiSpoofingCheck: 'PASSED' | 'FAILED';
  verificationToken: string;
  message: string;
  // Raw biometric data is NEVER logged or retained per Tier A security specs.
}

export class MockBiometricProvider {
  static async verify(
    request: BiometricVerificationRequest,
    onProgress?: (step: string, progressPct: number) => void
  ): Promise<BiometricVerificationResponse> {
    const steps = [
      { text: 'Activating secure optical sensor & camera frame...', pct: 20 },
      { text: 'Analyzing 3D facial depth mapping & pupil liveness...', pct: 45 },
      { text: 'Checking micro-expression blinking and anti-spoofing vectors...', pct: 75 },
      { text: 'Matching extracted cryptographic template with National ID Registry...', pct: 95 },
    ];

    for (const step of steps) {
      if (onProgress) onProgress(step.text, step.pct);
      await new Promise((r) => setTimeout(r, 450));
    }

    const outcome = request.forceOutcome || 'SUCCESS';

    if (outcome === 'SUCCESS') {
      if (onProgress) onProgress('Biometric identity confirmed with 99.4% confidence', 100);
      return {
        status: 'SUCCESS',
        livenessConfidenceScore: 0.994,
        facialMatchScore: 0.988,
        timestamp: new Date().toISOString(),
        hardwareDevice: 'Simulated Trusted Execution Environment (TEE) Biometric Sensor v3',
        antiSpoofingCheck: 'PASSED',
        verificationToken: `BIO-TOK-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        message: 'Citizen identity verified successfully via live biometric challenge.',
      };
    } else if (outcome === 'LIVENESS_FAILED') {
      return {
        status: 'LIVENESS_FAILED',
        livenessConfidenceScore: 0.21,
        facialMatchScore: 0.0,
        timestamp: new Date().toISOString(),
        hardwareDevice: 'Simulated TEE Sensor',
        antiSpoofingCheck: 'FAILED',
        verificationToken: '',
        message: 'Liveness test failed. System detected a static photo or digital screen replay.',
      };
    } else if (outcome === 'TIMEOUT') {
      return {
        status: 'TIMEOUT',
        livenessConfidenceScore: 0.0,
        facialMatchScore: 0.0,
        timestamp: new Date().toISOString(),
        hardwareDevice: 'Simulated TEE Sensor',
        antiSpoofingCheck: 'FAILED',
        verificationToken: '',
        message: 'Biometric capture session timed out. No face detected in sensor frame within 30s.',
      };
    } else {
      return {
        status: 'FAILED',
        livenessConfidenceScore: 0.45,
        facialMatchScore: 0.38,
        timestamp: new Date().toISOString(),
        hardwareDevice: 'Simulated TEE Sensor',
        antiSpoofingCheck: 'FAILED',
        verificationToken: '',
        message: 'Biometric match rejected. Extracted template does not match registered citizen record.',
      };
    }
  }
}
