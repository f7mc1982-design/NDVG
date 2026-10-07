import React, { useRef } from 'react';
import { DigitalCredential } from '../../types';
import { QrCodeViewer } from '../common/QrCodeViewer';
import { CredentialStatusBadge } from '../common/CredentialStatusBadge';
import { ShieldCheck, Printer, Download, X, Award, CheckCircle, FileCheck, Lock, ExternalLink } from 'lucide-react';

interface SignedCertificateModalProps {
  credential: DigitalCredential;
  isOpen: boolean;
  onClose: () => void;
}

export const SignedCertificateModal: React.FC<SignedCertificateModalProps> = ({
  credential,
  isOpen,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const certText = `
================================================================================
          GOVERNMENT OF THE NATIONAL REPUBLIC
      NATIONAL DIGITAL DOCUMENT VERIFICATION GATEWAY
             DIGITALLY SIGNED ATTESTATION CERTIFICATE
================================================================================

CREDENTIAL ID:         ${credential.credential_id}
REFERENCE CODE:        ${credential.reference_code}
DOCUMENT TYPE:         ${credential.document_type_name}
VERIFICATION RESULT:   ${credential.result}
CREDENTIAL STATUS:     ${credential.status}

APPLICANT NAME:        ${credential.applicant_name}
CITIZEN IDENTIFIER:    ${credential.applicant_id_masked}
NAMED RECIPIENT:       ${credential.recipient}
VERIFICATION PURPOSE:  ${credential.purpose}

ISSUING AUTHORITY:     ${credential.issuer}
DATE OF ISSUANCE:      ${new Date(credential.issued_at).toUTCString()}
EXPIRY DATE:           ${new Date(credential.expires_at).toUTCString()}

--------------------------------------------------------------------------------
CRYPTOGRAPHIC AUTHENTICATION SEAL:
--------------------------------------------------------------------------------
SIGNATURE ALGORITHM:   ${credential.signature_algorithm}
KEY VERSION:           ${credential.key_version}
PAYLOAD SHA-256 HASH:  ${credential.payload_hash}
ED25519 SIGNATURE:     ${credential.signature}

PUBLIC VERIFICATION:   ${credential.verification_url}

LEGAL NOTICE:
This digital credential has been verified against official national databases
via the National Document Verification Gateway. Any alteration of this document
invalidates the cryptographic signature. Verify authenticity at the URL above.
================================================================================
    `.trim();

    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDVG-CERTIFICATE-${credential.reference_code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isGenuine = credential.result === 'GENUINE';
  const isValid = credential.status === 'VALID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-[32px] max-w-3xl w-full my-8 shadow-2xl shadow-indigo-950/60 flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:m-0 print:rounded-none">
        {/* Top Control Bar - Hidden on print */}
        <div className="bg-white/5 backdrop-blur-xl px-7 py-4 border-b border-white/10 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-white">
              Official Signed Certificate • {credential.reference_code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl backdrop-blur-md transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Certificate
            </button>
            <button
              onClick={handleDownloadText}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl backdrop-blur-md transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Record
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Sheet */}
        <div
          ref={printRef}
          className="p-8 bg-slate-900/60 text-slate-100 print:bg-white print:text-black flex flex-col gap-6 relative"
        >
          {/* Security Guilloche Border simulation */}
          <div className="border-4 border-double border-indigo-400/30 rounded-2xl p-8 relative bg-gradient-to-b from-white/[0.03] to-white/[0.01] print:bg-none print:border-emerald-800 backdrop-blur-md">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] print:opacity-[0.06] pointer-events-none">
              <Award className="w-96 h-96 text-indigo-400" />
            </div>

            {/* Header / National Emblem */}
            <div className="flex flex-col items-center text-center pb-6 border-b-2 border-indigo-400/20">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border-2 border-indigo-400/40 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20 print:bg-emerald-100 print:border-emerald-700 backdrop-blur-md">
                <Award className="w-9 h-9 text-indigo-300 print:text-emerald-800" />
              </div>
              <p className="text-[11px] font-mono tracking-widest text-indigo-300 print:text-emerald-800 uppercase font-semibold">
                Government of the Republic • Central Digital Verification System
              </p>
              <h2 className="text-2xl font-serif font-bold text-white print:text-black mt-1">
                National Document Verification Gateway
              </h2>
              <p className="text-sm text-slate-300 print:text-slate-700 font-medium">
                Official Digitally Signed Attestation Certificate
              </p>
            </div>

            {/* Result Banner */}
            <div className="my-6 p-5 rounded-2xl flex items-center justify-between border bg-white/5 print:bg-slate-100 border-white/10 print:border-slate-300 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md ${
                    isGenuine && isValid
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                      : 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                  }`}
                >
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-mono">VERIFICATION RESULT:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold tracking-wide ${
                        isGenuine ? 'text-emerald-300 print:text-emerald-700' : 'text-rose-300'
                      }`}
                    >
                      {credential.result}
                    </span>
                    <CredentialStatusBadge status={credential.status} size="sm" showDot />
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono">REFERENCE CODE:</span>
                <p className="text-lg font-mono font-bold text-indigo-300 print:text-emerald-800 tracking-wider">
                  {credential.reference_code}
                </p>
              </div>
            </div>

            {/* Credential Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3.5 bg-white/[0.03] print:bg-transparent p-5 rounded-2xl border border-white/10 print:border-slate-300 backdrop-blur-md">
                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">DOCUMENT TYPE</span>
                  <span className="text-sm font-semibold text-white print:text-slate-900">
                    {credential.document_type_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">APPLICANT NAME</span>
                  <span className="text-sm font-semibold text-white print:text-slate-900">
                    {credential.applicant_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">CITIZEN IDENTIFIER (MASKED)</span>
                  <span className="text-xs font-mono text-slate-300 print:text-slate-800">
                    {credential.applicant_id_masked}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">VERIFICATION PURPOSE</span>
                  <span className="text-xs font-medium text-slate-200 print:text-slate-800">
                    {credential.purpose}
                  </span>
                </div>
              </div>

              <div className="space-y-3.5 bg-white/[0.03] print:bg-transparent p-5 rounded-2xl border border-white/10 print:border-slate-300 backdrop-blur-md">
                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">NAMED RECIPIENT</span>
                  <span className="text-sm font-semibold text-white print:text-slate-900">
                    {credential.recipient}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">ISSUING AUTHORITY</span>
                  <span className="text-xs font-medium text-slate-200 print:text-slate-800">
                    {credential.issuer}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 font-mono block text-[11px]">ISSUE DATE</span>
                    <span className="text-xs font-mono text-slate-200 print:text-slate-800">
                      {new Date(credential.issued_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono block text-[11px]">EXPIRY DATE</span>
                    <span className="text-xs font-mono text-slate-200 print:text-slate-800">
                      {new Date(credential.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block text-[11px]">CREDENTIAL ID</span>
                  <span className="text-xs font-mono text-slate-300 print:text-slate-800">
                    {credential.credential_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Cryptographic Seal & QR Verification Section */}
            <div className="mt-6 pt-5 border-t border-white/10 print:border-slate-300 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Security info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 print:text-emerald-800">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="font-semibold">CRYPTOGRAPHIC INTEGRITY ATTESTATION</span>
                </div>
                <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 font-mono text-[10px] space-y-1 text-slate-300 print:bg-slate-100 print:text-slate-800 print:border-slate-300 backdrop-blur-md">
                  <div>Algorithm: {credential.signature_algorithm} (Key: {credential.key_version})</div>
                  <div className="truncate">Payload Digest: {credential.payload_hash}</div>
                  <div className="truncate">Signature: {credential.signature}</div>
                </div>
                <p className="text-[10px] text-slate-400 print:text-slate-600">
                  Verified in accordance with the National Digital Document Verification Act. Any
                  unauthorized modification renders this certificate null and void.
                </p>
              </div>

              {/* QR Code */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <QrCodeViewer
                  value={credential.verification_url}
                  referenceCode={credential.reference_code}
                  size={120}
                  showActions={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
