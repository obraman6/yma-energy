import React from 'react';

interface ConcentricSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  subtext?: string;
  logoSrc?: string;
  className?: string;
}

export const ConcentricSpinner: React.FC<ConcentricSpinnerProps> = ({
  size = 'md',
  text,
  subtext,
  logoSrc,
  className = '',
}) => {
  // Dimensions & border thickness mapping
  const config = {
    sm: {
      outer: 'w-8 h-8',
      inner: 'w-5 h-5',
      dot: 'w-2 h-2',
      logo: 'w-3 h-3',
      borderOuter: 'border-2',
      borderInner: 'border-2',
      shadow: 'shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    },
    md: {
      outer: 'w-12 h-12',
      inner: 'w-7 h-7',
      dot: 'w-3 h-3',
      logo: 'w-4 h-4',
      borderOuter: 'border-3',
      borderInner: 'border-2',
      shadow: 'shadow-[0_0_12px_rgba(251,191,36,0.9)]',
    },
    lg: {
      outer: 'w-16 h-16',
      inner: 'w-10 h-10',
      dot: 'w-4 h-4',
      logo: 'w-6 h-6',
      borderOuter: 'border-4',
      borderInner: 'border-3',
      shadow: 'shadow-[0_0_16px_rgba(251,191,36,0.95)]',
    },
    xl: {
      outer: 'w-24 h-24',
      inner: 'w-16 h-16',
      dot: 'w-6 h-6',
      logo: 'w-10 h-10',
      borderOuter: 'border-[5px]',
      borderInner: 'border-4',
      shadow: 'shadow-[0_0_24px_rgba(251,191,36,1)]',
    },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Concentric Double Spinner Container */}
      <div className={`relative flex items-center justify-center ${config.outer}`}>
        {/* 1. Pete ya Nje (Outer Blue Ring) - Inajizungusha kuelekea kulia (animate-spin) */}
        <div
          className={`absolute inset-0 rounded-full border-transparent border-t-blue-500 border-r-blue-600 border-b-blue-500/20 animate-spin ${config.borderOuter}`}
          style={{ borderStyle: 'solid' }}
        />

        {/* 2. Pete ya Ndani (Inner Emerald Ring) - Inajizungusha upande wa pili kuelekea kushoto ([animation-direction:reverse]) */}
        <div
          className={`absolute ${config.inner} rounded-full border-transparent border-b-emerald-500 border-l-emerald-600 border-t-emerald-500/20 animate-spin ${config.borderInner}`}
          style={{ borderStyle: 'solid', animationDirection: 'reverse' }}
        />

        {/* 3. Center Content: Logo image if provided, otherwise glowing gold dot */}
        {logoSrc ? (
          <div className={`${config.logo} flex items-center justify-center overflow-hidden`}>
            <img
              src={logoSrc}
              alt="Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div
            className={`${config.dot} rounded-full bg-amber-400 animate-pulse ${config.shadow}`}
          />
        )}
      </div>

      {/* Label Text */}
      {(text || subtext) && (
        <div className="text-center space-y-0.5">
          {text && (
            <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-wide animate-pulse">
              {text}
            </p>
          )}
          {subtext && (
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
