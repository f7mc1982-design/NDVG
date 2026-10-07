import React, { useState, useEffect, useRef } from 'react';
import { BiometricStatus } from '../../types';
import { MockBiometricProvider, BiometricVerificationResponse } from '../../services/biometricService';
import { ShieldCheck, Camera, ScanFace, CheckCircle2, AlertTriangle, RefreshCw, X } from 'lucide-react';

interface BiometricScannerModalProps {
  isOpen: boolean;
  applicantName: string;
  nationalId: string;
  onComplete: (result: BiometricVerificationResponse) => void;
  onCancel: () => void;
}

export const BiometricScannerModal: React.FC<BiometricScannerModalProps> = ({
  isOpen,
  applicantName,
  nationalId,
  onComplete,
  onCancel,
}) => {
  const [scanning, setScanning] = useState(false);
  const [statusText, setStatusText] = useState('Position face inside biometric frame');
  const [progress, setProgress] = useState(0);
  const [outcomeOverride, setOutcomeOverride] = useState<BiometricStatus>('SUCCESS');
  const [result, setResult] = useState<BiometricVerificationResponse | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScanning(false);
      setProgress(0);
      setResult(null);
      setStatusText('Ready for optical biometric facial liveness challenge');
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      }
    } catch {
      // Fall back gracefully to high-tech simulated sensor canvas
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleStartScan = async () => {
    setScanning(true);
    setResult(null);
    setProgress(5);
    setStatusText('Optical sensor locking on facial biometric coordinates...');

    try {
      const response = await MockBiometricProvider.verify(
        {
          applicantId: 'USR-APP',
          applicantName,
          nationalIdNumber: nationalId,
          forceOutcome: outcomeOverride,
        },
        (step, pct) => {
          setStatusText(step);
          setProgress(pct);
        }
      );

      setScanning(false);
      setResult(response);

      if (response.status === 'SUCCESS') {
        setTimeout(() => {
          onComplete(response);
        }, 1200);
      }
    } catch (e) {
      console.error(e);
      setScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl shadow-indigo-950/60 flex flex-col">
        {/* Terminal Header */}
        <div className="bg-white/5 backdrop-blur-xl px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/20 backdrop-blur-md">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Trusted Biometric Identity Verification
              </h3>
              <p className="text-[11px] text-slate-300 font-mono">
                Tier A MVP • Simulated TEE Hardware Sensor
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sensor Viewport */}
        <div className="p-7 flex flex-col items-center">
          <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white/20 bg-black/40 flex items-center justify-center shadow-2xl shadow-indigo-950/50 group backdrop-blur-xl">
            {/* Live Video or Simulated Sensor */}
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-indigo-950/40 via-slate-950/60 to-purple-950/40 flex flex-col items-center justify-center relative backdrop-blur-md">
                {/* Simulated Face Silhouette */}
                <div className="w-32 h-44 border-2 border-dashed border-indigo-400/40 rounded-[60px] flex items-center justify-center">
                  <ScanFace className="w-20 h-20 text-indigo-300/50 animate-pulse" />
                </div>
                <span className="absolute bottom-4 text-[10px] font-mono text-indigo-300/80">
                  {cameraActive ? 'OPTICAL CAM ACTIVE' : 'SIMULATED SENSOR ACTIVE'}
                </span>
              </div>
            )}

            {/* Scanning HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Reticle grid */}
              <div
                className={`w-52 h-52 rounded-full border-2 transition-all duration-300 ${
                  result?.status === 'SUCCESS'
                    ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)]'
                    : result?.status && result.status !== 'SUCCESS'
                    ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]'
                    : scanning
                    ? 'border-indigo-400/80 animate-pulse shadow-[0_0_20px_rgba(129,140,248,0.3)]'
                    : 'border-white/20'
                }`}
              />

              {/* Laser scanning bar */}
              {scanning && (
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-[bounce_2s_infinite] shadow-[0_0_15px_#818cf8]" />
              )}
            </div>
          </div>

          {/* Citizen Details Preview */}
          <div className="mt-4 text-center">
            <h4 className="text-sm font-semibold text-white">{applicantName}</h4>
            <p className="text-xs font-mono text-slate-300">CNIC / ID: {nationalId}</p>
          </div>

          {/* Status Indicator */}
          <div className="w-full mt-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Challenge Status:
              </span>
              <span className="font-mono text-xs font-semibold text-indigo-300">
                {scanning ? `${progress}%` : result?.status || 'READY'}
              </span>
            </div>

            {/* Progress bar */}
            {scanning && (
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <p className="text-xs text-slate-200 font-mono text-center">{statusText}</p>

            {/* Result Message */}
            {result && (
              <div
                className={`p-3 rounded-2xl text-xs font-mono flex items-start gap-2 backdrop-blur-md ${
                  result.status === 'SUCCESS'
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                    : 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                }`}
              >
                {result.status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{result.message}</p>
                  {result.status === 'SUCCESS' && (
                    <p className="text-[11px] text-emerald-300 mt-0.5">
                      Liveness Score: {(result.livenessConfidenceScore * 100).toFixed(1)}% • Zero Raw Data
                      Retained
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Test Outcome Switcher for Sandbox QA */}
          <div className="w-full mt-3 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between text-xs backdrop-blur-md">
            <span className="text-slate-300 font-mono text-[11px]">QA Simulation Outcome:</span>
            <select
              value={outcomeOverride}
              onChange={(e) => setOutcomeOverride(e.target.value as BiometricStatus)}
              className="bg-white/10 border border-white/15 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-400 font-mono cursor-pointer"
            >
              <option value="SUCCESS" className="bg-slate-900 text-white">SUCCESS (99.4% Liveness)</option>
              <option value="LIVENESS_FAILED" className="bg-slate-900 text-white">LIVENESS_FAILED (Anti-Spoof)</option>
              <option value="FAILED" className="bg-slate-900 text-white">FAILED (Template Mismatch)</option>
              <option value="TIMEOUT" className="bg-slate-900 text-white">TIMEOUT (Sensor Timeout)</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white/5 backdrop-blur-xl px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Never stores or logs raw biometrics (Section 4.9)</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onCancel}
              className="px-3.5 py-2 text-xs text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-trigger-biometric-scan"
              disabled={scanning}
              onClick={handleStartScan}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-2xl shadow-lg border border-white/15 transition-all cursor-pointer ${
                scanning
                  ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 border-indigo-400/30'
              }`}
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Scanning Face...
                </>
              ) : result?.status === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  Confirmed
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  {result ? 'Retry Scan' : 'Capture & Verify'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
