'use client';

import React from 'react';

// mini helper místo clsx
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function ShinyIcon({
  children,
  speed = 2.8,   // délka průjezdu pruhu (s)
  glow = true,   // jemná pulzující záře
  className = '',
}: {
  children: React.ReactNode;
  speed?: number;
  glow?: boolean;
  className?: string;
}) {
  return (
    <span className={cx('relative  mix-blend-difference inline-grid place-items-center', glow && 'shinyicon-glow', className)}>
      {/* Ikona */}
      <span className="relative z-[1] p-6">{children}</span>

      {/* Diagonální “shine” pruh */}
      <span
        className="pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-[12%]"
        style={{
          WebkitMaskImage: 'radial-gradient(circle, #000 62%, transparent 66%)',
          maskImage: 'radial-gradient(circle, #000 62%, transparent 66%)',
        }}
      >
        <span
          className="absolute -inset-y-2 -left-full w-[200%] rotate-[25deg] shinyicon-shine"
          style={{ animationDuration: `${speed}s` }}
        />
      </span>

      <style jsx>{`
        @keyframes shinySweep {
          0% {
            transform: translateX(-55%) rotate(25deg);
            opacity: 0.0;
          }
          10% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.35;
          }
          90% {
            opacity: 0.2;
          }
          100% {
            transform: translateX(55%) rotate(25deg);
            opacity: 0.0;
          }
        }
        .shinyicon-shine {
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.08) 40%,
            rgba(255, 255, 255, 0.55) 50%,
            rgba(255, 255, 255, 0.08) 60%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shinySweep 2.8s linear infinite;
        }

        @keyframes glowPulse {
          0% {
            opacity: 0.35;
            transform: scale(0.98);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.02);
          }
          100% {
            opacity: 0.35;
            transform: scale(0.98);
          }
        }
        .shinyicon-glow::before {
          content: '';
          position: absolute;
          inset: -10%;
          z-index: 0;
          background: radial-gradient(
            closest-side,
            rgba(255, 255, 255, 0.18),
            rgba(255, 255, 255, 0.04) 65%,
            transparent 70%
          );
          filter: blur(10px);
          animation: glowPulse 2.6s ease-in-out infinite;
        }
      `}</style>
    </span>
  );
}