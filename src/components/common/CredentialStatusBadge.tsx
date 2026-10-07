import React from 'react';
import { CredentialStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

export interface CredentialStatusBadgeProps {
  status: CredentialStatus | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDot?: boolean;
  showPulse?: boolean;
  prefix?: string;
  className?: string;
  id?: string;
}

export const CredentialStatusBadge: React.FC<CredentialStatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
  showDot = false,
  showPulse,
  prefix,
  className = '',
  id,
}) => {
  const statusStr = String(status || '').toUpperCase().trim();

  // Configuration for each status
  let config = {
    label: statusStr || 'UNKNOWN',
    icon: AlertTriangle,
    glassClass: 'bg-slate-500/20 text-slate-300 border-slate-400/30 shadow-[0_2px_10px_0_rgba(148,163,184,0.15)]',
    dotClass: 'bg-slate-400',
    pulse: false,
    glowColor: 'rgba(148, 163, 184, 0.4)',
  };

  switch (statusStr) {
    case 'VALID':
      config = {
        label: 'VALID',
        icon: CheckCircle2,
        glassClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_2px_12px_0_rgba(16,185,129,0.25)] hover:bg-emerald-500/25',
        dotClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
        pulse: showPulse ?? true,
        glowColor: 'rgba(52, 211, 153, 0.5)',
      };
      break;

    case 'EXPIRED':
      config = {
        label: 'EXPIRED',
        icon: Clock,
        glassClass: 'bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_2px_12px_0_rgba(245,158,11,0.22)] hover:bg-amber-500/25',
        dotClass: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
        pulse: showPulse ?? false,
        glowColor: 'rgba(251, 191, 36, 0.5)',
      };
      break;

    case 'REVOKED':
      config = {
        label: 'REVOKED',
        icon: AlertTriangle,
        glassClass: 'bg-rose-500/20 text-rose-300 border-rose-400/45 shadow-[0_2px_12px_0_rgba(244,63,94,0.25)] hover:bg-rose-500/30',
        dotClass: 'bg-rose-400 shadow-[0_0_8px_#fb7185]',
        pulse: showPulse ?? true,
        glowColor: 'rgba(251, 113, 133, 0.5)',
      };
      break;

    case 'INVALID':
      config = {
        label: 'INVALID',
        icon: XCircle,
        glassClass: 'bg-rose-500/20 text-rose-300 border-rose-400/45 shadow-[0_2px_12px_0_rgba(244,63,94,0.25)] hover:bg-rose-500/30',
        dotClass: 'bg-rose-400 shadow-[0_0_8px_#fb7185]',
        pulse: showPulse ?? true,
        glowColor: 'rgba(251, 113, 133, 0.5)',
      };
      break;

    default:
      // Fallback for custom or unmapped states
      if (statusStr.includes('REVOK')) {
        config = {
          label: statusStr,
          icon: AlertTriangle,
          glassClass: 'bg-rose-500/20 text-rose-300 border-rose-400/45 shadow-[0_2px_12px_0_rgba(244,63,94,0.25)]',
          dotClass: 'bg-rose-400',
          pulse: true,
          glowColor: 'rgba(251, 113, 133, 0.5)',
        };
      } else if (statusStr.includes('EXPIR')) {
        config = {
          label: statusStr,
          icon: Clock,
          glassClass: 'bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_2px_12px_0_rgba(245,158,11,0.22)]',
          dotClass: 'bg-amber-400',
          pulse: false,
          glowColor: 'rgba(251, 191, 36, 0.5)',
        };
      } else if (statusStr.includes('GENUINE') || statusStr.includes('VALID') || statusStr.includes('ISSUED')) {
        config = {
          label: statusStr,
          icon: CheckCircle2,
          glassClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_2px_12px_0_rgba(16,185,129,0.25)]',
          dotClass: 'bg-emerald-400',
          pulse: false,
          glowColor: 'rgba(52, 211, 153, 0.5)',
        };
      } else {
        config = {
          label: statusStr || 'INVALID',
          icon: XCircle,
          glassClass: 'bg-rose-500/20 text-rose-300 border-rose-400/45 shadow-[0_2px_12px_0_rgba(244,63,94,0.25)]',
          dotClass: 'bg-rose-400',
          pulse: false,
          glowColor: 'rgba(251, 113, 133, 0.5)',
        };
      }
      break;
  }

  // Size styles
  const sizeStyles = {
    xs: {
      container: 'px-2 py-0.5 text-[10px] gap-1 border',
      icon: 'w-2.5 h-2.5',
      dot: 'w-1 h-1',
    },
    sm: {
      container: 'px-2.5 py-0.5 text-[11px] gap-1.5 border',
      icon: 'w-3.5 h-3.5',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      container: 'px-3 py-1 text-xs gap-1.5 border',
      icon: 'w-4 h-4',
      dot: 'w-2 h-2',
    },
    lg: {
      container: 'px-3.5 py-1.5 text-sm gap-2 border-2',
      icon: 'w-4.5 h-4.5',
      dot: 'w-2.5 h-2.5',
    },
  }[size];

  const IconComponent = config.icon;

  return (
    <span
      id={id || `badge-credential-status-${statusStr.toLowerCase() || 'unknown'}`}
      className={`inline-flex items-center rounded-full font-mono font-bold tracking-wide uppercase backdrop-blur-md transition-all duration-200 select-none ${config.glassClass} ${sizeStyles.container} ${className}`}
    >
      {showDot && (
        <span
          className={`rounded-full flex-shrink-0 ${config.dotClass} ${sizeStyles.dot} ${
            config.pulse ? 'animate-pulse' : ''
          }`}
        />
      )}
      {showIcon && <IconComponent className={`${sizeStyles.icon} flex-shrink-0`} />}
      <span className="whitespace-nowrap">
        {prefix && <span className="opacity-75 font-normal mr-1">{prefix}</span>}
        {config.label}
      </span>
    </span>
  );
};
