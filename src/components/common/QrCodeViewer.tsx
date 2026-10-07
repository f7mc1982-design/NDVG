import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';

interface QrCodeViewerProps {
  value: string;
  referenceCode: string;
  size?: number;
  showActions?: boolean;
}

export const QrCodeViewer: React.FC<QrCodeViewerProps> = ({
  value,
  referenceCode,
  size = 200,
  showActions = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [value, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `NDVG-QR-${referenceCode}.png`;
      a.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-5 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-2xl">
      <div className="p-3 bg-white/95 rounded-2xl shadow-inner border border-white/40">
        <canvas ref={canvasRef} />
      </div>
      <div className="text-center">
        <span className="font-mono text-xs font-semibold tracking-wider text-indigo-300 bg-white/10 border border-white/15 px-3 py-1 rounded-full backdrop-blur-md">
          {referenceCode}
        </span>
        <p className="text-[11px] text-slate-300 mt-1 max-w-[220px] truncate">
          Scan to verify on public portal
        </p>
      </div>

      {showActions && (
        <div className="flex items-center gap-2 mt-1">
          <button
            id={`btn-copy-url-${referenceCode}`}
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl backdrop-blur-md transition-all cursor-pointer"
            title="Copy Public Verification URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy URL'}
          </button>
          <button
            id={`btn-download-qr-${referenceCode}`}
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl backdrop-blur-md transition-all cursor-pointer"
            title="Download QR Image"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      )}
    </div>
  );
};
