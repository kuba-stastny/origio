// TopBar.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BsExclamationTriangleFill,
  BsCheck2,
  BsFillSendFill,
  BsLaptopFill,
  BsPhoneFill,
  BsPersonFill,
  BsFillGridFill,
  BsBarChartFill,
  BsGearWideConnected,
  BsChatDotsFill,
  BsBugFill,
  BsFillPenFill,
  BsBoxArrowUpRight,
} from 'react-icons/bs';
import { IoLockClosed } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiPanel } from '@/store/ui-panel';
import PublishSuccessModal from './PublishSuccessModal';
import { useBuilderStore, type PublishMode } from '@/store/builder-store';

type BusyState = 'idle' | 'busy' | 'success' | 'error';
export type DeviceKey = 'desktop' | 'mobile';

export type TopBarProps = {
  projectId: string;
  projectSlug: string;
  onSave: () => Promise<void> | void;
  onPublish: () => Promise<void> | void;
  saveState: BusyState;
  publishState: BusyState;
  device?: DeviceKey;
  onDeviceChange?: (d: DeviceKey) => void;
};

const Spinner = () => (
  <motion.span
    className="inline-block align-middle"
    animate={{ rotate: 360 }}
    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
  >
    <svg width="14" height="14" viewBox="0 0 50 50">
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M25 5 a20 20 0 0 1 0 40"
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
      />
    </svg>
  </motion.span>
);

function btnBase(disabled?: boolean) {
  return [
    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
  ].join(' ');
}

function clampSlug(s: string, max = 22) {
  if (!s) return s;
  if (s.length <= max) return s;
  return s.slice(0, Math.max(8, max - 1)) + '…';
}

function MobileIconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900/40 text-zinc-200 ring-1 ring-zinc-800/60 hover:bg-zinc-900/70 transition"
    >
      {children}
    </button>
  );
}

/** ✅ Tooltip s blur/fade/scale animací (hover) */
function HoverTip({ label, show }: { label: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.span
          initial={{ opacity: 0, y: 8, scale: 0.96, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 8, scale: 0.96, filter: 'blur(6px)' }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="pointer-events-none z-[999] absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-[11px] font-semibold text-zinc-200 shadow-lg"
        >
          {label}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

/** ✅ Generic wrapper pro tooltip na hover (pro button i link) */
function TipWrap({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      <HoverTip label={label} show={hover} />
    </div>
  );
}

function IconBtnWithTip({
  title,
  onClick,
  children,
  className = '',
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TipWrap label={title}>
      <motion.button
        onClick={onClick}
        className={[
          'bg-zinc-800/50 font-light hover:bg-zinc-800/70 transition-all rounded-lg p-2 cursor-pointer',
          className,
        ].join(' ')}
        aria-label={title}
        type="button"
      >
        {children}
      </motion.button>
    </TipWrap>
  );
}

/** ✅ Link button se stejným stylem + tooltip */
function IconLinkWithTip({
  title,
  href,
  children,
  className = '',
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TipWrap label={title}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={title}
        aria-label={title}
        className={[
          'inline-flex bg-zinc-800/50 hover:bg-zinc-800/70 transition-all rounded-lg p-2 cursor-pointer text-zinc-200',
          className,
        ].join(' ')}
      >
        {children}
      </a>
    </TipWrap>
  );
}

export default function TopBar({
  projectId,
  projectSlug,
  onSave,
  onPublish,
  saveState,
  publishState,
  device = 'desktop',
  onDeviceChange,
}: TopBarProps) {
  const [slug, setSlug] = useState(projectSlug);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const { openLeft } = useUiPanel();

  const publishMode = useBuilderStore((s) => s.publishMode) as PublishMode;
  const publishStatusLoaded = useBuilderStore((s) => s.publishStatusLoaded);

  useEffect(() => setSlug(projectSlug), [projectSlug]);

  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<{ slug: string }>;
      if (ce.detail?.slug) setSlug(ce.detail.slug);
    }
    window.addEventListener('origio:slug-updated', handler);
    return () => window.removeEventListener('origio:slug-updated', handler);
  }, []);

  useEffect(() => {
    if (publishState === 'success') setShowPublishSuccess(true);
  }, [publishState]);

  const isChecking = !publishStatusLoaded;
  const busy = publishState === 'busy' || saveState === 'busy';
  const isPublished = publishMode === 'published';
  const publishDisabled = isChecking || busy || isPublished;

  const PublishIcon = () => {
    if (isChecking) return <Spinner />;
    if (publishState === 'busy') return <Spinner />;
    if (publishState === 'success')
      return <BsCheck2 className="h-[16px] w-[16px]" />;
    if (publishState === 'error')
      return <BsExclamationTriangleFill className="h-[16px] w-[16px]" />;
    return <BsFillSendFill className="h-[16px] w-[16px]" />;
  };

  const publishLabelIdle =
    publishMode === 'publish'
      ? 'Publikovat'
      : publishMode === 'publish_changes'
      ? 'Publikovat změny'
      : 'Publikováno';

  const publishLabel = isChecking
    ? 'Kontroluji…'
    : publishState === 'busy'
    ? 'Publikuji…'
    : publishState === 'success'
    ? 'Publikováno'
    : publishState === 'error'
    ? 'Chyba'
    : publishLabelIdle;

  const liveUrl = useMemo(() => `https://${slug}.origio.site`, [slug]);

  const DeviceBtn = ({
    k,
    title,
    Icon,
  }: {
    k: DeviceKey;
    title: string;
    Icon: React.ComponentType<{ className?: string }>;
  }) => {
    const active = device === k;
    return (
      <TipWrap label={title}>
        <button
          type="button"
          onClick={() => onDeviceChange?.(k)}
          aria-pressed={active}
          title={title}
          className={[
            'inline-flex cursor-pointer items-center rounded-lg px-2 py-[7px] text-sm transition-colors',
            active
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-300 hover:bg-zinc-900',
          ].join(' ')}
        >
          <Icon className="h-[16px] w-[16px]" />
        </button>
      </TipWrap>
    );
  };

  return (
    <>
      {/* ===================== DESKTOP (sm+) ===================== */}
      <div className="hidden sm:block">
        <div className="w-full relative bg-zinc-950 backdrop-blur">
          <div className="px-4 sm:px-5 py-3 sm:py-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-0 sm:grid-cols-3 items-center">
              {/* levá část */}
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => openLeft('hub')}
                  className="inline-flex items-center gap-2 rounded-2xl pr-2.5 cursor-pointer"
                  title="Origio"
                >
                  <img className="w-8" src="/images/logo2.png" alt="" />
                  <div className="flex flex-col leading-tight">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-zinc-100 font-semibold tracking-tight">
                        Origio
                      </span>
                      <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-2 text-[10px] font-semibold text-zinc-200">
                        BETA
                      </span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <IconBtnWithTip
                    title="Přehled"
                    onClick={() => openLeft('hub')}
                  >
                    <BsFillGridFill className="w-[18px] h-[18px] text-zinc-200" />
                  </IconBtnWithTip>

                  <IconBtnWithTip
                    title="Účet"
                    onClick={() => openLeft('account')}
                  >
                    <BsPersonFill className="w-[18px] h-[18px] text-zinc-200" />
                  </IconBtnWithTip>

                  <div className="hidden sm:block">
                    <IconBtnWithTip
                      title="Analytika"
                      onClick={() => openLeft('analytics')}
                    >
                      <BsBarChartFill className="w-[18px] h-[18px] text-zinc-100" />
                    </IconBtnWithTip>
                  </div>

                  <div className="hidden sm:block">
                    <IconBtnWithTip
                      title="Nastavení projektu"
                      onClick={() => openLeft('settings')}
                    >
                      <BsGearWideConnected className="w-[18px] h-[18px] text-zinc-100" />
                    </IconBtnWithTip>
                  </div>
                </div>
              </div>

              {/* prostředek */}
              <div className="flex items-center justify-between sm:justify-center gap-2">
                
                 {/* ✅ edit + link mimo pill (jako ostatní ikonky) */}
                 <div className="hidden sm:flex items-center gap-2">
                  <IconBtnWithTip
                    title="Upravit adresu"
                    onClick={() => openLeft('slug')}
                  >
                    <BsFillPenFill className="h-[16px] w-[16px] text-zinc-200" />
                  </IconBtnWithTip>
                </div>
                {/* URL pill */}
                <div className="flex w-full sm:w-auto items-center gap-2">
                  <div className="flex w-full sm:w-auto items-center gap-2 rounded-xl bg-zinc-800/20 px-9 py-[7px]">
                    <IoLockClosed className="w-5 h-5 text-zinc-700" />

                    <a
                      href={`https://${slug}.origio.site`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-left cursor-pointer"
                      title="Změnit adresu"
                    >
                      <div className="text-zinc-200 text-sm">
                        <span className="sm:hidden">
                          {clampSlug(slug, 16)}.origio.site
                        </span>
                        <span className="hidden sm:inline">
                          {slug}.origio.site
                        </span>
                      </div>
                    </a>
                  </div>
                </div>

               

                {/* device toggle */}
                <div className="hidden sm:inline-flex border-zinc-900 border-2 rounded-lg bg-zinc-950">
                  <DeviceBtn k="desktop" title="Desktop" Icon={BsLaptopFill} />
                  <DeviceBtn k="mobile" title="Mobil" Icon={BsPhoneFill} />
                </div>
              </div>

              {/* pravá část */}
              <div className="flex items-center justify-end gap-2 font-medium">
                <IconBtnWithTip
                  title="Feedback"
                  onClick={() => openLeft('feedback')}
                >
                  <BsChatDotsFill className="w-[18px] h-[18px] text-zinc-200" />
                </IconBtnWithTip>

                <IconBtnWithTip
                  title="Nahlásit chybu"
                  onClick={() => openLeft('bug-report')}
                >
                  <BsBugFill className="w-[18px] h-[18px] text-zinc-200" />
                </IconBtnWithTip>

                <button
                  onClick={() => {
                    if (publishDisabled) return;
                    onPublish();
                  }}
                  disabled={publishDisabled}
                  className={`${btnBase(publishDisabled)} ${
                    publishDisabled
                      ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-400/60'
                  }`}
                  aria-live="polite"
                  type="button"
                >
                  <span className="hidden sm:inline">{publishLabel}</span>
                  <span className="sm:hidden text-sm">
                    {publishState === 'busy' ? '…' : 'Publikovat'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MOBILE (<sm) ===================== */}
      <div className="sm:hidden">
        <div className="fixed top-0 left-0 right-0 z-[60] border-b border-zinc-900/70 bg-zinc-950/80 backdrop-blur">
          <div className="h-16 px-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => openLeft('hub')}
              className="h-9 w-9 inline-flex items-center justify-center rounded-2xl p-1.5 hover:bg-zinc-900/40 transition"
              title="Origio"
              aria-label="Origio"
            >
              <img
                className="h-9 w-9 object-contain"
                src="/images/logo2.png"
                alt="Origio"
              />
            </button>

            <button
              type="button"
              onClick={() => openLeft('slug')}
              className="min-w-0 w-full flex gap-2 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-left"
              title="Změnit adresu"
            >
              <IoLockClosed className="w-5 h-5 text-zinc-700" />
              <div className="truncate text-center text-sm text-zinc-100">
                {clampSlug(slug, 18)}.origio.site
              </div>
            </button>

            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              title="Otevřít doménu"
              aria-label="Otevřít doménu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900/30 text-zinc-200 hover:bg-zinc-900/50 transition-colors"
            >
              <BsBoxArrowUpRight className="h-3.5 w-3.5" />
            </a>

            <button
              onClick={() => {
                if (publishDisabled) return;
                onPublish();
              }}
              disabled={publishDisabled}
              className={[
                'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold',
                publishDisabled
                  ? 'bg-zinc-800 text-zinc-400'
                  : 'bg-zinc-100 text-zinc-900',
              ].join(' ')}
              type="button"
            >
              <PublishIcon />
              <span>{publishState === 'busy' ? '…' : 'Publikovat'}</span>
            </button>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-zinc-900/70 bg-zinc-950/85 backdrop-blur">
          <div className="h-16 px-2 flex items-center justify-between">
            <MobileIconBtn title="Přehled" onClick={() => openLeft('hub')}>
              <BsFillGridFill className="h-[18px] w-[18px]" />
            </MobileIconBtn>

            <MobileIconBtn title="Účet" onClick={() => openLeft('account')}>
              <BsPersonFill className="h-[18px] w-[18px]" />
            </MobileIconBtn>

            <MobileIconBtn
              title="Analytika"
              onClick={() => openLeft('analytics')}
            >
              <BsBarChartFill className="h-[18px] w-[18px]" />
            </MobileIconBtn>

            <MobileIconBtn
              title="Nastavení"
              onClick={() => openLeft('settings')}
            >
              <BsGearWideConnected className="h-[18px] w-[18px]" />
            </MobileIconBtn>

            <MobileIconBtn
              title="Feedback"
              onClick={() => openLeft('feedback')}
            >
              <BsChatDotsFill className="h-[18px] w-[18px]" />
            </MobileIconBtn>

            <MobileIconBtn title="Chyba" onClick={() => openLeft('bug-report')}>
              <BsBugFill className="h-[18px] w-[18px]" />
            </MobileIconBtn>
          </div>
        </div>

        <div className="h-16" />
      </div>

      <PublishSuccessModal
        open={showPublishSuccess}
        onClose={() => setShowPublishSuccess(false)}
        url={liveUrl}
      />
    </>
  );
}
